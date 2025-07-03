import { INearIndexer_Transaction_WithActions } from "../../modules_external/near_public_indexer/types/near_indexer_transaction_types";

export const transaction_interpreter = {
  interpretTransaction,
};

function interpretTransaction(trx: INearIndexer_Transaction_WithActions) {
  return trx;
}
