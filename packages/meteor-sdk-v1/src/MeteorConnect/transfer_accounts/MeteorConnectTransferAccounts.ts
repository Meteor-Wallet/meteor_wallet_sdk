import {
  buildAccountsTransferRequestData,
  type TAccountBasicData,
  type TAccountTransferDataDecrypted,
  type TAllAccountsTransferDataDecrypted,
} from "@meteorwallet/connect-shared";
import type { ExecutableAction } from "../action/ExecutableAction";
import type { TMCActionRegistry } from "../action/mc_action.combined";
import type { TMCActionRequestUnion } from "../action/mc_action.types";
import type { MeteorConnect } from "../MeteorConnect";
import type { IMeteorConnectTransferAccountsConfig } from "../MeteorConnect.types";
import { TransferAccountsStaging } from "./TransferAccountsStaging";
import { TransferSensitiveAttachment } from "./TransferSensitiveAttachment";
import type {
  IStageTransferAccountInput,
  ITransferAccountsPromptOptions,
  TStagedTransferAccountSummary,
  TStageTransferAccountResult,
  TTransferAccountsOutcome,
} from "./transfer_accounts.types";

type TTransferActionRequest = Extract<
  TMCActionRequestUnion<TMCActionRegistry>,
  { id: "meteor_wallet_core::transfer_accounts" }
>;
export type TTransferExecutableAction = ExecutableAction<TTransferActionRequest>;

/**
 * UI-internal bridge from an action to its sensitive attachment — used ONLY by the transfer
 * popup container to reach the reveal handle. Module-level WeakMap: never serialized, never on
 * the action object itself, unreachable without importing this module (pinned by the
 * key-confinement lint).
 */
const attachmentsByAction = new WeakMap<object, TransferSensitiveAttachment>();

export function getTransferAttachmentForAction(
  action: object,
): TransferSensitiveAttachment | undefined {
  return attachmentsByAction.get(action);
}

/** Rejections that indicate misconfiguration/integrity failure — rethrown, never mapped. */
const RETHROWN_MESSAGES = new Set([
  "mobile_bridge_wallet_signature_invalid",
  "mobile_bridge_invalid_action_result",
  "mobile_bridge_action_result_mismatch",
  "mobile_bridge_output_hash_mismatch",
  "mobile_bridge_unsupported_action_result",
  "mobile_bridge_transfer_attachment_missing",
  "transfer_accounts_attachment_disposed",
]);

/**
 * Backend create_bridge rejections surface as NiceError messages prefixed
 * `[merr_bridge](<ids>) …` (no id-classifier exists SDK-side — match the documented prefix).
 */
function classifyBackendRejection(message: string): string | undefined {
  const match = /^\[merr_bridge(?:_pairing)?\]\(([^)]*)\)/.exec(message);
  if (match == null) return undefined;
  const ids = match[1].split(",").map((id) => id.trim());
  const known = ids.find((id) => id === "invalid_action_request" || id === "idempotency_conflict");
  return known ?? undefined;
}

/** Exported for tests only — not re-exported from the package index. */
export function mapRejectionToOutcome(error: unknown): TTransferAccountsOutcome {
  const message = error instanceof Error ? error.message : String(error);
  if (RETHROWN_MESSAGES.has(message)) throw error;
  const backendRejection = classifyBackendRejection(message);
  if (backendRejection != null) {
    throw new Error(`transfer_accounts_backend_rejected: ${backendRejection}`);
  }
  if (message === "Action was cancelled" || message === "mobile_bridge_cancelled") {
    return { status: "cancelled" };
  }
  if (message === "mobile_bridge_expired") return { status: "expired" };
  if (message === "PIN attempts exceeded") {
    return { status: "failed", reason: "pin_attempts_exhausted" };
  }
  if (message === "wallet_update_required") {
    return { status: "failed", reason: "wallet_update_required" };
  }
  if (message.startsWith("mobile_bridge_")) return { status: "failed", reason: "bridge_failed" };
  throw error;
}

/**
 * The public transfer surface (`meteorConnect.transferAccounts`): staging + the one-shot popup
 * flow. Flow endings resolve to a typed outcome; integration errors throw (§ error semantics).
 */
export class MeteorConnectTransferAccounts {
  private staging?: TransferAccountsStaging;
  private config?: IMeteorConnectTransferAccountsConfig;

  constructor(private readonly meteorConnect: MeteorConnect) {}

  /** Called from MeteorConnect.initialize — staging works regardless of the enabled flag. */
  configure(config: IMeteorConnectTransferAccountsConfig | undefined): void {
    this.config = config;
    this.staging = new TransferAccountsStaging({
      persist: config?.persistStagedAccounts === true,
      getStorage: () => this.meteorConnect.storage,
      maxAccounts: config?.maxStagedAccounts,
    });
  }

  private getStaging(): TransferAccountsStaging {
    if (this.staging == null) throw new Error("meteor_connect_not_initialized");
    return this.staging;
  }

  /**
   * Stages a secret for an account. Staging the same (blockchainId, networkId, accountId) tuple
   * again ADDS the secret to that account's secret array (schema: 1..10, deduped) — it does not
   * replace the account. Use removeStaged to start an account over.
   */
  async stage(input: IStageTransferAccountInput): Promise<TStageTransferAccountResult> {
    return this.getStaging().stage(input);
  }

  async getStagedSummaries(): Promise<TStagedTransferAccountSummary[]> {
    return this.getStaging().getStagedSummaries();
  }

  /** Hazard is in the name — full staged shape including plaintext secrets. */
  async getStagedWithSecrets(): Promise<TAccountTransferDataDecrypted[]> {
    return this.getStaging().getStagedWithSecrets();
  }

  async removeStaged(identifier: TAccountBasicData): Promise<void> {
    return this.getStaging().removeStaged(identifier);
  }

  async clearStaged(): Promise<void> {
    return this.getStaging().clearStaged();
  }

  /**
   * Escape hatch for advanced integrations: the raw ExecutableAction with wire output
   * { success: boolean }; rejects on cancel/expiry like every other action.
   */
  async createAction(options?: ITransferAccountsPromptOptions): Promise<TTransferExecutableAction> {
    return (await this.createActionInternal(options)).action;
  }

  private async createActionInternal(options?: ITransferAccountsPromptOptions): Promise<{
    action: TTransferExecutableAction;
    attachment: TransferSensitiveAttachment;
  }> {
    if (this.config?.enabled !== true) throw new Error("transfer_accounts_unavailable");

    const accounts = options?.accounts ?? (await this.getStaging().getStagedWithSecrets());
    if (accounts.length === 0) throw new Error("transfer_accounts_nothing_staged");

    const decrypted: TAllAccountsTransferDataDecrypted = { formatVersion: 1, accounts };

    // Initial build: validates the full set against the shared schemas and provides the
    // registry-typed encrypted input. Its key is never retained — the adapter regenerates a
    // fresh key + ciphertext for every bridge from the attachment (§ per-bridge regeneration).
    let initialBuild: Awaited<ReturnType<typeof buildAccountsTransferRequestData>>;
    try {
      initialBuild = await buildAccountsTransferRequestData({ decrypted });
    } catch (error) {
      throw new Error(
        `transfer_accounts_invalid_input: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const action = (await this.meteorConnect.createAction({
      id: "meteor_wallet_core::transfer_accounts",
      input: initialBuild.actionInput,
    } as TTransferActionRequest)) as TTransferExecutableAction;

    const attachment = new TransferSensitiveAttachment(decrypted);
    action.setSensitiveTransferSource(attachment);
    attachmentsByAction.set(action, attachment);
    return { action, attachment };
  }

  /**
   * The one-shot flow: stage → prompt() → switch on outcome.status. Every user- or
   * wallet-driven ending resolves; only integration/config errors throw.
   */
  async prompt(options?: ITransferAccountsPromptOptions): Promise<TTransferAccountsOutcome> {
    const { action, attachment } = await this.createActionInternal(options);
    try {
      const output = await action.promptForExecution();
      if (output.success) {
        // Opt-in only: staged accounts remain by default so they can be transferred to other
        // platforms too — emptying the set behind the user's back is surprising.
        if (this.config?.clearStagedOnSuccess === true && options?.accounts == null) {
          await this.clearStaged();
        }
        return { status: "imported" };
      }
      return { status: "declined" };
    } catch (error) {
      return mapRejectionToOutcome(error);
    } finally {
      // Every terminal outcome (and every thrown integration error) drops the key material and
      // the decrypted snapshot.
      attachment.dispose();
    }
  }
}
