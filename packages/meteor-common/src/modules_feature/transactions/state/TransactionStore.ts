import { Store } from "pullstate";
import { ITransactionStore } from "./TransactionStore_types";

export const TransactionStore = new Store<ITransactionStore>({
  signing: {
    showModal: false,
  },
});
