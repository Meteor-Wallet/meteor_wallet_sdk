import type { ParsedContract } from "near-contract-parser";
import { EMeteorEndpointIds } from "../../../modules_backend/endpoints/endpoint_ids";
import { ENearNetwork } from "../../../modules_external/near/types/near_basic_types";
import { ApiAction } from "../../../modules_utility/api_utilities/endpoints/ApiAction";

export interface IApiAction_GetContractMethods_Input {
  network: ENearNetwork;
  contractId: string;
}

export interface IApiAction_GetContractMethods_Output {
  interface: ParsedContract;
}

export const Endpoint_GetContractInterface = new ApiAction<
  IApiAction_GetContractMethods_Input,
  IApiAction_GetContractMethods_Output,
  []
>(EMeteorEndpointIds.ms_get_contract_interface, []);
