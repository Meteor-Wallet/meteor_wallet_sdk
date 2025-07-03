import { TNearIndexer_Receipt } from "../near_public_indexer/types/near_indexer_receipt_types";
import {
  INearIndexer_Transaction,
  INearIndexer_TransactionAction_Any,
} from "../near_public_indexer/types/near_indexer_transaction_types";

export interface INearBlocksTransaction extends INearIndexer_Transaction {}

export type TNearBlocks_Api2_Receipt = TNearIndexer_Receipt & {
  action_receipt_actions: Pick<INearIndexer_TransactionAction_Any, "action_kind" | "args">;
};

export interface INearBlocks_Api2_TransactionWithReceipts extends INearBlocksTransaction {
  receipts: TNearBlocks_Api2_Receipt[];
}

export interface INearBlocksAction extends INearIndexer_TransactionAction_Any {}

export interface INearBlocks_Api1_TransactionWithActions extends INearBlocksTransaction {
  transaction_actions: INearBlocksAction[];
}
