import { ApiPlugin } from "../../ApiPlugin";
import { CookiePlugin_Def } from "./CookiePlugin_Def";

export interface IApiPlugin_CloudFunctionSessionCookie_ContextualMethods {
  setVar: <T = any>(inputs: { key: string; value: T }) => void;
  getVar: <T = any>(inputs: { key: string }) => T;
  clear: (inputs: { key: string }) => void;
  clearAll: () => void;
  extendSession: () => void;
}

export interface IApiPlugin_CloudFunctionSessionCookie_ContextualState {
  session: any;
}

export interface IApiPlugin_CloudFunctionSessionCookie_GlobalMethods {}

export interface IApiPlugin_CloudFunctionSessionCookie_GlobalState {}

export interface IApiPlugin_CloudFunctionSessionCookie_GlobalInternalMethods {}

export const ApiPlugin_CloudFunctionSessionCookie = new ApiPlugin<
  {},
  IApiPlugin_CloudFunctionSessionCookie_ContextualMethods,
  IApiPlugin_CloudFunctionSessionCookie_GlobalMethods,
  IApiPlugin_CloudFunctionSessionCookie_GlobalInternalMethods,
  IApiPlugin_CloudFunctionSessionCookie_ContextualState,
  IApiPlugin_CloudFunctionSessionCookie_GlobalState,
  "cloud_function_session_cookie",
  [typeof CookiePlugin_Def]
>({
  pluginId: "cloud_function_session_cookie",
  parentPlugins: [CookiePlugin_Def],
});
