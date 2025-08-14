import type { InjectedWallet, WalletModuleFactory } from "@near-wallet-selector/core";
import icon from "~/meteor-wallet/icon";
import type { MeteorWalletParams_Injected } from "~/meteor-wallet/meteor-wallet-types";
import { createMeteorWalletInjected } from "~/meteor-wallet/setup/createMeteorWalletInjected";

export function setupMeteorWallet({
  iconUrl = icon,
  deprecated = false,
}: MeteorWalletParams_Injected = {}): WalletModuleFactory<InjectedWallet> {
  return async () => {
    return {
      id: "meteor-wallet",
      type: "injected",
      metadata: {
        available: true,
        name: "Meteor Wallet",
        description: "Securely store and stake your NEAR tokens and compatible assets with Meteor.",
        iconUrl,
        deprecated,
        downloadUrl: "https://wallet.meteorwallet.app",
        useUrlAccountImport: true,
      },
      init: (options) => {
        return createMeteorWalletInjected({
          ...options,
          params: {
            iconUrl,
          },
        });
      },
    };
  };
}
