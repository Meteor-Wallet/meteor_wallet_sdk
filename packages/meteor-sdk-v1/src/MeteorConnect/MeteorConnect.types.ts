import type { ILocalStorageInterface } from "../ported_common/utils/storage/storage.types.ts";

export type TMeteorConnectAccountType = "near";
export type TMeteorConnectAccountNetwork = "mainnet" | "testnet";

export interface IMeteorConnectNetworkTarget<
  T extends TMeteorConnectAccountType = TMeteorConnectAccountType,
> {
  blockchain: T;
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

/*
export type TMeteorConnectProtocol =
  | "tab_post_message"
  | "url_callback"
  | "window_injected"
  | "deep_link_req_id"
  | "qr_req_id";

export interface IMeteorConnectTargetedClient<
  T extends TMeteorConnectTargetedPlatform = TMeteorConnectTargetedPlatform,
  P extends TMeteorConnectProtocol = TMeteorConnectProtocol,
> {
  platform: T;
  protocol: P;
}*/

export type TMeteorConnectionPlatformTarget = "v1_web" | "v1_ext" | "v2_mobile" | "test";

export interface IMeteorConnection_Base<T extends TMeteorConnectionPlatformTarget> {
  platformTarget: T;
}

export interface IMeteorConnection_V1_Web extends IMeteorConnection_Base<"v1_web"> {}
export interface IMeteorConnection_V1_Ext extends IMeteorConnection_Base<"v1_ext"> {}

export type TMeteorConnection = IMeteorConnection_V1_Web | IMeteorConnection_V1_Ext;

export interface IMeteorConnectAccount {
  identifier: TMeteorConnectAccountIdentifier;
  publicKeys: TMeteorConnectPublicKey[];
  connection: TMeteorConnection;
}

// export interface IMeteorConnectClientConnection_V1_Web
//   extends IMeteorConnectTargetedClient<"v1_web", "tab_post_message"> {}

// export type TMeteorConnectClientConnection =

export type TNetworkTargetKey = `${TMeteorConnectAccountType}::${TMeteorConnectAccountNetwork}`;

export type TMeteorConnectSelectedAccountForNetworkTarget = Record<
  TNetworkTargetKey,
  TMeteorConnectAccountIdentifier | undefined
>;

export interface IMeteorConnectTypedStorage {
  accounts: IMeteorConnectAccount[];
  selectedNetworkAccounts: TMeteorConnectSelectedAccountForNetworkTarget;
}

export interface IMeteorConnect_Initialize_Input {
  storage: ILocalStorageInterface;
}
