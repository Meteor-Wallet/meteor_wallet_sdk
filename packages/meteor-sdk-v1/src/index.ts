// The AddKey chain seam a host implements for `newKeyTransfer.runAddKeys`. The SDK owns the D33
// journal; the source full-access signing material stays with the host and never reaches it.

/**
 * The canonical Meteor Connect backends, for `initialize({ mobileBridge: { backendUrl } })`.
 *
 * Re-exported so an integration names its backend instead of hardcoding a hostname — the default
 * when `backendUrl` is omitted is production, and a development integration otherwise has nowhere
 * to read the development URL from. `deriveLocalBackendUrl(hostname)` builds the local
 * `wrangler dev` URL for a page served from that host; call it only on a development build.
 */
export {
  deriveLocalBackendUrl,
  METEOR_CONNECT_BACKENDS,
  type TMeteorConnectBackendEnvironment,
} from "@meteorwallet/connect";
export type {
  IAddKeyJournalChain,
  IAddKeyJournalJob,
  IAddKeySignedTransaction,
} from "@meteorwallet/connect-shared";
/**
 * Turning a staged account secret into a NEAR signer — what an `IAddKeyJournalChain` needs to sign
 * an AddKey with the SOURCE account's own full-access key.
 *
 * `getStagedWithSecrets()` hands a host the secrets; without these it has no supported way to
 * derive a key from one. Use the signing helper only inside a local signer boundary: never
 * serialize, log, or transmit its private half.
 */
export {
  deriveNearPublicKeyFromAccountSecret,
  deriveNearSigningKeyFromAccountSecret,
  EMeteorAppId,
  formatNearEd25519PublicKey,
  type TAccountSecretData,
  type TAccountTransferDataDecrypted,
  type TDeriveNearPublicKeyFromSecretResult,
  type TDeriveNearSigningKeyFromSecretResult,
} from "@meteorwallet/connect-shared";
export { setEnvConfig } from "./envConfig";
export * from "./MeteorConnect/action/ExecutableAction";
export * from "./MeteorConnect/action/mc_action.combined";
export * from "./MeteorConnect/logging/MeteorLogger";
export * from "./MeteorConnect/MeteorConnect";
export * from "./MeteorConnect/MeteorConnect.types";
export * from "./MeteorConnect/new_key_transfer/new_key_transfer.types";
export * from "./MeteorConnect/target_clients/mobile_bridge/mobileBridgeLease";
export { parseTransferSecretInput } from "./MeteorConnect/transfer_accounts/TransferAccountsStaging";
// Pinned locally rather than re-exported from connect-shared: the bound lives on that package's
// `/internal` subpath now, and public SDK API must not depend on an internal subpath.
export { TRANSFER_ACCOUNTS_MAX_ACCOUNTS } from "./MeteorConnect/transfer_accounts/transfer_accounts.limits";
// Transfer accounts: public types + the live-detection helper ONLY. The key handle, the
// sensitive attachment, and anything carrying the transfer decrypt key are deliberately NOT
// exported (see scripts/check-key-confinement.ts).
export * from "./MeteorConnect/transfer_accounts/transfer_accounts.types";
export * from "./MeteorWallet";
export * from "./MeteorWalletConstants";
export * from "./near_utils/convertOldFunctionCallKeyDefToNew";
export * from "./near_utils/convertSelectorActionToNearAction";
export * from "./near_utils/meteor_actions.types";
export * from "./near_utils/serializeMessageNep413";
export { EMeteorWalletSignInType } from "./ported_common/dapp/dapp.enums";
export * from "./ported_common/dapp/dapp.types";
export * from "./ported_common/utils/storage/webpage/webpage_local_storage";
export * from "./utils/MeteorSdkUtils";
