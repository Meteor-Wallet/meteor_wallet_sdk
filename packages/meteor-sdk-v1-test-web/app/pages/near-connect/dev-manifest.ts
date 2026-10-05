import { EXECUTOR_SOURCES, type TExecutorSource } from "./executor-source";

export const devManifest = (executorSource: TExecutorSource) =>
  ({
    version: "1.1.0",
    wallets: [
      {
        id: "meteor-wallet",
        name: "Meteor Wallet",
        icon: "https://storage.googleapis.com/meteor-apps-v2/graphics/meteor_connect_ui/meteor-logo-svg.svg",
        description:
          "The most simple and secure wallet to manage your crypto, access DeFi, and explore Web3",
        website: "https://meteorwallet.app/",
        version: EXECUTOR_SOURCES[executorSource].manifestVersion,
        executor: EXECUTOR_SOURCES[executorSource].url,
        type: "sandbox",

        features: {
          signMessage: true,
          signInWithoutAddKey: true,
          signInAndSignMessage: true,
          signAndSendTransaction: true,
          signAndSendTransactions: true,
          signInWithFunctionCallKey: true,
          signDelegateActions: true,
          mainnet: true,
          testnet: true,
        },

        platform: {
          web: "https://wallet.meteorwallet.app",
          chrome:
            "https://chromewebstore.google.com/detail/meteor-wallet/pcndjhkinnkaohffealmlmhaepkpmgkb",
        },

        permissions: {
          storage: true,
          allowsOpen: [
            "https://chromewebstore.google.com",
            "https://wallet.meteorwallet.app",
            "https://meteorwallet.app",
            "https://localhost:3001",
            "meteorwallet://bridge_request",
            "meteorwalletdev://bridge_request",
          ],
          external: ["meteorCom", "meteorComV2"],
        },
      },
    ],
  }) as any;
