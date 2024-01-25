import { Account } from "./Account";
import { EPubSub_ListManager } from "../utility/managers/list_manager/ListManager.pubsub";
import { TPubSubIdMap_ListManager } from "../utility/managers/list_manager/list_manager.types";

export enum EPubSub_AccountManager {
  selected_account_change = "selected_account_change",
  removed_all_accounts = "removed_all_accounts",
}

export enum EPubSub_AccountList {
  account_add = "account_add",
  account_remove = "account_remove",
  account_list_change = "account_list_change",
}

export interface IPubSub_AccountManager {
  [EPubSub_AccountManager.selected_account_change]: Account;
  [EPubSub_AccountManager.removed_all_accounts]: void;
  [EPubSub_AccountList.account_add]: Account;
  [EPubSub_AccountList.account_remove]: Account;
  [EPubSub_AccountList.account_list_change]: Account[];
}

export const pubSubIdMapAccountList: TPubSubIdMap_ListManager<EPubSub_AccountList> = {
  [EPubSub_AccountList.account_add]: EPubSub_ListManager.item_add,
  [EPubSub_AccountList.account_remove]: EPubSub_ListManager.item_remove,
  [EPubSub_AccountList.account_list_change]: EPubSub_ListManager.list_change,
};
