import { NearBlocks } from "../../../modules_external/near_blocks/NearBlocks";
import { nearBlocks_dataAdapters_transactions } from "../../../modules_external/near_blocks/adapters/nearBlocks_dataAdapters_transactions";
import { NearPublicIndexer } from "../../../modules_external/near_public_indexer/NearPublicIndexer";
import { INearIndexer_Transaction_WithActions } from "../../../modules_external/near_public_indexer/types/near_indexer_transaction_types";
import { TFRSuccessPayload } from "../../../modules_utility/api_utilities/task_function/TaskFunctionResponses";
import { PromiseUtils } from "../../../modules_utility/javascript_helpers/PromiseUtils";
import { Endpoint_GetAccountTransactionHistory } from "./Endpoint_GetAccountTransactionHistory";

Endpoint_GetAccountTransactionHistory.implement(
  async ({ network, accountId, limit = 20, offset = 0 }) => {
    if (limit > 100) {
      limit = 100;
    }

    const transactions: INearIndexer_Transaction_WithActions[] =
      await PromiseUtils.raceFirstSuccessOrAllFailed<INearIndexer_Transaction_WithActions[]>([
        NearBlocks.async_functions
          .api2_getRelatedTransactionsWithActions({
            network,
            address: accountId,
            limit,
            offset,
          })
          .then(({ transactions }): INearIndexer_Transaction_WithActions[] => {
            return transactions.map((trx) =>
              nearBlocks_dataAdapters_transactions.api2_convertTransaction(trx),
            );
          }),
        NearPublicIndexer.getClient(network).getTransactionsWithActionsForAccountId({
          accountId,
          limit,
          offset,
        }),
      ]);

    return TFRSuccessPayload({
      transactions,
      limit,
      offset,
    });
  },
);

export const Endpoint_GetAccountTransactionHistory_Impl = Endpoint_GetAccountTransactionHistory;
