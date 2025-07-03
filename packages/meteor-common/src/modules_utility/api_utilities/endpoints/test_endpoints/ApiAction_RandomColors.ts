import { EndpointPlugin_WalletSignedRequest } from "../../../../modules_backend/endpoint_plugins/EndpointPlugin_WalletSignedRequest";
import { EMeteorEndpointIds } from "../../../../modules_backend/endpoints/endpoint_ids";
import { ApiAction } from "../ApiAction";

export interface IApiAction_RandomColors_Input {
  num: number;
}

export interface IApiAction_RandomColors_Output {
  color: string;
}

export const ApiAction_RandomColors = new ApiAction<
  IApiAction_RandomColors_Input,
  IApiAction_RandomColors_Output,
  [typeof EndpointPlugin_WalletSignedRequest]
>(EMeteorEndpointIds.ms_get_random_color, [EndpointPlugin_WalletSignedRequest]);
