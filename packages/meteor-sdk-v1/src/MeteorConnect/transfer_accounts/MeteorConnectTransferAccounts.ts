import { describeSessionError } from "@meteorwallet/connect";
import {
  buildAccountsTransferRequestData,
  EErr_Bridge_Session,
  type TAccountBasicData,
  type TAccountTransferDataDecrypted,
  type TAllAccountsTransferDataDecrypted,
} from "@meteorwallet/connect-shared";
import type { ExecutableAction } from "../action/ExecutableAction";
import type { TMCActionRegistry } from "../action/mc_action.combined";
import type { TMCActionRequestUnion } from "../action/mc_action.types";
import type { MeteorConnect } from "../MeteorConnect";
import type { IMeteorConnectTransferAccountsConfig } from "../MeteorConnect.types";
import { MOBILE_BRIDGE_ENDING } from "../target_clients/mobile_bridge/MobileBridgeSession";
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

/**
 * Typed `merr_bridge_session` / `merr_bridge` ids that mean this integration is wrong rather than
 * that a flow ended: a session the policy refuses, a disabled surface, an oversized request, a
 * divergent replay. They are thrown so an integrator sees them; everything else the protocol can
 * reject with is a user- or wallet-driven ending the caller can act on.
 */
const INTEGRATION_REJECTION_IDS: ReadonlySet<string> = new Set([
  EErr_Bridge_Session.action_ineligible,
  EErr_Bridge_Session.conflicting_replay,
  EErr_Bridge_Session.recovery_contract_mismatch,
  EErr_Bridge_Session.request_too_large,
  EErr_Bridge_Session.resource_profile_not_permitted,
  EErr_Bridge_Session.session_disabled,
  EErr_Bridge_Session.session_unsupported,
]);

/** Deadline ids: the session ran out with no signed result — the `expired` outcome. */
const EXPIRY_REJECTION_IDS: ReadonlySet<string> = new Set([
  EErr_Bridge_Session.absolute_expired,
  EErr_Bridge_Session.idle_expired,
]);

/**
 * Map one flow rejection onto the public outcome union.
 *
 * Two sources, no message matching on either. This SDK's own flow endings are the shared
 * `MOBILE_BRIDGE_ENDING` sentinels; every failure that came from the protocol or the transport is
 * classified once through `describeSessionError` and read by `kind` / `ids` — the `mobile_bridge_*`
 * prefix test and the `^[merr_bridge](…)` regex this used to carry are both gone.
 *
 * Exported for tests only — not re-exported from the package index.
 */
export function mapRejectionToOutcome(error: unknown): TTransferAccountsOutcome {
  const message = error instanceof Error ? error.message : String(error);
  switch (message) {
    case MOBILE_BRIDGE_ENDING.cancelled:
    // The action UI's own cancel, raised before any bridge exists.
    case "Action was cancelled":
      return { status: "cancelled" };
    case MOBILE_BRIDGE_ENDING.expired:
      return { status: "expired" };
    case MOBILE_BRIDGE_ENDING.pinAttemptsExceeded:
      return { status: "failed", reason: "pin_attempts_exhausted" };
    case MOBILE_BRIDGE_ENDING.identityPinMismatch:
    case MOBILE_BRIDGE_ENDING.disposed:
    case MOBILE_BRIDGE_ENDING.failed:
      return { status: "failed", reason: "bridge_failed" };
  }
  // A signed typed-error result. `transfer_accounts` signals a real decline as
  // successResult({ success: false }), so an error result here is a wallet-side failure.
  if (message.startsWith(`${MOBILE_BRIDGE_ENDING.walletDeclined}:`)) {
    return { status: "failed", reason: "bridge_failed" };
  }

  const described = describeSessionError(error);
  switch (described.kind) {
    case "terminal":
      // The bridge was released permanently before a result was accepted.
      return described.outcome.reason === "bridge_gone"
        ? { status: "expired" }
        : { status: "failed", reason: "bridge_failed" };
    case "session":
    case "bridge": {
      const rejected = described.ids.find((id) => INTEGRATION_REJECTION_IDS.has(id));
      if (rejected != null) {
        throw new Error(`transfer_accounts_backend_rejected: ${rejected}`);
      }
      if (described.ids.some((id) => EXPIRY_REJECTION_IDS.has(id))) return { status: "expired" };
      if (described.ids.includes(EErr_Bridge_Session.wallet_update_required)) {
        return { status: "failed", reason: "wallet_update_required" };
      }
      if (described.ids.includes(EErr_Bridge_Session.pin_incorrect)) {
        return { status: "failed", reason: "pin_attempts_exhausted" };
      }
      return { status: "failed", reason: "bridge_failed" };
    }
    case "connection":
      // `bridge_gone` classifies here too: the backend is fine but this session no longer exists,
      // which with no signed result is exactly the `expired` ending. Anything else is a transport
      // failure that says nothing about the transfer itself.
      return described.connection.kind === "bridge_gone"
        ? { status: "expired" }
        : { status: "failed", reason: "bridge_failed" };
    default:
      // A local guard or an unrecognized error: an integration problem, never a flow ending.
      throw error;
  }
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
   * Drop the in-memory staged set without touching persisted data — called from
   * `MeteorConnect.disposeMobileBridge()`. Safe before initialize: there is simply nothing staged.
   */
  dropStagedFromMemory(): void {
    this.staging?.dropInMemory();
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
