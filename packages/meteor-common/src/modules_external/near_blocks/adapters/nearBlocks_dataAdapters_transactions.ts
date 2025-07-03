import { INearIndexer_Transaction_WithActions } from "../../near_public_indexer/types/near_indexer_transaction_types";
import {
  INearBlocks_Api1_TransactionWithActions,
  INearBlocks_Api2_TransactionWithReceipts,
} from "../types_nearBlocks";

function api1_convertTransaction(
  trx: INearBlocks_Api1_TransactionWithActions,
): INearIndexer_Transaction_WithActions {
  const { transaction_actions, ...newTrx } = trx;

  return {
    ...newTrx,
    actions: transaction_actions,
  };
}

function api2_convertTransaction(
  trx: INearBlocks_Api2_TransactionWithReceipts,
): INearIndexer_Transaction_WithActions {
  const { receipts, ...newTrx } = trx;

  return {
    ...newTrx,
    actions: receipts
      .filter(
        (r) =>
          r.receipt_kind === "ACTION" &&
          // To ensure that we only show the "top-level" actions of the transaction (prevent weird duplicate / internal actions)
          r.receipt_id === newTrx.converted_into_receipt_id,
      )
      .flatMap((r) => r.action_receipt_actions)
      .map((action, index) => ({
        ...action,
        index_in_transaction: index,
        transaction_hash: newTrx.transaction_hash,
      })),
  };
}

export const nearBlocks_dataAdapters_transactions = {
  api1_convertTransaction,
  api2_convertTransaction,
};
