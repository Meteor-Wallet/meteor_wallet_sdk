import { MeteorSdk } from "../../MeteorSdk.ts";
import { NearBlockchain } from "../../blockchains/near/NearBlockchain";
import { EBlockchain } from "../blockchain/blockchain.enums";
import { EGenericBlockchainNetworkId } from "../blockchain/network/blockchain_network.enums";
import { EPubSub_AccountManager } from "../account/AccountManager.pubsub";
import { EAccountFeature } from "../account/features/account_feature.enums.ts";
import { EPubSub_ListManager } from "../utility/managers/list_manager/ListManager.pubsub";
import { EPubSub_TokenAmount } from "../assets/token/TokenAmount.pubsub.ts";
import { initializeBlockchains } from "../../blockchains/initializeBlockchains.ts";

describe("Meteor App Manager", () => {
  it("Should only be able to add one blockchain of each type", () => {
    const meteor = new MeteorSdk();

    const nearBlockchain = new NearBlockchain();

    meteor.blockchains.add(nearBlockchain);

    expect(() => {
      meteor.blockchains.add(nearBlockchain);
    }).toThrow();
  });

  it("Should only be able to get the same blockchain instance each time", async () => {
    const meteor = new MeteorSdk();

    const [nearBlockchain] = initializeBlockchains();

    meteor.blockchains.add(nearBlockchain);

    const instance1 = meteor.blockchains.get({ id: EBlockchain.near });
    const instance2 = meteor.blockchains.get({ id: EBlockchain.near });

    expect(nearBlockchain).toBe(instance1);
    expect(nearBlockchain).toBe(instance2);
    expect(instance1).toBe(instance2);

    const buildAccount = nearBlockchain.getAccountBuilder({
      networkId: EGenericBlockchainNetworkId.mainnet,
    });
    await buildAccount.useGeneratedSeedPhraseSigner();
    const account = buildAccount.build();

    meteor.accounts.subscribe(EPubSub_AccountManager.selected_account_change, (selectedAccount) => {
      if (selectedAccount != null && selectedAccount.supportsFeature(EAccountFeature.token)) {
        selectedAccount.basic
          .getFeature(EAccountFeature.token)
          .accountTokenAmounts.subscribe(EPubSub_ListManager.list_change, (tokenAmounts) => {
            console.log(tokenAmounts);
            for (const tokenAmount of tokenAmounts) {
              tokenAmount.subscribe(EPubSub_TokenAmount.amount_changed, (tokenAmount) => {});
            }
          });
      }
    });
  });
});
