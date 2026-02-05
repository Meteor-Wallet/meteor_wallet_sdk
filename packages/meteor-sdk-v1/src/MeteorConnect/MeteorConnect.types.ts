import type { ILocalStorageInterface } from "../ported_common/utils/storage/storage.types";

export type TMCLoggingLevel = "none" | "basic" | "debug";

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
  meta?: any;
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

export type TMeteorConnectionExecutionTarget =
  | "v1_web"
  | "v1_web_localhost"
  | "v1_ext"
  | "v2_rid_mobile_deep_link"
  | "v2_rid_qr_code"
  | "test"
  | "test_rid_deep_link"
  | "test_rid_qr_code";

export interface IMeteorConnection_Base<T extends TMeteorConnectionExecutionTarget> {
  executionTarget: T;
}

export interface IMeteorConnection_Test extends IMeteorConnection_Base<"test"> {}
export interface IMeteorConnection_Test_RidDeepLink
  extends IMeteorConnection_Base<"test_rid_deep_link"> {}
export interface IMeteorConnection_Test_RidQrCode
  extends IMeteorConnection_Base<"test_rid_qr_code"> {}
export interface IMeteorConnection_V1_Web extends IMeteorConnection_Base<"v1_web"> {}
export interface IMeteorConnection_V1_Web_Localhost
  extends IMeteorConnection_Base<"v1_web_localhost"> {
  baseUrl: string;
}
export interface IMeteorConnection_V1_Ext extends IMeteorConnection_Base<"v1_ext"> {}
export interface IMeteorConnection_V2_MobileDeepLink
  extends IMeteorConnection_Base<"v2_rid_mobile_deep_link"> {}
export interface IMeteorConnection_V2_QrCode extends IMeteorConnection_Base<"v2_rid_qr_code"> {}

export type TMeteorExecutionTargetConfig =
  | IMeteorConnection_V1_Web
  | IMeteorConnection_V1_Web_Localhost
  | IMeteorConnection_V1_Ext
  | IMeteorConnection_V2_MobileDeepLink
  | IMeteorConnection_V2_QrCode
  | IMeteorConnection_Test
  | IMeteorConnection_Test_RidDeepLink
  | IMeteorConnection_Test_RidQrCode;

export interface IMeteorConnectAccount {
  identifier: TMeteorConnectAccountIdentifier;
  publicKeys: TMeteorConnectPublicKey[];
  connection: TMeteorExecutionTargetConfig;
}

export type TNetworkTargetKey = `${TMeteorConnectAccountType}::${TMeteorConnectAccountNetwork}`;

export type TMCSelectedAccountForNetwork = {
  [key in TNetworkTargetKey]: IMeteorConnectAccountIdentifier;
};

export interface IMeteorConnectTypedStorage {
  accounts: IMeteorConnectAccount[];
  lastInitialized: number;
  selectedNetworkAccounts: TMCSelectedAccountForNetwork;
  webDevLocalhostBaseUrl: string;
}

export interface IMeteorConnect_Initialize_Input {
  storage: ILocalStorageInterface;
  // onCancelAction?: () => void;
}
