import { EMeteorEndpointIds } from "../../../modules_backend/endpoints/endpoint_ids";
import { ENearNetwork } from "../../../modules_external/near/types/near_basic_types";
import { INearIndexer_Transaction_WithActions } from "../../../modules_external/near_public_indexer/types/near_indexer_transaction_types";
import { ApiAction } from "../../../modules_utility/api_utilities/endpoints/ApiAction";

export interface IApiAction_TransactionsHistory_Input {
  network: ENearNetwork;
  accountId: string;
  offset?: number;
  limit?: number;
}

export interface IApiAction_TransactionsHistory_Output {
  transactions: INearIndexer_Transaction_WithActions[];
  offset: number;
  limit: number;
}

export const Endpoint_GetAccountTransactionHistory = new ApiAction<
  IApiAction_TransactionsHistory_Input,
  IApiAction_TransactionsHistory_Output,
  []
>(EMeteorEndpointIds.ms_get_transactions_history, []);
