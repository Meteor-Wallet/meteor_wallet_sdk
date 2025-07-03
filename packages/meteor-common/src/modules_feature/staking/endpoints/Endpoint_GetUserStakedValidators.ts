import { EMeteorEndpointIds } from "../../../modules_backend/endpoints/endpoint_ids";
import { ApiAction } from "../../../modules_utility/api_utilities/endpoints/ApiAction";
import {
  TIOGetUserStakedValidators_Input,
  TIOGetUserStakedValidators_Output,
} from "../staking_types";

export const Endpoint_GetUserStakedValidators = new ApiAction<
  TIOGetUserStakedValidators_Input,
  TIOGetUserStakedValidators_Output,
  []
>(EMeteorEndpointIds.ms_get_user_staked_validators, []);
