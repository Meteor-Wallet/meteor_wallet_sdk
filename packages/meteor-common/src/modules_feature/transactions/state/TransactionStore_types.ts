import { TSignedInAccountKeyItem } from "../../accounts/account_types";
import { INearIndexerTransaction_Stripped } from "../interpreter/transaction_interpreter_types";

export interface ITransactionStore {
  signing: {
    showModal: boolean;
    payload?: {
      accountId: string;
      keyData: TSignedInAccountKeyItem;
      transactions: INearIndexerTransaction_Stripped[];
      signedTransactions: any[];
    };
  };
}
