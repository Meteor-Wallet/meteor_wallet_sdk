import { GetOption, SetOption } from "cookies";
import { ApiPlugin } from "../../ApiPlugin";
import { IActionRunnerExecutionContext } from "../../ApiPluginTypes";

export interface ICookiePlugin_ExecutionContextInputs {
  set: (inputs: { key: string; value: string; opt?: SetOption }) => void;
  get: (inputs: { key: string; opt?: GetOption }) => string | undefined;
  clear: (inputs: { key: string; opt?: SetOption }) => void;
}

export type TCookiePlugin_ExecutionContext = IActionRunnerExecutionContext<
  "cookies",
  ICookiePlugin_ExecutionContextInputs
>;

export interface ICookiePlugin_Methods {
  set: (inputs: { key: string; value: string; opt?: SetOption }) => void;
  setVar: <T = any>(inputs: { key: string; value: T; opt?: SetOption }) => void;
  get: (inputs: { key: string; opt?: GetOption }) => string | undefined;
  getVar: <T>(inputs: { key: string; opt?: GetOption }) => T | undefined;
  clear: (inputs: { key: string; opt?: SetOption }) => void;
}

export interface ICookiePlugin_GlobalMethods {}

export interface ICookiePlugin_InternalGlobalMethods {}

export interface ICookiePlugin_ContextualState {}

export interface ICookiePlugin_GlobalState {}

export const CookiePlugin_Def = new ApiPlugin<
  ICookiePlugin_ExecutionContextInputs,
  ICookiePlugin_Methods,
  ICookiePlugin_GlobalMethods,
  ICookiePlugin_InternalGlobalMethods,
  ICookiePlugin_ContextualState,
  ICookiePlugin_GlobalState,
  "cookies",
  []
>({ pluginId: "cookies", requiresExecutionContext: true });
