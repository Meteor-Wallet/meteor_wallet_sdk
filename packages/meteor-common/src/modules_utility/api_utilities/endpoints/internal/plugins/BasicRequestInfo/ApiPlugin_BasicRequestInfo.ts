import { ApiPlugin } from "../../../ApiPlugin";
import { IActionRunnerExecutionContext } from "../../../ApiPluginTypes";

export interface IApiPlugin_BasicRequestInfo_ExecutionContextInputs {
  getIp: () => string | undefined;
}

export type TApiPlugin_BasicRequestInfo_ExecutionContext = IActionRunnerExecutionContext<
  "basic_request_info",
  IApiPlugin_BasicRequestInfo_ExecutionContextInputs
>;

export interface IApiPlugin_BasicRequestInfo_ContextualMethods {
  getIp: () => string | undefined;
}

export interface IApiPlugin_BasicRequestInfo_ContextualState {
  ip: string;
}

export interface IApiPlugin_BasicRequestInfo_GlobalMethods {}

export interface IApiPlugin_BasicRequestInfo_GlobalState {}

export interface IApiPlugin_BasicRequestInfo_GlobalInternalMethods {}

export const ApiPlugin_BasicRequestInfo = new ApiPlugin<
  IApiPlugin_BasicRequestInfo_ExecutionContextInputs,
  IApiPlugin_BasicRequestInfo_ContextualMethods,
  IApiPlugin_BasicRequestInfo_GlobalMethods,
  IApiPlugin_BasicRequestInfo_GlobalInternalMethods,
  IApiPlugin_BasicRequestInfo_ContextualState,
  IApiPlugin_BasicRequestInfo_GlobalState,
  "basic_request_info",
  []
>({ pluginId: "basic_request_info", requiresExecutionContext: true });
