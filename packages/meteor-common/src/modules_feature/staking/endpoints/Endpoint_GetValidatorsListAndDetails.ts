import { EMeteorEndpointIds } from "../../../modules_backend/endpoints/endpoint_ids";
import { ApiAction } from "../../../modules_utility/api_utilities/endpoints/ApiAction";
import {
  TIOGetValidatorsListAndDetails_Input,
  TIOGetValidatorsListAndDetails_Output,
} from "../staking_types";

export const Endpoint_GetValidatorsListAndDetails = new ApiAction<
  TIOGetValidatorsListAndDetails_Input,
  TIOGetValidatorsListAndDetails_Output,
  []
>(EMeteorEndpointIds.ms_get_near_staking_pools, []);
