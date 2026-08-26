import type {
  IAddKeyJournalChain,
  INewKeyTransferFencedOperation,
  INewKeyTransferReconcileResult,
  INewKeyTransferReconciliationReport,
  IJournaledNewKeyStartResult,
  TNewKeyTransferStartInputV1,
  TNewKeyTransferStartOutputV1,
  TNewKeyTransferVerifyActiveInputV1,
  TNewKeyTransferVerifyActiveOutputV1,
} from "@meteorwallet/connect-shared";
import type { IMeteorConnection_V2_BridgeMobile } from "../MeteorConnect.types";
import type { TTransferTargetPlatform } from "../target_clients/mobile_bridge/MeteorConnectMobileBridgeClient.types";

export type TNewKeyTransferSdkPhase =
  | "start_pending"
  | "destination_keys_staged"
  | "add_key_in_progress"
  | "verification_pending"
  /**
   * Stabilization SD4/SD6: chain proof passed for every requested account, but the WALLET still
   * owes completion work on at least one (`verified_pending_completion` — import or the SD13
   * activation self-test). Re-run `verifyActive` with the same activations to converge; render as
   * "finishing in the wallet", never as done.
   */
  | "verification_pending_wallet"
  | "destination_keys_verified";

export type TNewKeyTransferTargetPlatform = TTransferTargetPlatform;

export interface INewKeyTransferSdkSession {
  formatVersion: 1;
  phase: TNewKeyTransferSdkPhase;
  /**
   * The Meteor Wallet platform this transfer runs against. Absent only while a start that left
   * the choice to the popup is still `start_pending`; once the wallet answers the start turn it
   * is always recorded (the verify turn is pinned to it).
   */
  targetPlatform?: TNewKeyTransferTargetPlatform;
  clientTransferId: string;
  canonicalInputHash: string;
  startRequest: TNewKeyTransferStartInputV1;
  startOutput?: TNewKeyTransferStartOutputV1;
  walletConnection?: IMeteorConnection_V2_BridgeMobile;
  addKeyIntentAccounts: string[];
  /**
   * Accounts whose chain proof the wallet has accepted — the union of `securedAccounts` and
   * `pendingCompletionAccounts`. Kept for continuity; render user-facing state from the two
   * specific sets below (SD6).
   */
  verifiedAccounts: string[];
  /** Accounts the wallet reported `secured`: proven on-chain AND durably imported (SD3/SD4). */
  securedAccounts: string[];
  /** Accounts still `verified_pending_completion` wallet-side; re-verify later to converge. */
  pendingCompletionAccounts: string[];
  updatedAt: number;
}

export interface INewKeyTransferStartOptions {
  accounts: TNewKeyTransferStartInputV1["accounts"];
  /**
   * Pin the Meteor Wallet platform up front and the popup opens straight onto it (contextual,
   * no chooser). Omit it and the popup asks the user to choose (Meteor Web / Meteor Mobile),
   * exactly like the regular action popup for a not-signed-in user. Either way the platform the
   * wallet actually answered on is recorded on the session and reused for the verify turn.
   */
  targetPlatform?: TNewKeyTransferTargetPlatform;
  /** Supply this when resuming a caller-owned id; otherwise the SDK generates and persists one. */
  clientTransferId?: string;
}

export interface INewKeyTransferVerifyOptions {
  transferSessionId: string;
  activations: TNewKeyTransferVerifyActiveInputV1["activations"];
}

export interface INewKeyTransferStartResult {
  output: TNewKeyTransferStartOutputV1;
  session: INewKeyTransferSdkSession;
  /**
   * Whether the bridge session is still parked in its bounded external-work hold. `true` means
   * the AddKey window and the verification turn ride the SAME session; `false` means the hold was
   * lost (or was never entered) and `verifyActive` will open a fresh recovery session instead.
   */
  externalWorkHeld: boolean;
}

export interface INewKeyTransferVerifyResult {
  output: TNewKeyTransferVerifyActiveOutputV1;
  session: INewKeyTransferSdkSession;
}

export interface INewKeyTransferAddKeyOptions {
  transferSessionId: string;
  /**
   * The host's chain seam. MNW owns the source full-access signing keys and derives/signs with
   * them; they never reach this SDK — every method here receives only the job's public identity.
   */
  chain: IAddKeyJournalChain;
  /** 1-based progress across the accounts this transfer still has to submit. */
  onProgress?: (progress: { accountId: string; index: number; total: number }) => void;
}

export interface INewKeyTransferAddKeyResult {
  /** The complete, secret-free verification request — durable before this resolves. */
  verifyInput: TNewKeyTransferVerifyActiveInputV1;
  session: INewKeyTransferSdkSession;
}

/**
 * Everything a host needs to resume a transfer after process loss, read without mutating a byte of
 * it. `startResult` is the wallet's exact signed start output; `pendingVerification` is the
 * complete verification request recorded after the last AddKey finalized.
 */
export interface INewKeyTransferRecoveryState {
  startResult: IJournaledNewKeyStartResult | null;
  pendingVerification: TNewKeyTransferVerifyActiveInputV1 | null;
  /**
   * A signed (or finalized) AddKey transaction is journaled with no start-result record to bind
   * it. Nothing new may be started until it is reconciled — the bytes may still land on-chain.
   *
   * Equivalent to `reconciliation.fenced`; kept so existing callers do not break. Use
   * `reconciliation` for anything a user sees: this flag alone cannot tell them what is stuck or
   * what to do about it.
   */
  orphanedSignedAddKey: boolean;
  /**
   * The non-secret evidence behind the fence and the support reference to quote — everything a
   * host needs to render real recovery choices instead of a dead end
   * (REVIEW-consumer-implementation B-04). Resolve entries through
   * {@link MeteorConnectNewKeyTransfer.reconcileFencedOperation}.
   */
  reconciliation: INewKeyTransferReconciliationReport;
}

/** Options for one pass of the fenced-operation state machine. */
export interface INewKeyTransferReconcileOptions {
  operation: INewKeyTransferFencedOperation;
  /**
   * The host's chain seam — the same one `runAddKeys` takes. Reconciliation only reads: it proves
   * finality and access-key state, and never signs or broadcasts. Implement the optional
   * `isSignedTransactionExpired` to let `destination_key_absent` be reachable without a revocation.
   */
  chain: IAddKeyJournalChain;
}

export interface INewKeyTransferArchiveOptions {
  operation: INewKeyTransferFencedOperation;
  /** Used to re-prove on-chain absence of the exact destination key before the row is retired. */
  chain: IAddKeyJournalChain;
}

export type {
  INewKeyTransferFencedOperation,
  INewKeyTransferReconcileResult,
  INewKeyTransferReconciliationReport,
};
