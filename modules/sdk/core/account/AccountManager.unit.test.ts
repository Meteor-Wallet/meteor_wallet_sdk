import { AccountManager } from "./AccountManager";
import { EPubSub_AccountList, EPubSub_AccountManager } from "./AccountManager.pubsub";
import { NearBlockchain } from "../../blockchains/near/NearBlockchain";
import { EPubSub_ListManager } from "../utility/managers/list_manager/ListManager.pubsub.ts";
import { EGenericBlockchainNetworkId } from "../blockchain/network/blockchain_network.enums.ts";
import { initializeBlockchains } from "../../blockchains/initializeBlockchains.ts";

describe("AccountManager", () => {
  it("Should listen for account add and remove", async () => {
    const accountManager = new AccountManager();

    const accountAddListener = jest.fn();
    const accountRemoveListener = jest.fn();

    accountManager.subscribe(EPubSub_AccountList.account_add, accountAddListener);
    accountManager.subscribe(EPubSub_AccountList.account_remove, accountRemoveListener);

    expect(accountAddListener).not.toHaveBeenCalled();
    expect(accountRemoveListener).not.toHaveBeenCalled();

    const [nearBlockchain] = initializeBlockchains();

    const account = await (
      await nearBlockchain
        .getAccountBuilder({ networkId: EGenericBlockchainNetworkId.mainnet })
        .useGeneratedSeedPhraseSigner()
    ).build();

    accountManager.addAccount(account);

    account.signers.subscribe(EPubSub_ListManager.item_add, (signers) => {
      // add signer to storage, on account storage area
    });

    account.signers.subscribe(EPubSub_ListManager.item_remove, (signers) => {
      // remove signer from storage
    });

    accountManager.subscribe(EPubSub_AccountManager.selected_account_change, (account) => {});

    expect(accountAddListener).toHaveBeenCalledTimes(1);
    expect(accountRemoveListener).not.toHaveBeenCalled();
  });
});
