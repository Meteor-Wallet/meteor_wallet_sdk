import type {
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
}

export interface INewKeyTransferVerifyResult {
  output: TNewKeyTransferVerifyActiveOutputV1;
  session: INewKeyTransferSdkSession;
}
