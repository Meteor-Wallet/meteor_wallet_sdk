import type {
  IAddKeyJournalChain,
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
  | "destination_keys_verified";

export type TNewKeyTransferTargetPlatform = TTransferTargetPlatform;

export interface INewKeyTransferSdkSession {
  formatVersion: 1;
  phase: TNewKeyTransferSdkPhase;
  targetPlatform: TNewKeyTransferTargetPlatform;
  clientTransferId: string;
  canonicalInputHash: string;
  startRequest: TNewKeyTransferStartInputV1;
  startOutput?: TNewKeyTransferStartOutputV1;
  walletConnection?: IMeteorConnection_V2_BridgeMobile;
  addKeyIntentAccounts: string[];
  verifiedAccounts: string[];
  updatedAt: number;
}

export interface INewKeyTransferStartOptions {
  accounts: TNewKeyTransferStartInputV1["accounts"];
  targetPlatform: TNewKeyTransferTargetPlatform;
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
   */
  orphanedSignedAddKey: boolean;
}
