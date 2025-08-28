import type { MeteorWallet as MeteorWalletSdk } from "@meteorwallet/sdk-v1";
import { BrowserLocalStorageKeyStore } from "@near-js/keystores-browser";

export interface MeteorWalletParams_Injected {
  iconUrl?: string;
  deprecated?: boolean;
}

export interface MeteorWalletState {
  wallet: MeteorWalletSdk;
  keyStore: BrowserLocalStorageKeyStore;
}
