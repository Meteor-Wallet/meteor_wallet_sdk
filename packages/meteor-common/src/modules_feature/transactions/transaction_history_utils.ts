import { INearIndexer_Transaction_WithActions } from "../../modules_external/near_public_indexer/types/near_indexer_transaction_types";
import { transaction_interpreter } from "./interpreter/transaction_interpreter";

function interpretTransactionsForHistory(transactions: INearIndexer_Transaction_WithActions[]) {
  // const :

  for (const transaction of transactions) {
    const assetMovements = transaction_interpreter.extractAssetMovements(transaction);
  }
}

export const transaction_history_utils = {
  interpretTransactionsForHistory,
};
