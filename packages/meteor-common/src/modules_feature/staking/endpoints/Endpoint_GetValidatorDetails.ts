import { EMeteorEndpointIds } from "../../../modules_backend/endpoints/endpoint_ids";
import { ApiAction } from "../../../modules_utility/api_utilities/endpoints/ApiAction";
import { TIOGetValidatorDetails_Input, TIOGetValidatorDetails_Output } from "../staking_types";

export const Endpoint_GetValidatorDetails = new ApiAction<
  TIOGetValidatorDetails_Input,
  TIOGetValidatorDetails_Output,
  []
>(EMeteorEndpointIds.ms_get_validator_details, []);
