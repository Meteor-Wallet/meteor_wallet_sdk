import type { EMeteorAppId } from "@meteorwallet/connect-shared";
import type { KeyStore } from "@near-js/keystores";
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
  | "v2_bridge_mobile"
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
export interface IMeteorConnection_V2_BridgeMobile
  extends IMeteorConnection_Base<"v2_bridge_mobile"> {
  schemaVersion: 1;
  bridgeEnvironmentId: string;
  meteorAppId: EMeteorAppId;
  partnerClientId: string;
  walletVerifyPublicKey: string;
}
export interface IMeteorConnection_V2_MobileDeepLink
  extends IMeteorConnection_Base<"v2_rid_mobile_deep_link"> {}
export interface IMeteorConnection_V2_QrCode extends IMeteorConnection_Base<"v2_rid_qr_code"> {}

export type TMeteorExecutionTargetConfig =
  | IMeteorConnection_V1_Web
  | IMeteorConnection_V1_Web_Localhost
  | IMeteorConnection_V1_Ext
  | IMeteorConnection_V2_BridgeMobile
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
  dev_000_met: number;
  /**
   * Opt-in staged transfer accounts (plaintext-at-rest — see
   * IMeteorConnectTransferAccountsConfig.persistStagedAccounts). Lives under the `met_data_`
   * prefix deliberately: the `met_bridge_partner::` namespace is wiped wholesale by identity
   * reset, and staged secrets must never share that fate implicitly.
   */
  stagedTransferAccounts: unknown;
  /**
   * Secret-free, validated new-key transfer orchestration journal. The shared AddKey journal
   * machinery keeps its own three slots beside this one — `newKeyTransferAddKeyJournal`,
   * `newKeyTransferStartResultJournal` and `newKeyTransferPendingVerify` — written as raw strings
   * through the storage adapter (they are serialized by connect-shared, not by this map), under
   * the same `met_data_` prefix so a partner-identity reset cannot wipe AddKey recovery.
   */
  newKeyTransferSessions: unknown;
  /**
   * Cached terminal verify exchanges keyed by transferSessionId (stabilization SDK-4,
   * `exact_cached_result`): a byte-identical repeated verification replays from here without
   * asking the wallet again. Secret-free (request + signed-output rows only).
   */
  newKeyTransferVerifyResults: unknown;
  /**
   * Bounded archive of fully completed transfer sessions (stabilization SD10): retention that
   * keeps the active journal under its capacity without deleting completion records.
   */
  newKeyTransferArchivedSessions: unknown;
}

export interface IMeteorConnect_Initialize_Input {
  storage: ILocalStorageInterface;
  mobileBridge?: IMeteorConnectMobileBridgeConfig;
  nearKeyStoreProvider?: IMeteorConnectNearKeyStoreProvider;
  // onCancelAction?: () => void;
}

export interface IMeteorConnectBridgeLeaseHandle {
  readonly ownerToken: string;
  assertOwned(): Promise<void>;
  release(): Promise<void>;
}

export interface IMeteorConnectBridgeLeaseProvider {
  acquire(name: string, options?: { timeoutMs?: number }): Promise<IMeteorConnectBridgeLeaseHandle>;
}

export interface IMeteorConnectNativeAppOpener {
  /** Must synchronously attempt the opaque custom-scheme link from the originating click. */
  open(fullLink: string): void;
}

export interface IMeteorConnectNearKeyStoreProvider {
  getKeyStore(): KeyStore;
}

export interface IMeteorConnectTransferAccountsConfig {
  /**
   * Master switch for the transfer flow (dark by default). When off,
   * transferAccounts.prompt()/createAction() throw `transfer_accounts_unavailable` and no
   * UI/registry behavior changes for existing consumers. The staging API works regardless —
   * it is inert data handling.
   */
  enabled?: boolean;
  /**
   * Ordered app-id preference for transfer bridges (link selection takes the first match;
   * the whole list is sent to create_bridge). Default: [meteor_wallet_web_dev] when the
   * configured mobile app id is the dev variant, else [meteor_wallet_web] — matching how
   * meteor-frontend identifies per environment. Override with [meteor_bridge_test_web] when
   * testing against the mc_backend demo wallet.
   */
  meteorAppIds?: EMeteorAppId[];
  /**
   * Persist staged accounts (plaintext-at-rest in this origin's storage) under typed storage.
   * Recommended only for development/testnet integration; default false = in-memory staging
   * that is lost on reload and dropped on dispose().
   */
  persistStagedAccounts?: boolean;
  /**
   * Opt-in: clear the staged set after a signed { success: true } result. Default FALSE — staged
   * accounts remain so the user can transfer them to another platform too, and because silently
   * emptying the partner's working set after one transfer is surprising. Staged entries are
   * copies; keeping them never blocks a retry (the receiving wallet skips already-imported
   * accounts).
   */
  clearStagedOnSuccess?: boolean;
  /**
   * TESTING ESCAPE HATCH: raise the staged-set cap above the protocol's per-transfer bound
   * (TRANSFER_ACCOUNTS_MAX_ACCOUNTS = 50). Staging beyond 50 becomes possible, but a single
   * transfer still cannot exceed 50 accounts — the shared schemas, the bridge backend, and the
   * receiving wallet each enforce that bound independently. With an oversized staged set,
   * prompt() with no options throws `transfer_accounts_invalid_input`; pass a ≤50 subset via
   * prompt({ accounts }) instead (e.g. chunked transfers). Leave unset in production.
   */
  maxStagedAccounts?: number;
}

export interface IMeteorConnectMobileBridgeConfig {
  enabled?: boolean;
  backendUrl?: string;
  meteorAppId?: EMeteorAppId.meteor_wallet_mobile | EMeteorAppId.meteor_wallet_mobile_dev;
  leaseProvider?: IMeteorConnectBridgeLeaseProvider;
  nativeAppOpener?: IMeteorConnectNativeAppOpener;
  partnerMetadata?: {
    name?: string;
    description?: string;
    iconUrl?: string;
    originUrl?: string;
  };
  transferAccounts?: IMeteorConnectTransferAccountsConfig;
  /**
   * Dedicated enable flag for the new-key transfer surface (stabilization SDK-12). When omitted,
   * it follows `transferAccounts.enabled` for continuity with pre-stabilization hosts; set it
   * explicitly to run the two features independently.
   */
  newKeyTransfer?: { enabled?: boolean };
}
