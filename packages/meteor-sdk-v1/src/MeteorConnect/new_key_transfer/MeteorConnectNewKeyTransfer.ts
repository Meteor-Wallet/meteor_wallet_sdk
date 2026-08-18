import {
  createNewKeyTransferOpaqueId,
  hashNewKeyTransferStartInput,
  newKeyTransferAccountIdentityKey,
  validateNewKeyTransferStartOutputForInput,
  vMeteorAppId,
  vNewKeyTransferOpaqueId,
  vNewKeyTransferStartInputV1,
  vNewKeyTransferStartOutputV1,
  vSerializedCryptoKeyDataEd25519_Raw,
} from "@meteorwallet/connect-shared";
import * as v from "valibot";
import type { TMCActionRegistry } from "../action/mc_action.combined";
import type { TMCActionRequestUnion } from "../action/mc_action.types";
import type { MeteorConnect } from "../MeteorConnect";
import type {
  INewKeyTransferSdkSession,
  INewKeyTransferStartOptions,
  INewKeyTransferStartResult,
  INewKeyTransferVerifyOptions,
  INewKeyTransferVerifyResult,
} from "./new_key_transfer.types";

type TStartRequest = Extract<
  TMCActionRequestUnion<TMCActionRegistry>,
  { id: "meteor_wallet_core::new_key_account_transfer_start" }
>;
type TVerifyRequest = Extract<
  TMCActionRequestUnion<TMCActionRegistry>,
  { id: "meteor_wallet_core::new_key_account_transfer_verify_active" }
>;

const vTargetPlatform = v.picklist(["web", "mobile", "web_local_dev"]);
const vCanonicalInputHash = v.pipe(v.string(), v.length(44), v.regex(/^[A-Za-z0-9+/]{43}=$/u));
const vAccountIdentityKeys = v.pipe(
  v.array(
    v.pipe(
      v.string(),
      v.minLength(16),
      v.maxLength(90),
      v.regex(/^near::(?:mainnet|testnet)::[a-z0-9._-]{2,64}$/u),
    ),
  ),
  v.maxLength(50),
  v.check((keys) => new Set(keys).size === keys.length, "Duplicate account identity"),
);
const vWalletConnection = v.object({
  executionTarget: v.literal("v2_bridge_mobile"),
  schemaVersion: v.literal(1),
  bridgeEnvironmentId: v.pipe(v.string(), v.minLength(1), v.maxLength(256)),
  meteorAppId: vMeteorAppId,
  partnerClientId: v.pipe(v.string(), v.minLength(1), v.maxLength(256)),
  walletVerifyPublicKey: vSerializedCryptoKeyDataEd25519_Raw,
});
const vSession = v.object({
  formatVersion: v.literal(1),
  phase: v.picklist([
    "start_pending",
    "destination_keys_staged",
    "add_key_in_progress",
    "verification_pending",
    "destination_keys_verified",
  ]),
  targetPlatform: vTargetPlatform,
  clientTransferId: vNewKeyTransferOpaqueId,
  canonicalInputHash: vCanonicalInputHash,
  startRequest: vNewKeyTransferStartInputV1,
  startOutput: v.optional(vNewKeyTransferStartOutputV1),
  walletConnection: v.optional(vWalletConnection),
  addKeyIntentAccounts: vAccountIdentityKeys,
  verifiedAccounts: vAccountIdentityKeys,
  updatedAt: v.pipe(v.number(), v.integer(), v.minValue(1)),
});
const vSessions = v.pipe(v.array(vSession), v.maxLength(100));
const JOURNAL_LOCK_NAME = "meteor-wallet-sdk::new-key-transfer-journal::v1";
const journalOperationLocks = new Map<string, Promise<unknown>>();

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const hasOnlyKeys = (value: unknown, allowedKeys: readonly string[]): boolean => {
  const record = asRecord(value);
  if (record == null) return false;
  const allowed = new Set(allowedKeys);
  return Object.keys(record).every((key) => allowed.has(key));
};

const hasStrictStartRequestShape = (value: unknown): boolean => {
  const request = asRecord(value);
  return (
    request != null &&
    hasOnlyKeys(request, ["formatVersion", "clientTransferId", "accounts"]) &&
    Array.isArray(request.accounts) &&
    request.accounts.every((account) =>
      hasOnlyKeys(account, ["blockchainId", "networkId", "accountId", "sourcePublicKey"]),
    )
  );
};

const hasStrictStartOutputShape = (value: unknown): boolean => {
  const output = asRecord(value);
  return (
    output != null &&
    hasOnlyKeys(output, ["formatVersion", "clientTransferId", "transferSessionId", "accounts"]) &&
    Array.isArray(output.accounts) &&
    output.accounts.every((account) => {
      const row = asRecord(account);
      return row?.ok === true
        ? hasOnlyKeys(row, [
            "blockchainId",
            "networkId",
            "accountId",
            "ok",
            "destinationSignerType",
            "destinationPublicKey",
          ])
        : row?.ok === false &&
            hasOnlyKeys(row, ["blockchainId", "networkId", "accountId", "ok", "issue"]);
    })
  );
};

const hasStrictStoredSessionShape = (value: unknown): boolean => {
  const session = asRecord(value);
  if (
    session == null ||
    !hasOnlyKeys(session, [
      "formatVersion",
      "phase",
      "targetPlatform",
      "clientTransferId",
      "canonicalInputHash",
      "startRequest",
      "startOutput",
      "walletConnection",
      "addKeyIntentAccounts",
      "verifiedAccounts",
      "updatedAt",
    ]) ||
    !hasStrictStartRequestShape(session.startRequest)
  ) {
    return false;
  }
  if (session.startOutput != null && !hasStrictStartOutputShape(session.startOutput)) return false;
  return (
    session.walletConnection == null ||
    hasOnlyKeys(session.walletConnection, [
      "executionTarget",
      "schemaVersion",
      "bridgeEnvironmentId",
      "meteorAppId",
      "partnerClientId",
      "walletVerifyPublicKey",
    ])
  );
};

const successfulAccountKeys = (session: INewKeyTransferSdkSession): Set<string> =>
  new Set(
    session.startOutput?.accounts
      .filter((account) => account.ok)
      .map(newKeyTransferAccountIdentityKey) ?? [],
  );

const validateStoredSessions = (value: unknown): INewKeyTransferSdkSession[] => {
  if (!Array.isArray(value) || !value.every(hasStrictStoredSessionShape)) {
    throw new Error("new_key_transfer_journal_corrupt");
  }
  const parsed = v.safeParse(vSessions, value);
  if (!parsed.success) throw new Error("new_key_transfer_journal_corrupt");

  const clientTransferIds = new Set<string>();
  const transferSessionIds = new Set<string>();
  for (const session of parsed.output) {
    if (
      clientTransferIds.has(session.clientTransferId) ||
      session.startRequest.clientTransferId !== session.clientTransferId ||
      hashNewKeyTransferStartInput(session.startRequest) !== session.canonicalInputHash
    ) {
      throw new Error("new_key_transfer_journal_corrupt");
    }
    clientTransferIds.add(session.clientTransferId);

    if (session.phase === "start_pending") {
      if (
        session.startOutput != null ||
        session.walletConnection != null ||
        session.addKeyIntentAccounts.length > 0 ||
        session.verifiedAccounts.length > 0
      ) {
        throw new Error("new_key_transfer_journal_corrupt");
      }
      continue;
    }
    if (session.startOutput == null || session.walletConnection == null) {
      throw new Error("new_key_transfer_journal_corrupt");
    }
    validateNewKeyTransferStartOutputForInput({
      request: session.startRequest,
      output: session.startOutput,
    });
    if (transferSessionIds.has(session.startOutput.transferSessionId)) {
      throw new Error("new_key_transfer_journal_corrupt");
    }
    transferSessionIds.add(session.startOutput.transferSessionId);

    const successful = successfulAccountKeys(session);
    if (
      session.addKeyIntentAccounts.some((key) => !successful.has(key)) ||
      session.verifiedAccounts.some((key) => !session.addKeyIntentAccounts.includes(key)) ||
      (session.phase === "destination_keys_staged" &&
        (session.addKeyIntentAccounts.length > 0 || session.verifiedAccounts.length > 0)) ||
      (session.phase === "add_key_in_progress" && session.addKeyIntentAccounts.length === 0) ||
      (session.phase === "verification_pending" && session.addKeyIntentAccounts.length === 0) ||
      (session.phase === "destination_keys_verified" &&
        (session.addKeyIntentAccounts.length === 0 ||
          session.addKeyIntentAccounts.some((key) => !session.verifiedAccounts.includes(key))))
    ) {
      throw new Error("new_key_transfer_journal_corrupt");
    }
  }
  return parsed.output;
};

/**
 * Secret-free orchestration journal for the new-key transfer. Wallet authorship and output-hash
 * checks remain in the mobile bridge adapter; this layer adds schema/set integrity, replay,
 * exact-wallet routing, and phase-aware host state.
 */
export class MeteorConnectNewKeyTransfer {
  private enabled = false;

  constructor(private readonly meteorConnect: MeteorConnect) {}

  configure(enabled: boolean): void {
    this.enabled = enabled;
  }

  private requireEnabled(): void {
    if (!this.enabled) throw new Error("new_key_transfer_unavailable");
  }

  private async readSessions(): Promise<INewKeyTransferSdkSession[]> {
    const stored = await this.meteorConnect.storage.getJson("newKeyTransferSessions");
    return stored == null ? [] : validateStoredSessions(stored);
  }

  private async writeSessions(sessions: INewKeyTransferSdkSession[]): Promise<void> {
    await this.meteorConnect.storage.setJson(
      "newKeyTransferSessions",
      validateStoredSessions(sessions),
    );
  }

  private async replaceSession(session: INewKeyTransferSdkSession): Promise<void> {
    const sessions = await this.readSessions();
    const next = sessions.filter(
      (candidate) => candidate.clientTransferId !== session.clientTransferId,
    );
    next.push(session);
    await this.writeSessions(next);
  }

  private async withInProcessLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const previous = journalOperationLocks.get(key) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    const queued = previous.then(() => current);
    journalOperationLocks.set(key, queued);
    await previous;
    try {
      return await operation();
    } finally {
      release();
      if (journalOperationLocks.get(key) === queued) journalOperationLocks.delete(key);
    }
  }

  private async withJournalLock<T>(operation: () => Promise<T>): Promise<T> {
    return this.withInProcessLock(JOURNAL_LOCK_NAME, async () => {
      if (typeof navigator !== "undefined" && navigator.locks != null) {
        return navigator.locks.request(JOURNAL_LOCK_NAME, { mode: "exclusive" }, operation);
      }
      return operation();
    });
  }

  async getSessions(): Promise<INewKeyTransferSdkSession[]> {
    return this.readSessions();
  }

  async start(options: INewKeyTransferStartOptions): Promise<INewKeyTransferStartResult> {
    this.requireEnabled();
    const request = v.parse(vNewKeyTransferStartInputV1, {
      formatVersion: 1,
      clientTransferId: options.clientTransferId ?? createNewKeyTransferOpaqueId(),
      accounts: options.accounts,
    });
    return this.withJournalLock(async () => {
      const canonicalInputHash = hashNewKeyTransferStartInput(request);
      const existing = (await this.readSessions()).find(
        (session) => session.clientTransferId === request.clientTransferId,
      );
      if (existing != null) {
        if (
          existing.canonicalInputHash !== canonicalInputHash ||
          existing.targetPlatform !== options.targetPlatform
        ) {
          throw new Error("new_key_transfer_client_id_conflict");
        }
        if (existing.startOutput != null)
          return { output: existing.startOutput, session: existing };
      }

      const pending: INewKeyTransferSdkSession = existing ?? {
        formatVersion: 1,
        phase: "start_pending",
        targetPlatform: options.targetPlatform,
        clientTransferId: request.clientTransferId,
        canonicalInputHash,
        startRequest: request,
        addKeyIntentAccounts: [],
        verifiedAccounts: [],
        updatedAt: Date.now(),
      };
      await this.replaceSession(pending);

      const action = await this.meteorConnect.createAction<TStartRequest>({
        id: "meteor_wallet_core::new_key_account_transfer_start",
        input: request,
      });
      action.setTransferTarget({ platform: options.targetPlatform });
      const output = await action.promptForExecution();
      const walletConnection = action.getCompletedMobileConnection();
      if (walletConnection == null) throw new Error("new_key_transfer_wallet_binding_missing");
      const completed: INewKeyTransferSdkSession = {
        ...pending,
        phase: "destination_keys_staged",
        startOutput: output,
        walletConnection,
        updatedAt: Date.now(),
      };
      await this.replaceSession(completed);
      return { output, session: completed };
    });
  }

  async markAddKeyIntent(input: {
    transferSessionId: string;
    accounts: Array<{ blockchainId: string; networkId: string; accountId: string }>;
  }): Promise<INewKeyTransferSdkSession> {
    return this.withJournalLock(async () => {
      const session = (await this.readSessions()).find(
        (candidate) => candidate.startOutput?.transferSessionId === input.transferSessionId,
      );
      if (session == null) throw new Error("new_key_transfer_session_not_found");
      const successful = successfulAccountKeys(session);
      const intentKeys = input.accounts.map(newKeyTransferAccountIdentityKey);
      if (intentKeys.some((key) => !successful.has(key))) {
        throw new Error("new_key_transfer_add_key_account_mismatch");
      }
      const updated: INewKeyTransferSdkSession = {
        ...session,
        phase: "add_key_in_progress",
        addKeyIntentAccounts: [...new Set([...session.addKeyIntentAccounts, ...intentKeys])],
        updatedAt: Date.now(),
      };
      await this.replaceSession(updated);
      return updated;
    });
  }

  /**
   * Acknowledge that the host has finalized removal of the exact destination keys for these
   * accounts. This is deliberately separate from `clear`: the SDK only releases its recovery
   * fence after the caller has reconciled on-chain absence of every key it may have submitted.
   */
  async markDestinationKeysRevoked(input: {
    transferSessionId: string;
    accounts: Array<{ blockchainId: string; networkId: string; accountId: string }>;
  }): Promise<INewKeyTransferSdkSession> {
    return this.withJournalLock(async () => {
      const session = (await this.readSessions()).find(
        (candidate) => candidate.startOutput?.transferSessionId === input.transferSessionId,
      );
      if (session == null) throw new Error("new_key_transfer_session_not_found");

      const revokedKeys = [...new Set(input.accounts.map(newKeyTransferAccountIdentityKey))];
      if (revokedKeys.length === 0) {
        throw new Error("new_key_transfer_revoked_accounts_required");
      }
      if (revokedKeys.some((key) => !session.addKeyIntentAccounts.includes(key))) {
        throw new Error("new_key_transfer_revoke_account_mismatch");
      }

      const addKeyIntentAccounts = session.addKeyIntentAccounts.filter(
        (key) => !revokedKeys.includes(key),
      );
      const verifiedAccounts = session.verifiedAccounts.filter((key) => !revokedKeys.includes(key));
      const allRemainingVerified =
        addKeyIntentAccounts.length > 0 &&
        addKeyIntentAccounts.every((key) => verifiedAccounts.includes(key));
      const updated: INewKeyTransferSdkSession = {
        ...session,
        phase:
          addKeyIntentAccounts.length === 0
            ? "destination_keys_staged"
            : allRemainingVerified
              ? "destination_keys_verified"
              : "add_key_in_progress",
        addKeyIntentAccounts,
        verifiedAccounts,
        updatedAt: Date.now(),
      };
      await this.replaceSession(updated);
      return updated;
    });
  }

  async verifyActive(options: INewKeyTransferVerifyOptions): Promise<INewKeyTransferVerifyResult> {
    this.requireEnabled();
    return this.withJournalLock(async () => {
      const session = (await this.readSessions()).find(
        (candidate) => candidate.startOutput?.transferSessionId === options.transferSessionId,
      );
      if (session?.walletConnection == null) throw new Error("new_key_transfer_session_not_found");
      const activationKeys = options.activations.map(newKeyTransferAccountIdentityKey);
      if (activationKeys.some((key) => !session.addKeyIntentAccounts.includes(key))) {
        throw new Error("new_key_transfer_verify_before_add_key_intent");
      }
      const request = {
        formatVersion: 1,
        transferSessionId: options.transferSessionId,
        activations: options.activations,
      } as const;
      const pending: INewKeyTransferSdkSession = {
        ...session,
        phase: "verification_pending",
        updatedAt: Date.now(),
      };
      await this.replaceSession(pending);

      const action = await this.meteorConnect.createAction<TVerifyRequest>({
        id: "meteor_wallet_core::new_key_account_transfer_verify_active",
        input: request,
      });
      action.setTransferTarget({
        platform: session.targetPlatform,
        walletConnection: session.walletConnection,
      });
      const output = await action.promptForExecution();
      const newlyVerified = output.accounts
        .filter((account) => account.activation === "verified")
        .map(newKeyTransferAccountIdentityKey);
      const verifiedAccounts = [...new Set([...session.verifiedAccounts, ...newlyVerified])];
      const allSuccessfulVerified = [...successfulAccountKeys(session)].every((key) =>
        verifiedAccounts.includes(key),
      );
      const completed: INewKeyTransferSdkSession = {
        ...pending,
        phase: allSuccessfulVerified ? "destination_keys_verified" : "verification_pending",
        verifiedAccounts,
        updatedAt: Date.now(),
      };
      await this.replaceSession(completed);
      return { output, session: completed };
    });
  }

  async clear(clientTransferId: string): Promise<void> {
    await this.withJournalLock(async () => {
      const sessions = await this.readSessions();
      const session = sessions.find((candidate) => candidate.clientTransferId === clientTransferId);
      if (session == null) return;
      if (session.addKeyIntentAccounts.length > 0) {
        throw new Error("new_key_transfer_recovery_required");
      }
      await this.writeSessions(
        sessions.filter((candidate) => candidate.clientTransferId !== clientTransferId),
      );
    });
  }
}
