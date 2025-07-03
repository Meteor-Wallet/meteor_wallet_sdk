import { ApiPlugin } from "../../modules_utility/api_utilities/endpoints/ApiPlugin";

export interface IApiPlugin_SecureEndpoint_ContextualMethods {}

export interface IApiPlugin_SecureEndpoint_ContextualState {}

export interface IApiPlugin_SecureEndpoint_GlobalMethods {}

export interface IApiPlugin_SecureEndpoint_GlobalState {}

export interface IApiPlugin_SecureEndpoint_GlobalInternalMethods {}

export const ApiPlugin_SecureEndpoint = new ApiPlugin<
  {},
  IApiPlugin_SecureEndpoint_ContextualMethods,
  IApiPlugin_SecureEndpoint_GlobalMethods,
  IApiPlugin_SecureEndpoint_GlobalInternalMethods,
  IApiPlugin_SecureEndpoint_ContextualState,
  IApiPlugin_SecureEndpoint_GlobalState,
  "_unset",
  []
>({ pluginId: "_unset" });
