import type { ILocalStorageInterface } from "../ported_common/utils/storage/storage.types.ts";

export type TMeteorConnectAccountType = "near";
export type TMeteorConnectAccountNetwork = "mainnet" | "testnet";

export interface IMeteorConnectNetworkTarget<
  T extends TMeteorConnectAccountType = TMeteorConnectAccountType,
> {
  accountType: T;
  network: TMeteorConnectAccountNetwork;
}

export interface IMeteorConnectAccountIdentifier<
  T extends TMeteorConnectAccountType = TMeteorConnectAccountType,
> extends IMeteorConnectNetworkTarget<T> {
  accountId: string;
}

export interface IMeteorConnectAccountIdentifier_Near
  extends IMeteorConnectAccountIdentifier<"near"> {}

export type TMeteorConnectAccountIdentifier = IMeteorConnectAccountIdentifier_Near;

export interface IMeteorConnectPublicKey_Ed25519 {
  type: "ed25519";
  // In the format "ed25519:base58_encoding"
  publicKey: string;
}

export type TMeteorConnectPublicKey = IMeteorConnectPublicKey_Ed25519;

export type TMeteorConnectTargetedPlatform = "v1_web" | "v1_ext" | "v2_android" | "v2_ios" | "test";

export type TMeteorConnectProtocol =
  | "tab_post_message"
  | "window_injected"
  | "deep_link_req_id"
  | "qr_req_id";

export interface IMeteorConnectTargetedClient<
  T extends TMeteorConnectTargetedPlatform = TMeteorConnectTargetedPlatform,
  P extends TMeteorConnectProtocol = TMeteorConnectProtocol,
> {
  platform: T;
  protocol: P;
}

export interface IMeteorConnectAccount {
  identifier: TMeteorConnectAccountIdentifier;
  publicKeys: TMeteorConnectPublicKey[];
  targetedClient: IMeteorConnectTargetedClient;
}

// export interface IMeteorConnectClientConnection_V1_Web
//   extends IMeteorConnectTargetedClient<"v1_web", "tab_post_message"> {}

// export type TMeteorConnectClientConnection =

export interface IMeteorConnectClientConnection extends IMeteorConnectTargetedClient {
  timeConnected?: number;
}

export type TNetworkTargetKey = `${TMeteorConnectAccountType}::${TMeteorConnectAccountNetwork}`;

export type TMeteorConnectSelectedAccountForNetworkTarget = Record<
  TNetworkTargetKey,
  TMeteorConnectAccountIdentifier | undefined
>;

export interface IMeteorConnectTypedStorage {
  accounts: IMeteorConnectAccount[];
  selectedNetworkAccounts: TMeteorConnectSelectedAccountForNetworkTarget;
  clientConnections: IMeteorConnectClientConnection[];
}

export interface IMeteorConnect_Initialize_Input {
  storage: ILocalStorageInterface;
}
