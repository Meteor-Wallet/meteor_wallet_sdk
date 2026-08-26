import {
  createAddKeyJournalRunner,
  createNewKeyTransferOpaqueId,
  hashNewKeyTransferStartInput,
  type IAddKeyJournalChain,
  type IAddKeyJournalJob,
  type IAddKeyJournalRunner,
  type IAddKeyJournalStorageKeys,
  type IAddKeyJournalStorageMethods,
  newKeyTransferAccountIdentityKey,
  newKeyTransferProtectedOperations,
  parseNewKeyTransferStartOutputV1,
  type TNewKeyTransferStartOutputAccountV1,
  type TNewKeyTransferStartOutputV1,
  type TNewKeyTransferVerifyActiveInputV1,
  type TNewKeyTransferVerifyActiveOutputV1,
  validateNewKeyTransferStartOutputForInput,
  validateNewKeyTransferVerifyActiveOutputForInput,
  vMeteorAppId,
  vNewKeyTransferOpaqueId,
  vNewKeyTransferStartInputV1,
  vNewKeyTransferStartOutputV1,
  vSerializedCryptoKeyDataEd25519_Raw,
} from "@meteorwallet/connect-shared";
import { stringifyCanonicalJson } from "@nice-code/util";
import * as v from "valibot";
import type { TMCActionRegistry } from "../action/mc_action.combined";
import type { TMCActionRequestUnion } from "../action/mc_action.types";
import type { MeteorConnect } from "../MeteorConnect";
import { METEOR_CONNECT_STORAGE_KEY_PREFIX } from "../MeteorConnect.static";
import type { IMobileBridgeExternalWorkHold } from "../target_clients/mobile_bridge/MeteorConnectMobileBridgeClient.types";
import type {
  INewKeyTransferAddKeyOptions,
  INewKeyTransferAddKeyResult,
  INewKeyTransferArchiveOptions,
  INewKeyTransferReconcileOptions,
  INewKeyTransferReconcileResult,
  INewKeyTransferReconciliationReport,
  INewKeyTransferRecoveryState,
  INewKeyTransferSdkSession,
  INewKeyTransferStartOptions,
  INewKeyTransferStartResult,
  INewKeyTransferVerifyOptions,
  INewKeyTransferVerifyResult,
} from "./new_key_transfer.types";
import { NewKeyTransferError } from "./new_key_transfer_errors";

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
    "verification_pending_wallet",
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
  securedAccounts: vAccountIdentityKeys,
  pendingCompletionAccounts: vAccountIdentityKeys,
  updatedAt: v.pipe(v.number(), v.integer(), v.minValue(1)),
});
const MAX_JOURNAL_SESSIONS = 100;
const vSessions = v.pipe(v.array(vSession), v.maxLength(MAX_JOURNAL_SESSIONS));
const MAX_ARCHIVED_SESSIONS = 100;
/** A never-answered `start_pending` row this old (and unreferenced) is swept at the next start. */
const STALE_START_PENDING_MAX_AGE_MILLIS = 60 * 60 * 1000;
const JOURNAL_LOCK_NAME = "meteor-wallet-sdk::new-key-transfer-journal::v1";
/** Serializes whole AddKey submissions across tabs; deliberately NOT the journal lock (chain I/O). */
const ADD_KEY_LOCK_NAME = "meteor-wallet-sdk::new-key-transfer-add-key::v1";
const journalOperationLocks = new Map<string, Promise<unknown>>();

/**
 * The three slots the shared AddKey journal machinery persists. They live under the `met_data_`
 * prefix, NOT `met_bridge_partner::`: a partner-identity reset wipes that namespace wholesale, and
 * a signed AddKey transaction must survive one — the bytes may still land on-chain.
 */
const ADD_KEY_JOURNAL_STORAGE_KEYS: IAddKeyJournalStorageKeys = {
  journal: `${METEOR_CONNECT_STORAGE_KEY_PREFIX}newKeyTransferAddKeyJournal`,
  startResult: `${METEOR_CONNECT_STORAGE_KEY_PREFIX}newKeyTransferStartResultJournal`,
  pendingVerify: `${METEOR_CONNECT_STORAGE_KEY_PREFIX}newKeyTransferPendingVerify`,
};

/**
 * The chain seam every record-only use of the runner gets. The runner never calls it for the
 * record surface, so reaching it means a submission path was entered without the host's chain —
 * which must fail closed rather than fabricate a transaction.
 */
const REQUIRE_HOST_CHAIN: IAddKeyJournalChain = {
  getAccessKeys: async () => {
    throw new NewKeyTransferError("new_key_transfer_add_key_chain_required");
  },
  signAddKeyTransaction: async () => {
    throw new NewKeyTransferError("new_key_transfer_add_key_chain_required");
  },
  broadcastSignedTransaction: async () => {
    throw new NewKeyTransferError("new_key_transfer_add_key_chain_required");
  },
  getFinalTransactionStatus: async () => {
    throw new NewKeyTransferError("new_key_transfer_add_key_chain_required");
  },
};

type TReadyStartAccount = Extract<TNewKeyTransferStartOutputAccountV1, { ok: true }>;

/** One cached terminal verify exchange (SD12/SDK-4 `exact_cached_result`): request + output. */
interface ICachedVerifyResult {
  request: TNewKeyTransferVerifyActiveInputV1;
  output: TNewKeyTransferVerifyActiveOutputV1;
}

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

const STORED_SESSION_KEYS = [
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
  "securedAccounts",
  "pendingCompletionAccounts",
  "updatedAt",
] as const;

/** The exact pre-stabilization stored shape, accepted only for the one-shot migration below. */
const PRE_STABILIZATION_SESSION_KEYS = [
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
] as const;

const hasStrictStoredSessionShape = (value: unknown): boolean => {
  const session = asRecord(value);
  if (
    session == null ||
    !hasOnlyKeys(session, STORED_SESSION_KEYS) ||
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

/**
 * One-shot migration for rows persisted before the stabilization fields existed: EXACTLY the old
 * key set gains empty `securedAccounts`/`pendingCompletionAccounts`. Deliberately conservative —
 * accounts that were "verified" under the old contract are NOT presumed secured; a re-verify
 * settles them honestly. Anything that matches neither shape stays untouched and fails closed.
 */
const migrateStoredSession = (value: unknown): unknown => {
  const session = asRecord(value);
  if (session == null) return value;
  if (hasOnlyKeys(session, PRE_STABILIZATION_SESSION_KEYS) && !("securedAccounts" in session)) {
    const phase = session.phase === "destination_keys_verified" ? "verification_pending" : session.phase;
    return { ...session, phase, securedAccounts: [], pendingCompletionAccounts: [] };
  }
  return value;
};

const successfulAccountKeys = (session: INewKeyTransferSdkSession): Set<string> =>
  new Set(
    session.startOutput?.accounts
      .filter((account) => account.ok)
      .map(newKeyTransferAccountIdentityKey) ?? [],
  );

const readyAccounts = (output: TNewKeyTransferStartOutputV1): TReadyStartAccount[] =>
  output.accounts.filter((account): account is TReadyStartAccount => account.ok);

/** Identity → destination key, for the rows the wallet answered `ok` for. */
const destinationKeysByIdentity = (output: TNewKeyTransferStartOutputV1): Map<string, string> =>
  new Map(
    readyAccounts(output).map((account) => [
      newKeyTransferAccountIdentityKey(account),
      account.destinationPublicKey,
    ]),
  );

/**
 * Two records of the same start result must name the same destination key for every account. A
 * divergence means a second transfer minted different keys for these accounts, and submitting
 * AddKey for either one would authorize a key the other record cannot prove.
 */
const assertSameDestinationKeys = (
  stored: TNewKeyTransferStartOutputV1,
  journaled: TNewKeyTransferStartOutputV1,
): void => {
  const storedKeys = destinationKeysByIdentity(stored);
  const journaledKeys = destinationKeysByIdentity(journaled);
  if (
    storedKeys.size !== journaledKeys.size ||
    [...storedKeys].some(([identity, key]) => journaledKeys.get(identity) !== key)
  ) {
    throw new NewKeyTransferError("new_key_transfer_start_result_conflict");
  }
};

/** One AddKey operation's full identity: the source key from the request, the destination from
 *  the wallet's signed answer, bound to the transfer session both belong to. */
const buildAddKeyJob = (
  session: INewKeyTransferSdkSession,
  output: TNewKeyTransferStartOutputV1,
  account: TReadyStartAccount,
): IAddKeyJournalJob => {
  const identity = newKeyTransferAccountIdentityKey(account);
  const requested = session.startRequest.accounts.find(
    (candidate) => newKeyTransferAccountIdentityKey(candidate) === identity,
  );
  if (requested == null) throw new NewKeyTransferError("new_key_transfer_add_key_account_mismatch");
  return {
    transferSessionId: output.transferSessionId,
    blockchainId: account.blockchainId,
    networkId: account.networkId,
    accountId: account.accountId,
    sourcePublicKey: requested.sourcePublicKey,
    destinationPublicKey: account.destinationPublicKey,
  };
};

/** SD6/SDK-7: ONE completion definition — every intended account is `secured`, none pending. */
const resolvePostVerifyPhase = (
  session: Pick<
    INewKeyTransferSdkSession,
    "addKeyIntentAccounts" | "securedAccounts" | "pendingCompletionAccounts"
  >,
): INewKeyTransferSdkSession["phase"] => {
  const allIntentSecured =
    session.addKeyIntentAccounts.length > 0 &&
    session.addKeyIntentAccounts.every((key) => session.securedAccounts.includes(key));
  if (allIntentSecured && session.pendingCompletionAccounts.length === 0) {
    return "destination_keys_verified";
  }
  return session.pendingCompletionAccounts.length > 0
    ? "verification_pending_wallet"
    : "verification_pending";
};

const validateStoredSessions = (value: unknown): INewKeyTransferSdkSession[] => {
  const migrated = Array.isArray(value) ? value.map(migrateStoredSession) : value;
  if (!Array.isArray(migrated) || !migrated.every(hasStrictStoredSessionShape)) {
    throw new NewKeyTransferError("new_key_transfer_journal_corrupt");
  }
  const parsed = v.safeParse(vSessions, migrated);
  if (!parsed.success) throw new NewKeyTransferError("new_key_transfer_journal_corrupt");

  const clientTransferIds = new Set<string>();
  const transferSessionIds = new Set<string>();
  for (const session of parsed.output) {
    if (
      clientTransferIds.has(session.clientTransferId) ||
      session.startRequest.clientTransferId !== session.clientTransferId ||
      hashNewKeyTransferStartInput(session.startRequest) !== session.canonicalInputHash
    ) {
      throw new NewKeyTransferError("new_key_transfer_journal_corrupt");
    }
    clientTransferIds.add(session.clientTransferId);

    if (session.phase === "start_pending") {
      if (
        session.startOutput != null ||
        session.walletConnection != null ||
        session.addKeyIntentAccounts.length > 0 ||
        session.verifiedAccounts.length > 0 ||
        session.securedAccounts.length > 0 ||
        session.pendingCompletionAccounts.length > 0
      ) {
        throw new NewKeyTransferError("new_key_transfer_journal_corrupt");
      }
      continue;
    }
    if (session.startOutput == null || session.walletConnection == null) {
      throw new NewKeyTransferError("new_key_transfer_journal_corrupt");
    }
    validateNewKeyTransferStartOutputForInput({
      request: session.startRequest,
      output: session.startOutput,
    });
    if (transferSessionIds.has(session.startOutput.transferSessionId)) {
      throw new NewKeyTransferError("new_key_transfer_journal_corrupt");
    }
    transferSessionIds.add(session.startOutput.transferSessionId);

    const successful = successfulAccountKeys(session);
    const secured = new Set(session.securedAccounts);
    if (
      session.addKeyIntentAccounts.some((key) => !successful.has(key)) ||
      session.verifiedAccounts.some((key) => !session.addKeyIntentAccounts.includes(key)) ||
      session.securedAccounts.some((key) => !session.verifiedAccounts.includes(key)) ||
      session.pendingCompletionAccounts.some(
        (key) => !session.verifiedAccounts.includes(key) || secured.has(key),
      ) ||
      (session.phase === "destination_keys_staged" &&
        (session.addKeyIntentAccounts.length > 0 || session.verifiedAccounts.length > 0)) ||
      (session.phase === "add_key_in_progress" && session.addKeyIntentAccounts.length === 0) ||
      (session.phase === "verification_pending" && session.addKeyIntentAccounts.length === 0) ||
      (session.phase === "verification_pending_wallet" &&
        session.pendingCompletionAccounts.length === 0) ||
      (session.phase === "destination_keys_verified" &&
        (session.addKeyIntentAccounts.length === 0 ||
          session.pendingCompletionAccounts.length > 0 ||
          session.addKeyIntentAccounts.some((key) => !secured.has(key))))
    ) {
      throw new NewKeyTransferError("new_key_transfer_journal_corrupt");
    }
  }
  return parsed.output;
};

/**
 * Secret-free orchestration for the new-key transfer, in the two-turn session shape 0.12 requires.
 *
 * `new_key_account_transfer_start` is the one action whose recovery contract permits an
 * external-work hold: its signed result is journaled BEFORE `acknowledgeAndBeginExternalWork`
 * parks the session, the AddKey window then runs through the shared crash-safe journal runner, and
 * `new_key_account_transfer_verify_active` is installed as the NEXT turn of that same held
 * session. When the hold is lost — a reload, a dead tab, an expired session — verification opens a
 * FRESH `single_turn_v1` session with a freshly generated `partnerRequestId`, pinned to the exact
 * wallet that minted the destination keys. A lease is never replayed.
 *
 * Every D33 invariant of the AddKey window itself (journal-before-chain-call, durable intent
 * before signing, durable exact signed bytes before broadcast, same-bytes-only rebroadcast, proof
 * verification before checkpointing) belongs to `@meteorwallet/connect-shared`'s runner and is
 * deliberately not re-implemented here. What this layer owns is the orchestration journal: schema
 * and account-set integrity, replay, exact-wallet routing, and phase-aware host state.
 *
 * Stabilization changes (SD-series in PLAN-new-key-transfer-stabilization.md):
 * - SD4 three-literal verify results with per-account `secured`/`pendingCompletion` facts;
 * - SD6/SDK-7 one completion definition (the intent set, fully secured);
 * - SDK-1 the start fence agrees with the reconciliation report (a bound signed row fences
 *   nothing it cannot explain);
 * - SDK-2 self-healing start-result orphans + `discardOrphanedStartResult()`;
 * - SDK-4 terminal verify exchanges are cached and replayed without re-asking the wallet;
 * - SDK-8/9/10 lock-scope and validate-before-effect corrections;
 * - SD10 retention: stale pending sweep, capacity as a typed error, and `archiveCompletedSession`.
 */
export class MeteorConnectNewKeyTransfer {
  private enabled = false;
  /**
   * Live external-work holds by `transferSessionId`. In-memory ON PURPOSE: a hold is only usable
   * while the process that created it still holds the memory-only partner secret, so losing this
   * map is exactly the signal to take the fresh-session recovery path.
   */
  private readonly externalWorkHolds = new Map<string, IMobileBridgeExternalWorkHold>();
  /** In-flight `start()` calls by clientTransferId — concurrent same-id callers join one prompt. */
  private readonly inFlightStarts = new Map<string, Promise<INewKeyTransferStartResult>>();
  private readonly sessionListeners = new Set<() => void>();

  constructor(private readonly meteorConnect: MeteorConnect) {}

  configure(enabled: boolean): void {
    this.enabled = enabled;
  }

  private requireEnabled(): void {
    if (!this.enabled) throw new NewKeyTransferError("new_key_transfer_unavailable");
  }

  /**
   * Notify on every durable session-journal change (start/verify/intent/revoke/clear/archive) in
   * THIS process. Pull the fresh state with {@link getSessions}; the callback carries nothing.
   */
  onSessionsChanged(listener: () => void): () => void {
    this.sessionListeners.add(listener);
    return () => this.sessionListeners.delete(listener);
  }

  private notifySessionsChanged(): void {
    for (const listener of this.sessionListeners) {
      try {
        listener();
      } catch {
        // A throwing host listener never breaks journal mutation.
      }
    }
  }

  /**
   * Bind the shared AddKey journal machinery to this SDK's storage. `chain` is the host's — the
   * runner is the only thing that may talk to it, and only after the journal has been read.
   */
  private addKeyRunner(chain: IAddKeyJournalChain = REQUIRE_HOST_CHAIN): IAddKeyJournalRunner {
    const adapter = this.meteorConnect.localStorageAdapter;
    const storage: IAddKeyJournalStorageMethods = {
      getItem: (key) => adapter.getString(key),
      setItem: (key, value) => adapter.setString(key, value),
      removeItem: (key) => adapter.removeItem(key),
    };
    return createAddKeyJournalRunner({
      storage,
      storageKeys: ADD_KEY_JOURNAL_STORAGE_KEYS,
      chain,
      withMutationLock: (operation) => this.withNamedLock(ADD_KEY_LOCK_NAME, operation),
    });
  }

  private async readSessions(): Promise<INewKeyTransferSdkSession[]> {
    const stored = await this.meteorConnect.storage.getJson("newKeyTransferSessions");
    return stored == null ? [] : validateStoredSessions(stored);
  }

  private async writeSessions(sessions: INewKeyTransferSdkSession[]): Promise<void> {
    // SD10: capacity is a retention problem with a typed answer, never "corrupt".
    if (sessions.length > MAX_JOURNAL_SESSIONS) {
      throw new NewKeyTransferError("new_key_transfer_journal_retention_required");
    }
    await this.meteorConnect.storage.setJson(
      "newKeyTransferSessions",
      validateStoredSessions(sessions),
    );
    this.notifySessionsChanged();
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

  private async withNamedLock<T>(name: string, operation: () => Promise<T>): Promise<T> {
    return this.withInProcessLock(name, async () => {
      if (typeof navigator !== "undefined" && navigator.locks != null) {
        return navigator.locks.request(name, { mode: "exclusive" }, operation);
      }
      return operation();
    });
  }

  private async withJournalLock<T>(operation: () => Promise<T>): Promise<T> {
    return this.withNamedLock(JOURNAL_LOCK_NAME, operation);
  }

  // --- cached terminal verify exchange (SDK-4 `exact_cached_result`) ------------------------

  private async readCachedVerifyResults(): Promise<Record<string, ICachedVerifyResult>> {
    const stored = await this.meteorConnect.storage.getJson("newKeyTransferVerifyResults");
    const record = asRecord(stored);
    if (record == null) return {};
    const valid: Record<string, ICachedVerifyResult> = {};
    for (const [transferSessionId, entry] of Object.entries(record)) {
      const candidate = asRecord(entry);
      if (candidate == null) continue;
      try {
        const output = validateNewKeyTransferVerifyActiveOutputForInput({
          request: candidate.request as TNewKeyTransferVerifyActiveInputV1,
          output: candidate.output,
        });
        valid[transferSessionId] = {
          request: candidate.request as TNewKeyTransferVerifyActiveInputV1,
          output,
        };
      } catch {
        // An unreadable cache entry is dropped — the wallet re-answers idempotently.
      }
    }
    return valid;
  }

  private async writeCachedVerifyResult(
    transferSessionId: string,
    entry: ICachedVerifyResult | null,
  ): Promise<void> {
    const cached = await this.readCachedVerifyResults();
    if (entry == null) {
      delete cached[transferSessionId];
    } else {
      cached[transferSessionId] = entry;
    }
    await this.meteorConnect.storage.setJson("newKeyTransferVerifyResults", cached);
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
    // Concurrent same-id starts join ONE prompt instead of queueing behind a lock held across a
    // human-paced wallet interaction (SDK-10).
    const inFlight = this.inFlightStarts.get(request.clientTransferId);
    if (inFlight != null) return inFlight;
    const flight = this.executeStart(request, options).finally(() => {
      this.inFlightStarts.delete(request.clientTransferId);
    });
    this.inFlightStarts.set(request.clientTransferId, flight);
    return flight;
  }

  private async executeStart(
    request: v.InferOutput<typeof vNewKeyTransferStartInputV1>,
    options: INewKeyTransferStartOptions,
  ): Promise<INewKeyTransferStartResult> {
    const canonicalInputHash = hashNewKeyTransferStartInput(request);
    const staged = await this.withJournalLock(async () => {
      const runner = this.addKeyRunner();
      const sessions = await this.readSessions();
      const existing = sessions.find(
        (session) => session.clientTransferId === request.clientTransferId,
      );
      if (existing != null) {
        if (
          existing.canonicalInputHash !== canonicalInputHash ||
          existing.targetPlatform !== options.targetPlatform
        ) {
          throw new NewKeyTransferError("new_key_transfer_client_id_conflict");
        }
        if (existing.startOutput != null) {
          // Exact replay of an already-answered start: the wallet is not asked again, and the
          // hold — if this process still has one for that transfer — is reported as it stands.
          return {
            kind: "replay" as const,
            result: {
              output: existing.startOutput,
              session: existing,
              externalWorkHeld: this.externalWorkHolds.has(
                existing.startOutput.transferSessionId,
              ),
            },
          };
        }
      }

      // SD10: sweep never-answered pending rows that nothing references any more, so declined and
      // abandoned attempts cannot creep toward the capacity wedge.
      const journaledStartResult = await runner.loadStartResult();
      const now = Date.now();
      const swept = sessions.filter((session) => {
        if (session.phase !== "start_pending") return true;
        if (session.clientTransferId === request.clientTransferId) return true;
        if (journaledStartResult?.output.clientTransferId === session.clientTransferId)
          return true;
        return now - session.updatedAt < STALE_START_PENDING_MAX_AGE_MILLIS;
      });

      // SDK-1: the start fence must agree with what the reconciliation report can explain. An
      // orphaned/unreadable signed AddKey fences everything; a signed row still BOUND to its
      // start result is an in-progress transfer, resumable through `runAddKeys`, and fences
      // nothing here (account overlap is refused wallet-side as `pending_transfer_conflict`).
      const reconciliation = await runner.buildReconciliationReport();
      if (reconciliation.fenced) {
        throw new NewKeyTransferError("new_key_transfer_orphaned_add_key_recovery");
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
        securedAccounts: [],
        pendingCompletionAccounts: [],
        updatedAt: Date.now(),
      };
      const withPending = [
        ...swept.filter((session) => session.clientTransferId !== pending.clientTransferId),
        pending,
      ];
      await this.writeSessions(withPending);
      return { kind: "prompt" as const, pending };
    });
    if (staged.kind === "replay") return staged.result;

    // The wallet prompt runs OUTSIDE the journal lock (SDK-10): a human-paced interaction must
    // not block every other new-key operation in every tab. The wallet's own replay makes a
    // repeated prompt for the same clientTransferId converge on the identical committed output.
    const action = await this.meteorConnect.createAction<TStartRequest>({
      id: "meteor_wallet_core::new_key_account_transfer_start",
      input: request,
    });
    action.setTransferTarget({
      platform: options.targetPlatform,
      // Journal-before-hold (D33): the wallet's exact signed result is durable BEFORE the hold
      // begins, and the hold names the exact hash that was written — a drifted hash is refused
      // by the backend as `external_work_journal_mismatch`.
      externalWorkJournal: async ({ receipt, output }) => {
        const journaled = await this.addKeyRunner().rememberStartResult({
          resultHash: receipt.resultHash,
          output: parseNewKeyTransferStartOutputV1(output),
        });
        return journaled.resultHash;
      },
      // The AddKey window and the verification turn ride this same session; its teardown belongs
      // to whichever of them ends it.
      retainSessionForExternalWork: true,
    });
    const output = await action.promptForExecution();
    const walletConnection = action.getCompletedMobileConnection();
    if (walletConnection == null) {
      throw new NewKeyTransferError("new_key_transfer_wallet_binding_missing");
    }
    const hold = action.getExternalWorkHold();

    return this.withJournalLock(async () => {
      const sessions = await this.readSessions();
      const current =
        sessions.find((session) => session.clientTransferId === request.clientTransferId) ??
        staged.pending;
      const completed: INewKeyTransferSdkSession = {
        ...current,
        phase: "destination_keys_staged",
        startOutput: output,
        walletConnection,
        updatedAt: Date.now(),
      };
      await this.replaceSession(completed);
      if (hold != null) this.externalWorkHolds.set(output.transferSessionId, hold);
      return { output, session: completed, externalWorkHeld: hold != null };
    });
  }

  /**
   * Run every pending AddKey for one transfer through the shared crash-safe journal runner, then
   * durably record the complete verification request.
   *
   * The runner owns the invariants: it reads (and fails closed on) the journal before the first
   * chain call, records intent before signing, records the exact signed bytes and hash before
   * broadcasting, rebroadcasts only those identical bytes after an ambiguous send, and verifies
   * the finalized proof before replacing them with a checkpoint. This method owns the SDK's own
   * fences: the transfer must be the one the durable start-result journal remembers, the accounts
   * must be the exact rows the wallet answered `ok` for, and the AddKey intent must be visible in
   * the orchestration journal before any chain call — so `clear()` cannot drop a transfer whose
   * key may already be live.
   */
  async runAddKeys(options: INewKeyTransferAddKeyOptions): Promise<INewKeyTransferAddKeyResult> {
    this.requireEnabled();
    const runner = this.addKeyRunner(options.chain);
    const prepared = await this.withJournalLock(async () => {
      const session = await this.requireSession(options.transferSessionId);
      const startOutput = session.startOutput;
      if (startOutput == null) {
        throw new NewKeyTransferError("new_key_transfer_session_not_found");
      }
      const journaled = await runner.loadStartResult();
      if (
        journaled == null ||
        journaled.output.transferSessionId !== startOutput.transferSessionId ||
        journaled.output.clientTransferId !== startOutput.clientTransferId
      ) {
        // Without the exact durable start result there is nothing to prove which destination keys
        // this AddKey would authorize. Replay the start action instead of guessing.
        throw new NewKeyTransferError("new_key_transfer_start_result_journal_missing");
      }
      // Both records must describe the same request AND the same destination keys; a divergence
      // means two transfers are competing for one account.
      validateNewKeyTransferStartOutputForInput({
        request: session.startRequest,
        output: journaled.output,
      });
      assertSameDestinationKeys(startOutput, journaled.output);

      const ready = readyAccounts(journaled.output);
      if (ready.length === 0) throw new NewKeyTransferError("new_key_transfer_no_accounts_ready");
      const jobs = ready.map((account) => buildAddKeyJob(session, journaled.output, account));
      // Intent lands in the orchestration journal BEFORE any chain call, so a crash mid-window
      // still fences `clear()` behind explicit destination-key revocation.
      const withIntent = await this.applyAddKeyIntent(
        session,
        jobs.map((job) => ({
          blockchainId: job.blockchainId,
          networkId: job.networkId,
          accountId: job.accountId,
        })),
      );
      return { session: withIntent, jobs };
    });

    // Chain work runs OUTSIDE the orchestration journal lock — the runner has its own cross-tab
    // mutation lock, and a hardware wallet or a slow RPC must not block journal reads.
    const activations: TNewKeyTransferVerifyActiveInputV1["activations"] = [];
    for (const [index, job] of prepared.jobs.entries()) {
      options.onProgress?.({
        accountId: job.accountId,
        index: index + 1,
        total: prepared.jobs.length,
      });
      const addKeyTransactionHash = await runner.submitAddKey(job);
      activations.push({
        blockchainId: job.blockchainId,
        networkId: job.networkId,
        accountId: job.accountId,
        addKeyTransactionHash,
      });
    }

    // Persist the complete verification intent before leaving the external-work window. Only once
    // it is durable may the start-result journal be released — the shared store enforces that
    // exact ordering.
    const verifyInput = await runner.commitVerificationIntent({
      formatVersion: 1,
      transferSessionId: options.transferSessionId,
      activations,
    });
    return { verifyInput, session: prepared.session };
  }

  /**
   * Everything a host needs to resume after process loss, read without mutating anything. A
   * corrupt record throws here exactly as it does everywhere else — an empty answer would invite a
   * second AddKey.
   */
  async getRecoveryState(): Promise<INewKeyTransferRecoveryState> {
    const runner = this.addKeyRunner();
    const [startResult, pendingVerification, reconciliation] = await Promise.all([
      runner.loadStartResult(),
      runner.loadPendingVerification(),
      runner.buildReconciliationReport(),
    ]);
    // SDK-1: the flag IS the report's verdict — the two can never disagree again.
    return {
      startResult,
      pendingVerification,
      orphanedSignedAddKey: reconciliation.fenced,
      reconciliation,
    };
  }

  /**
   * Just the fence, for a host that only needs to decide whether to offer recovery.
   * `getRecoveryState()` returns the same report alongside the resume records.
   */
  async getReconciliationReport(): Promise<INewKeyTransferReconciliationReport> {
    return await this.addKeyRunner().buildReconciliationReport();
  }

  /**
   * Advance one fenced operation as far as the chain allows (B-04). Read-only against the chain —
   * it proves finality and access-key state, never signs and never broadcasts. The only mutation
   * it can make is promoting a proven `transaction_signed` row to `finalized`, after which the
   * transfer resumes through normal verification.
   *
   * The four outcomes and what a host does with each:
   *
   * - `finalized` — the AddKey landed. Resume verification with the recorded proof.
   * - `destination_key_present_unproven` — the key is granted but nothing binds it to this
   *   transfer. Remove it with the SOURCE signer, wait for finality, then
   *   {@link archiveReconciledOperation}.
   * - `destination_key_absent` — the transaction can never land and the key is not there. Call
   *   {@link archiveReconciledOperation} to retire the row.
   * - `ambiguous` — nothing could be established this pass; nothing changed. Retry later. Never
   *   offer "start again": the fence guarantees a fresh start would be refused.
   */
  async reconcileFencedOperation(
    options: INewKeyTransferReconcileOptions,
  ): Promise<INewKeyTransferReconcileResult> {
    this.requireEnabled();
    return await this.addKeyRunner(options.chain).reconcileFencedOperation(options.operation);
  }

  /**
   * Retire a fenced row once its destination key is proven ABSENT on-chain. Re-proves absence
   * itself before touching the journal, so a host that revoked the key but lost finality cannot
   * clear the fence by asserting it did. Returns `false` when it refused.
   */
  async archiveReconciledOperation(options: INewKeyTransferArchiveOptions): Promise<boolean> {
    this.requireEnabled();
    return await this.addKeyRunner(options.chain).archiveReconciledOperation(options.operation);
  }

  /**
   * Discard a journaled start result that NO session references (SDK-2's wedge exit): a crash
   * between the wallet's answer and the session commit could historically orphan the one-slot
   * start-result journal, refusing every later transfer as `start_result_conflict` with no public
   * way out. Guarded: a referenced result throws `start_result_referenced` (resume that transfer
   * instead), and protected AddKey rows keep the recovery fence.
   */
  async discardOrphanedStartResult(): Promise<boolean> {
    return this.withJournalLock(async () => {
      const runner = this.addKeyRunner();
      const journaled = await runner.loadStartResult();
      if (journaled == null) return false;
      const sessions = await this.readSessions();
      const referenced = sessions.some(
        (session) =>
          session.startOutput?.transferSessionId === journaled.output.transferSessionId ||
          session.clientTransferId === journaled.output.clientTransferId,
      );
      if (referenced) {
        throw new NewKeyTransferError("new_key_transfer_start_result_referenced");
      }
      if (await runner.hasProtectedRecovery(journaled.output.transferSessionId)) {
        throw new NewKeyTransferError("new_key_transfer_recovery_required", {
          fence: "protected_journal",
        });
      }
      return await runner.discardStartResult();
    });
  }

  /** The one session this transfer id names, or a fail-closed miss. Callers hold the journal lock. */
  private async requireSession(transferSessionId: string): Promise<INewKeyTransferSdkSession> {
    const session = (await this.readSessions()).find(
      (candidate) => candidate.startOutput?.transferSessionId === transferSessionId,
    );
    if (session == null) throw new NewKeyTransferError("new_key_transfer_session_not_found");
    return session;
  }

  /** Record the AddKey intent in the orchestration journal. Callers hold the journal lock. */
  private async applyAddKeyIntent(
    session: INewKeyTransferSdkSession,
    accounts: ReadonlyArray<{ blockchainId: string; networkId: string; accountId: string }>,
  ): Promise<INewKeyTransferSdkSession> {
    const successful = successfulAccountKeys(session);
    const intentKeys = accounts.map(newKeyTransferAccountIdentityKey);
    if (intentKeys.some((key) => !successful.has(key))) {
      throw new NewKeyTransferError("new_key_transfer_add_key_account_mismatch");
    }
    const updated: INewKeyTransferSdkSession = {
      ...session,
      phase: "add_key_in_progress",
      addKeyIntentAccounts: [...new Set([...session.addKeyIntentAccounts, ...intentKeys])],
      updatedAt: Date.now(),
    };
    await this.replaceSession(updated);
    return updated;
  }

  /**
   * Record an AddKey intent for a host that submits the transaction itself. Hosts that let the SDK
   * drive the window call {@link runAddKeys} instead — it records the same intent and adds every
   * D33 crash-cut the shared runner enforces.
   */
  async markAddKeyIntent(input: {
    transferSessionId: string;
    accounts: Array<{ blockchainId: string; networkId: string; accountId: string }>;
  }): Promise<INewKeyTransferSdkSession> {
    this.requireEnabled();
    return this.withJournalLock(async () =>
      this.applyAddKeyIntent(await this.requireSession(input.transferSessionId), input.accounts),
    );
  }

  /**
   * Acknowledge that the host has finalized removal of the exact destination keys for these
   * accounts. This is deliberately separate from `clear`: the SDK only releases its recovery
   * fence after the caller has reconciled on-chain absence of every key it may have submitted.
   *
   * It clears BOTH fences. Dropping the accounts from this session's intent list is not enough on
   * its own: the shared AddKey journal keeps its own protected `transaction_signed`/`finalized`
   * rows, and `clear()` consults `hasProtectedRecovery()` — so revocation that only touched the
   * session left the transfer just as stuck as before (REVIEW-consumer-implementation B-04). Each
   * protected row is retired through the runner, which re-proves on-chain absence of the exact
   * destination key first.
   *
   * SDK-9: the session and account membership are validated BEFORE any fence evidence is
   * archived, so a stale or wrong id can no longer retire journal rows and then fail.
   */
  async markDestinationKeysRevoked(input: {
    transferSessionId: string;
    accounts: Array<{ blockchainId: string; networkId: string; accountId: string }>;
    /**
     * Required whenever any of these accounts still has a protected AddKey row. The SDK uses it to
     * re-prove that the destination key is gone; a caller's assurance is never enough, because the
     * whole point of the fence is that the signed bytes may have taken effect.
     */
    chain?: IAddKeyJournalChain;
  }): Promise<INewKeyTransferSdkSession> {
    this.requireEnabled();
    const revokedKeys = [...new Set(input.accounts.map(newKeyTransferAccountIdentityKey))];
    await this.withJournalLock(async () => {
      const session = await this.requireSession(input.transferSessionId);
      if (revokedKeys.length === 0) {
        throw new NewKeyTransferError("new_key_transfer_revoked_accounts_required");
      }
      if (revokedKeys.some((key) => !session.addKeyIntentAccounts.includes(key))) {
        throw new NewKeyTransferError("new_key_transfer_revoke_account_mismatch");
      }
    });

    // Chain-proving archive work runs outside the journal lock; validation above already bound
    // the request to a real session and its intent set.
    const runner = this.addKeyRunner(input.chain ?? REQUIRE_HOST_CHAIN);
    const protectedOperations = newKeyTransferProtectedOperations(
      await runner.loadJournalEntries(),
      {
        transferSessionId: input.transferSessionId,
        accountIds: input.accounts.map((account) => account.accountId),
      },
    );
    if (protectedOperations.length > 0) {
      if (input.chain == null) {
        throw new NewKeyTransferError("new_key_transfer_revoke_chain_required");
      }
      for (const operation of protectedOperations) {
        if (!(await runner.archiveReconciledOperation(operation))) {
          throw new NewKeyTransferError("new_key_transfer_revoke_destination_key_present");
        }
      }
    }

    return this.withJournalLock(async () => {
      const session = await this.requireSession(input.transferSessionId);
      if (revokedKeys.some((key) => !session.addKeyIntentAccounts.includes(key))) {
        throw new NewKeyTransferError("new_key_transfer_revoke_account_mismatch");
      }

      const addKeyIntentAccounts = session.addKeyIntentAccounts.filter(
        (key) => !revokedKeys.includes(key),
      );
      const verifiedAccounts = session.verifiedAccounts.filter((key) => !revokedKeys.includes(key));
      const securedAccounts = session.securedAccounts.filter((key) => !revokedKeys.includes(key));
      const pendingCompletionAccounts = session.pendingCompletionAccounts.filter(
        (key) => !revokedKeys.includes(key),
      );
      const remaining = {
        addKeyIntentAccounts,
        securedAccounts,
        pendingCompletionAccounts,
      };
      const updated: INewKeyTransferSdkSession = {
        ...session,
        phase:
          addKeyIntentAccounts.length === 0
            ? "destination_keys_staged"
            : resolvePostVerifyPhase(remaining) === "verification_pending" &&
                verifiedAccounts.length === 0
              ? "add_key_in_progress"
              : resolvePostVerifyPhase(remaining),
        addKeyIntentAccounts,
        verifiedAccounts,
        securedAccounts,
        pendingCompletionAccounts,
        updatedAt: Date.now(),
      };
      await this.replaceSession(updated);
      return updated;
    });
  }

  /**
   * Prove the destination keys are live AND secured wallet-side. Two paths, decided by whether
   * this process still holds the start turn's external-work hold:
   *
   * - **same session** — the verification request is installed as the NEXT turn of the held
   *   session (`prepareAction` persists the exact signed turn before `submitPreparedAction`
   *   transmits it), so the wallet answers on the bridge it already trusts;
   * - **fresh recovery session** — a new `single_turn_v1` session with a freshly generated
   *   `partnerRequestId`, pinned to the exact wallet that minted the destination keys. An expired
   *   or process-lost lease is never replayed.
   *
   * A byte-identical repeat of an already TERMINAL exchange (every row `secured`/`not_verified`)
   * replays from the durable cache without asking the wallet again (SDK-4); anything pending
   * re-asks, and the wallet answers idempotently.
   */
  async verifyActive(options: INewKeyTransferVerifyOptions): Promise<INewKeyTransferVerifyResult> {
    this.requireEnabled();
    const runner = this.addKeyRunner();
    const prepared = await this.withJournalLock(async () => {
      const session = await this.requireSession(options.transferSessionId);
      if (session.walletConnection == null) {
        throw new NewKeyTransferError("new_key_transfer_wallet_connection_missing");
      }
      const activationKeys = options.activations.map(newKeyTransferAccountIdentityKey);
      if (activationKeys.some((key) => !session.addKeyIntentAccounts.includes(key))) {
        throw new NewKeyTransferError("new_key_transfer_verify_before_add_key_intent");
      }
      const request: TNewKeyTransferVerifyActiveInputV1 = {
        formatVersion: 1,
        transferSessionId: options.transferSessionId,
        activations: options.activations,
      };

      // 2.10: an activation hash must agree with this transfer's own finalized AddKey journal
      // row where one exists — a drifted hash after completion cannot reach the wallet.
      const finalizedHashes = new Map<string, string>();
      for (const entry of await runner.loadJournalEntries()) {
        if (entry.phase === "finalized" && entry.transferSessionId === options.transferSessionId) {
          finalizedHashes.set(newKeyTransferAccountIdentityKey(entry), entry.transactionHash);
        }
      }
      for (const activation of options.activations) {
        const journaledHash = finalizedHashes.get(newKeyTransferAccountIdentityKey(activation));
        if (journaledHash != null && journaledHash !== activation.addKeyTransactionHash) {
          throw new NewKeyTransferError("new_key_transfer_verify_hash_mismatch");
        }
      }

      // SDK-4: a byte-identical repeat of a terminal exchange replays without a wallet round trip.
      const cached = (await this.readCachedVerifyResults())[options.transferSessionId];
      if (
        cached != null &&
        stringifyCanonicalJson(cached.request) === stringifyCanonicalJson(request)
      ) {
        return { kind: "cached" as const, session, output: cached.output };
      }

      // Durable before the turn is staged: a lost verify response must be resumable against the
      // exact same proof, never a regenerated one. A byte-different pending proof is refused.
      await runner.rememberPendingVerification(request);
      const pending: INewKeyTransferSdkSession = {
        ...session,
        phase:
          session.pendingCompletionAccounts.length > 0
            ? "verification_pending_wallet"
            : "verification_pending",
        updatedAt: Date.now(),
      };
      await this.replaceSession(pending);
      return { kind: "ask" as const, session: pending, request };
    });
    if (prepared.kind === "cached") {
      return this.recordVerifyOutcome(options.transferSessionId, prepared.output, runner);
    }

    const hold = this.externalWorkHolds.get(options.transferSessionId);
    const action = await this.meteorConnect.createAction<TVerifyRequest>({
      id: "meteor_wallet_core::new_key_account_transfer_verify_active",
      input: prepared.request,
    });
    action.setTransferTarget({
      platform: prepared.session.targetPlatform,
      walletConnection: prepared.session.walletConnection,
      continueExternalWorkHold: hold,
    });
    let output: Awaited<ReturnType<typeof action.promptForExecution>>;
    try {
      output = await action.promptForExecution();
    } finally {
      // The hold is spent either way: it carried this turn, or it was already gone. Nothing may
      // offer it a second time.
      this.externalWorkHolds.delete(options.transferSessionId);
    }

    return this.recordVerifyOutcome(options.transferSessionId, output, runner, prepared.request);
  }

  /**
   * Fold a verify output into the durable session facts. SDK-5: the wallet has already completed
   * its side by the time this runs, so a session-journal failure here must NOT masquerade as a
   * verification failure — it retries once, then surfaces the distinct
   * `verify_session_update_failed` code whose contract is "re-run verifyActive to converge".
   */
  private async recordVerifyOutcome(
    transferSessionId: string,
    output: TNewKeyTransferVerifyActiveOutputV1,
    runner: IAddKeyJournalRunner,
    request?: TNewKeyTransferVerifyActiveInputV1,
  ): Promise<INewKeyTransferVerifyResult> {
    const apply = () =>
      this.withJournalLock(async () => {
        const session = await this.requireSession(transferSessionId);
        const securedNow = output.accounts
          .filter((account) => account.activation === "secured")
          .map(newKeyTransferAccountIdentityKey);
        const pendingNow = output.accounts
          .filter((account) => account.activation === "verified_pending_completion")
          .map(newKeyTransferAccountIdentityKey);
        const securedAccounts = [...new Set([...session.securedAccounts, ...securedNow])];
        const pendingCompletionAccounts = [
          ...new Set([...session.pendingCompletionAccounts, ...pendingNow]),
        ].filter((key) => !securedAccounts.includes(key));
        const verifiedAccounts = [
          ...new Set([...session.verifiedAccounts, ...securedNow, ...pendingNow]),
        ];
        const nextFacts = { ...session, securedAccounts, pendingCompletionAccounts };
        const phase = resolvePostVerifyPhase(nextFacts);
        const completed: INewKeyTransferSdkSession = {
          ...session,
          phase,
          verifiedAccounts,
          securedAccounts,
          pendingCompletionAccounts,
          updatedAt: Date.now(),
        };
        await this.replaceSession(completed);
        const terminalExchange = output.accounts.every(
          (account) => account.activation !== "verified_pending_completion",
        );
        if (request != null && terminalExchange) {
          await this.writeCachedVerifyResult(transferSessionId, { request, output });
        }
        if (phase === "destination_keys_verified") {
          // Clear only this transfer's proof; a stale completion can never erase a newer one.
          await runner.clearPendingVerification(transferSessionId);
        }
        return { output, session: completed };
      });
    try {
      return await apply();
    } catch (firstError) {
      try {
        return await apply();
      } catch {
        throw new NewKeyTransferError("new_key_transfer_verify_session_update_failed", {
          cause: firstError,
        });
      }
    }
  }

  /**
   * End the bridge session a cleared transfer was still holding. Without this a held session would
   * stay the bridge client's current session — blocking every other action until its own deadline
   * passes. Only ever called for a transfer with no AddKey intent, so nothing is at risk.
   */
  private async releaseExternalWorkHold(transferSessionId: string): Promise<void> {
    const hold = this.externalWorkHolds.get(transferSessionId);
    this.externalWorkHolds.delete(transferSessionId);
    if (hold == null) return;
    const client = this.meteorConnect.mobileBridgeClient;
    const session = client.getCurrentSession();
    if (session == null || session.getExternalWorkHold()?.bridgeId !== hold.bridgeId) return;
    // The close verb is the one §5.7 permits for `external_work`; the local release follows it.
    await session.abandon();
    await client.releaseSession(session);
  }

  /**
   * Move one fully completed transfer out of the active journal into the bounded archive (SD10).
   * Allowed only for `destination_keys_verified` sessions — everything else still owes work or a
   * recovery decision. The archive holds secret-free records and trims oldest-first at its cap.
   */
  async archiveCompletedSession(clientTransferId: string): Promise<void> {
    await this.withJournalLock(async () => {
      const sessions = await this.readSessions();
      const session = sessions.find(
        (candidate) => candidate.clientTransferId === clientTransferId,
      );
      if (session == null) throw new NewKeyTransferError("new_key_transfer_session_not_found");
      if (session.phase !== "destination_keys_verified") {
        throw new NewKeyTransferError("new_key_transfer_session_not_terminal");
      }
      const storedArchive = await this.meteorConnect.storage.getJson(
        "newKeyTransferArchivedSessions",
      );
      const archive = Array.isArray(storedArchive) ? storedArchive : [];
      archive.push(session);
      await this.meteorConnect.storage.setJson(
        "newKeyTransferArchivedSessions",
        archive.slice(-MAX_ARCHIVED_SESSIONS),
      );
      await this.writeSessions(
        sessions.filter((candidate) => candidate.clientTransferId !== clientTransferId),
      );
      const transferSessionId = session.startOutput?.transferSessionId;
      if (transferSessionId != null) {
        await this.writeCachedVerifyResult(transferSessionId, null);
        // The one-slot start-result journal is release-eligible once the transfer is terminal;
        // leaving it would refuse the NEXT transfer as `start_result_conflict`.
        const journaled = await this.addKeyRunner().loadStartResult();
        if (journaled?.output.transferSessionId === transferSessionId) {
          await this.addKeyRunner().discardStartResult();
        }
      }
    });
  }

  async clear(clientTransferId: string): Promise<void> {
    const runner = this.addKeyRunner();
    const clearedTransferSessionId = await this.withJournalLock(async () => {
      const sessions = await this.readSessions();
      const session = sessions.find((candidate) => candidate.clientTransferId === clientTransferId);
      if (session == null) return undefined;
      if (session.addKeyIntentAccounts.length > 0) {
        throw new NewKeyTransferError("new_key_transfer_recovery_required", {
          fence: "session_intent",
        });
      }
      const transferSessionId = session.startOutput?.transferSessionId;
      // A signed or finalized AddKey operation cannot be abandoned by a generic "start fresh":
      // the bytes may still land on-chain. A malformed journal fences this exactly as a real
      // record does.
      if (transferSessionId != null && (await runner.hasProtectedRecovery(transferSessionId))) {
        throw new NewKeyTransferError("new_key_transfer_recovery_required", {
          fence: "protected_journal",
        });
      }
      // The shared AddKey journal holds exactly ONE start result and `rememberStartResult` refuses
      // to displace a different transfer's, so one left behind here rejects every LATER transfer
      // as `start_result_conflict` — after that transfer's destination keys have been minted.
      // Discard it only when it is THIS transfer's: another transfer's is live recoverable state
      // and never ours to drop. It goes before the session row, so a journal that cannot be
      // written leaves both records standing rather than a start result with nothing behind it.
      //
      // SDK-2: a `start_pending` row (no startOutput) can still own the journaled result — the
      // crash window between the wallet's answer and the session commit — so the match runs on
      // clientTransferId too, not only transferSessionId.
      const journaled = await runner.loadStartResult();
      const ownsJournaledResult =
        journaled != null &&
        (journaled.output.transferSessionId === transferSessionId ||
          journaled.output.clientTransferId === clientTransferId);
      if (ownsJournaledResult && !(await runner.discardStartResult())) {
        // The fences above already passed, so `discardStartResult` only refuses on a journal it
        // could not read or rewrite. Fail closed rather than clear on top of it.
        throw new NewKeyTransferError("new_key_transfer_start_result_discard_failed");
      }
      await this.writeSessions(
        sessions.filter((candidate) => candidate.clientTransferId !== clientTransferId),
      );
      if (transferSessionId != null) {
        await this.writeCachedVerifyResult(transferSessionId, null);
        // A pending verification proof for THIS transfer can only still exist here after every
        // destination key was revoked (`markDestinationKeysRevoked` is the one path that empties
        // the intent set the fence above checks). It is dead weight now — and a live wedge: the
        // one-slot record would refuse the NEXT transfer's own proof as `pending_verify_conflict`
        // with no public way out. Scoped to this transfer's id; another transfer's proof is live
        // recoverable state and never ours to drop.
        await runner.clearPendingVerification(transferSessionId);
      }
      return transferSessionId;
    });
    // Outside the journal lock: closing a bridge is network work and must not block journal reads.
    if (clearedTransferSessionId != null) {
      await this.releaseExternalWorkHold(clearedTransferSessionId);
    }
  }
}
