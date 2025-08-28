import { MeteorWallet } from "@meteorwallet/sdk-v1";
import { KeyStore } from "@near-js/keystores";
import type { Network } from "@near-wallet-selector/core";
import * as nearAPI from "near-api-js";
import type { MeteorWalletParams_Injected } from "~/meteor-wallet/meteor-wallet-types";

export async function setupMeteorWalletState(
  params: MeteorWalletParams_Injected,
  network: Network,
): Promise<{
  wallet: MeteorWallet;
  keyStore: KeyStore;
}> {
  const keyStore = new nearAPI.keyStores.BrowserLocalStorageKeyStore(
    window.localStorage,
    "_meteor_wallet",
  );

  const wallet = new MeteorWallet({
    ...network,
    keyStore,
  });

  return {
    wallet,
    keyStore,
  };
}
