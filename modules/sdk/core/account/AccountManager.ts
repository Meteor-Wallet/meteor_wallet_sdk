import { Account } from "./Account";
import { MeteorError } from "../errors/MeteorError";
import { EErrorId_Account, EErrorId_ListManager } from "../errors/MeteorErrorIds";
import { BasicAccount } from "./BasicAccount";
import { PubSub } from "../utility/pubsub/PubSub";
import { ISubscribable } from "../utility/pubsub/pubsub.interfaces";
import {
  EPubSub_AccountList,
  EPubSub_AccountManager,
  IPubSub_AccountManager,
  pubSubIdMapAccountList,
} from "./AccountManager.pubsub";
import { TPubSubListener } from "../utility/pubsub/pubsub.types";
import { ListManager } from "../utility/managers/list_manager/ListManager";
import { EnumUtils } from "../utility/javascript_datatype_utils/enum.utils";
import {
  IAccountStorableData,
  IWithBasicAccount,
  IWithBasicAccountProps,
} from "./account.interfaces";
import { EPubSub_ListManager } from "../utility/managers/list_manager/ListManager.pubsub.ts";

export class AccountManager implements ISubscribable<IPubSub_AccountManager> {
  private accounts: ListManager<Account> = new ListManager<Account, IWithBasicAccountProps>({
    errorMap: {
      [EErrorId_ListManager.list_item_not_found]: EErrorId_Account.account_not_found_in_core,
      [EErrorId_ListManager.list_item_already_exists]:
        EErrorId_Account.account_already_exists_in_core,
    },
  });
  private selectedAccount?: Account;
  pubSub = new PubSub<IPubSub_AccountManager>();

  constructor() {
    this.accounts.subscribe(EPubSub_ListManager.item_remove, (removedAccount) => {
      const remainingAccounts = this.accounts.getAll();
      /*
       * Ensure that if we remove the last available account, we notify listeners
       * */
      if (remainingAccounts.length === 0) {
        this.pubSub.notifyListeners(EPubSub_AccountManager.removed_all_accounts, undefined);
        return;
      }

      /**
       * Ensure that if we remove the selected account we
       * change to another account that is as similar to it
       * (there should always be at least one account selected)
       */
      if (this.selectedAccount != null && removedAccount.isEqualTo(this.selectedAccount)) {
        let nextAccount: Account | undefined;

        for (let i = 0; i < remainingAccounts.length; i++) {
          if (
            remainingAccounts[i].basic.blockchainId === removedAccount.basic.blockchainId &&
            remainingAccounts[i].basic.getNetworkId() === removedAccount.basic.getNetworkId()
          ) {
            nextAccount = remainingAccounts[i];
            break;
          }

          if (
            nextAccount === undefined &&
            remainingAccounts[i].basic.blockchainId === removedAccount.basic.blockchainId
          ) {
            nextAccount = remainingAccounts[i];
          }
        }

        if (nextAccount == null) {
          nextAccount = remainingAccounts[0];
        }

        this.selectAccount(nextAccount);
      }
    });
  }

  subscribe<K extends keyof IPubSub_AccountManager>(
    id: K,
    listener: TPubSubListener<IPubSub_AccountManager[K]>,
  ): () => void {
    if (!EnumUtils.isEnumMember(EPubSub_AccountList, id)) {
      return this.pubSub.subscribe(id, listener);
    } else {
      return this.accounts.subscribe(pubSubIdMapAccountList[id], listener as TPubSubListener<any>);
    }
  }

  unsubscribe<K extends keyof IPubSub_AccountManager>(
    id: K,
    listener: TPubSubListener<IPubSub_AccountManager[K]>,
  ): void {
    if (!EnumUtils.isEnumMember(EPubSub_AccountList, id)) {
      return this.pubSub.unsubscribe(id, listener);
    } else {
      return this.accounts.unsubscribe(
        pubSubIdMapAccountList[id],
        listener as TPubSubListener<any>,
      );
    }
  }

  addAccount(account: Account) {
    this.accounts.add(account);

    if (this.selectedAccount == null) {
      this.selectAccount(account);
    }
  }

  includesAccount(account: IWithBasicAccountProps): boolean {
    return this.accounts.includes(account);
  }

  hasAnyAccount(): boolean {
    return this.accounts.hasAny();
  }

  getAccount(account: IWithBasicAccountProps): Account {
    return this.accounts.get(account);
  }

  getAllAccounts(): Account[] {
    return this.accounts.getAll();
  }

  getSelectedAccount(): Account {
    if (!this.hasAnyAccount()) {
      throw MeteorError.fromId(EErrorId_Account.no_accounts_in_core);
    }

    if (this.selectedAccount == null) {
      this.selectAccount(this.accounts.getAll()[0]);
    }

    return this.selectedAccount!;
  }

  removeAccount(account: IWithBasicAccountProps) {
    this.accounts.remove(account);
  }

  selectAccount(account: IWithBasicAccountProps) {
    if (this.selectedAccount !== account) {
      this.selectedAccount = this.getAccount(account);
      this.pubSub.notifyListeners(
        EPubSub_AccountManager.selected_account_change,
        this.selectedAccount,
      );
    }
  }
}
