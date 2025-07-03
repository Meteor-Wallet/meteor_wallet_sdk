import { EMeteorEndpointIds } from "../../../modules_backend/endpoints/endpoint_ids";
import { ENearNetwork } from "../../../modules_external/near/types/near_basic_types";
import { INearIndexer_Transaction_WithActions } from "../../../modules_external/near_public_indexer/types/near_indexer_transaction_types";
import { ApiAction } from "../../../modules_utility/api_utilities/endpoints/ApiAction";

export interface IApiAction_Transaction_Input {
  network: ENearNetwork;
  hash: string;
}

export interface IApiAction_Transaction_Output {
  transaction?: INearIndexer_Transaction_WithActions;
}

export const ApiAction_Transaction = new ApiAction<
  IApiAction_Transaction_Input,
  IApiAction_Transaction_Output,
  []
>(EMeteorEndpointIds.ms_get_transaction, []);
