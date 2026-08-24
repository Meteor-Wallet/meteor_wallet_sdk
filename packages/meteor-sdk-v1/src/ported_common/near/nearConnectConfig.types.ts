import type { KeyStore } from "@near-js/keystores";
import type { Provider } from "@near-js/providers";
import type { Signer } from "@near-js/signers";
import type { LoggerService } from "@near-js/utils";

/**
 * Structural stand-in for `near-api-js`'s `NearConfig`/`ConnectConfig`.
 *
 * The SDK deliberately does **not** import types from `near-api-js`. Doing so would drag the whole
 * `near-api-js` package into the public `@meteorwallet/sdk` type surface, forcing every consumer to
 * install (and resolve a single version of) it — which is exactly what made downstream wallets patch
 * the published artifacts. The shape below is assignment-compatible with `ConnectConfig`, so an
 * existing `near-api-js` config object still satisfies it structurally.
 */
export interface INearConnectConfig {
  /** Holds `KeyPair`s for signing transactions. */
  keyStore?: KeyStore;
  /** @hidden */
  signer?: Signer;
  /** NEAR Contract Helper url, used to create accounts when no master account is provided. */
  helperUrl?: string;
  /** Balance transferred from `masterAccount` to a created account. */
  initialBalance?: string;
  /** The account to use when creating new accounts. */
  masterAccount?: string;
  /** `KeyPair`s are stored in a `KeyStore` under this namespace. */
  networkId: string;
  /** NEAR RPC API url, used to make JSON RPC calls. */
  nodeUrl: string;
  /** NEAR RPC API headers. Can be used to pass an API key and other parameters. */
  headers?: { [key: string]: string | number };
  /** NEAR wallet url, used to redirect users to their wallet in browser applications. */
  walletUrl?: string;
  /** Backward-compatibility for older versions. */
  deps?: { keyStore: KeyStore };
  /** Logger to use. Pass `false` to turn logging off. */
  logger?: LoggerService | false;
  /** Explicit NEAR RPC API connection. */
  provider?: Provider;
  /** Initialize an `InMemoryKeyStore` by reading the file at this path. */
  keyPath?: string;
}
