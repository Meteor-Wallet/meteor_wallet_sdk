import { MeteorWallet } from "@meteorwallet/sdk";
import * as nearAPI from "near-api-js";

export async function createNativeMeteorWallet() {
  const keyStore = new nearAPI.keyStores.BrowserLocalStorageKeyStore(
    window.localStorage,
    "_meteor_wallet",
  );

  const wallet = new MeteorWallet({
    networkId: "testnet",
    keyStore,
  });

  return {
    wallet,
    keyStore,
  };
}
