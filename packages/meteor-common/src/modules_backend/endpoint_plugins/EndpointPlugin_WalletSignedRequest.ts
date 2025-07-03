import { EMeteorPluginIds } from "../../configs/plugin_ids";
import { IAccountSignedRequestInputs } from "../../modules_feature/accounts/account_types";
import { ApiPlugin } from "../../modules_utility/api_utilities/endpoints/ApiPlugin";

export interface IApiPlugin_WalletSignedRequest_ExecutionContext {}

export interface IApiPlugin_WalletSignedRequest_Methods {
  // verifyInputs: (inputs: IAccountSignedRequestInputs<any>) => Promise<void>;
}

export interface IApiPlugin_WalletSignedRequest_ContextualState {
  signedInputs: IAccountSignedRequestInputs<any>;
}

export interface IApiPlugin_WalletSignedRequest_GlobalMethods {}

export interface IApiPlugin_WalletSignedRequest_GlobalState {}

export interface IApiPlugin_WalletSignedRequest_GlobalInternalMethods {}

export const EndpointPlugin_WalletSignedRequest = new ApiPlugin<
  IApiPlugin_WalletSignedRequest_ExecutionContext,
  IApiPlugin_WalletSignedRequest_Methods,
  IApiPlugin_WalletSignedRequest_GlobalMethods,
  IApiPlugin_WalletSignedRequest_GlobalInternalMethods,
  IApiPlugin_WalletSignedRequest_ContextualState,
  IApiPlugin_WalletSignedRequest_GlobalState,
  EMeteorPluginIds.plugin_wallet_signed_request,
  []
>({ pluginId: EMeteorPluginIds.plugin_wallet_signed_request });
