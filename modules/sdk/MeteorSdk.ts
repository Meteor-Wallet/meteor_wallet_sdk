import { Blockchain } from "./core/blockchain/Blockchain.ts";
import { ListManager } from "./core/utility/managers/list_manager/ListManager.ts";
import { IUniqueBlockchainProps } from "./core/blockchain/blockchain.interfaces.ts";
import { AccountManager } from "./core/account/AccountManager.ts";
import { ISubscribable } from "./core/utility/pubsub/pubsub.interfaces.ts";
import { PubSub } from "./core/utility/pubsub/PubSub.ts";
import { TPubSubListener } from "./core/utility/pubsub/pubsub.types.ts";
import { EPubSub_MeteorSdk, IPubSub_MeteorSdk } from "./core/meteor_sdk/MeteorSdk.pubsub.ts";
import {
  EErrorId_Blockchain,
  EErrorId_ListManager,
  EErrorId_Sdk,
} from "./core/errors/MeteorErrorIds.ts";
import { EPubSub_ListManager } from "./core/utility/managers/list_manager/ListManager.pubsub.ts";
import { MeteorError } from "./core/errors/MeteorError.ts";
import {
  EPubSub_AccountList,
  EPubSub_AccountManager,
} from "./core/account/AccountManager.pubsub.ts";
import { BlockchainNetwork } from "./core/blockchain/network/BlockchainNetwork.ts";
import { SignerOrigin } from "./core/keys_and_signers/signer_origins/SignerOrigin.ts";

export class MeteorSdk implements ISubscribable<IPubSub_MeteorSdk> {
  blockchains: ListManager<Blockchain, IUniqueBlockchainProps> = new ListManager<
    Blockchain,
    IUniqueBlockchainProps
  >({
    errorMap: {
      [EErrorId_ListManager.list_item_not_found]: EErrorId_Blockchain.blockchain_not_found,
    },
  });

  signerOrigins: ListManager<SignerOrigin> = new ListManager<SignerOrigin>();

  private lastSelectedNetwork?: BlockchainNetwork;

  accounts: AccountManager = new AccountManager();

  pubSub: PubSub<IPubSub_MeteorSdk> = new PubSub<IPubSub_MeteorSdk>();

  constructor() {
    // Select last known network based on first Blockchain added
    this.blockchains.subscribe(EPubSub_ListManager.item_add, (blockchain) => {
      if (this.lastSelectedNetwork == null) {
        this.setLastSelectedNetwork(blockchain.networkManager.getFirstAvailableNetwork());
      }
    });

    // Select last known network based on account selection
    this.accounts.subscribe(EPubSub_AccountManager.selected_account_change, (account) => {
      this.setLastSelectedNetwork(account.getNetwork());
    });

    // Add signer origins when new accounts are added
    this.accounts.subscribe(EPubSub_AccountList.account_add, (account) => {
      for (const signer of account.signers.getAll()) {
        if (signer.derivation?.origin != null) {
          if (!this.signerOrigins.includes(signer.derivation.origin)) {
            this.signerOrigins.add(signer.derivation.origin);
          }
        }
      }
    });

    // Remove signer origins when accounts are removed, and no accounts still hold that origin
    this.accounts.subscribe(EPubSub_AccountList.account_remove, (account) => {
      for (const signer of account.signers.getAll()) {
        if (signer.derivation?.origin != null) {
          const checkOrigin = signer.derivation?.origin;

          if (
            !this.accounts
              .getAllAccounts()
              .some((a) =>
                a.signers
                  .getAll()
                  .some((s) => s.derivation?.origin?.isEqualTo(checkOrigin) ?? false),
              )
          ) {
            this.signerOrigins.remove(checkOrigin);
          }
        }
      }
    });
  }

  private setLastSelectedNetwork(network: BlockchainNetwork) {
    if (this.lastSelectedNetwork !== network) {
      const checkedBlockchain = this.blockchains.get(network.blockchain);
      const checkedNetwork = checkedBlockchain.networkManager.networks.get(network);
      this.lastSelectedNetwork = checkedNetwork;
      this.pubSub.notifyListeners(EPubSub_MeteorSdk.last_selected_network_change, checkedNetwork);
    }
  }

  getLastSelectedNetwork(): BlockchainNetwork {
    if (this.lastSelectedNetwork == null) {
      throw MeteorError.fromId(EErrorId_Sdk.no_blockchains_with_available_networks);
    }

    return this.lastSelectedNetwork;
  }

  subscribe<K extends keyof IPubSub_MeteorSdk>(id: K, listener: TPubSubListener<any>): () => void {
    return this.pubSub.subscribe(id, listener);
  }

  unsubscribe<K extends keyof IPubSub_MeteorSdk>(id: K, listener: TPubSubListener<any>): void {
    return this.pubSub.unsubscribe(id, listener);
  }
}
