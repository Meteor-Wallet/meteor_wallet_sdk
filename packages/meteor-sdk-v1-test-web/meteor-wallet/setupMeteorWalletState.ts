import { MeteorWallet } from "@meteorwallet/sdk";
import type { Network } from "@near-wallet-selector/core";
import * as nearAPI from "near-api-js";
import type { MeteorWalletParams_Injected, MeteorWalletState } from "./meteor-wallet-types";

export function setupMeteorWalletState() {
  const setupWalletState = async (
    params: MeteorWalletParams_Injected,
    network: Network,
  ): Promise<MeteorWalletState> => {
    const keyStore = new nearAPI.keyStores.BrowserLocalStorageKeyStore(
      window.localStorage,
      "_meteor_wallet",
    );

    const near = await nearAPI.connect({
      keyStore,
      ...network,
      headers: {},
    });

    const wallet = new MeteorWallet({
      near,
      appKeyPrefix: "near_app",
      keyStore,
    });

    return {
      wallet,
      keyStore,
    };
  };
}
