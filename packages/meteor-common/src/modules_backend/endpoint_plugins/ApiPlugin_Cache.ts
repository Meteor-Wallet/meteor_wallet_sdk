import { EMeteorPluginIds } from "../../configs/plugin_ids";
import { ApiPlugin } from "../../modules_utility/api_utilities/endpoints/ApiPlugin";

interface ICacheSetOptions {
  expirySeconds: number;
}

interface IWithKey {
  key: string;
}

interface ISetString_Inputs extends IWithKey {
  value: string;
  options?: ICacheSetOptions;
}

interface IGetString_Outputs {
  ttlSeconds: number;
}

export interface IApiPlugin_Cache_ExecutionContext {
  setString: (inputs: ISetString_Inputs) => Promise<void>;
  getString: (inputs: IWithKey) => Promise<string>;
  clear: (inputs: IWithKey) => Promise<void>;
}

export interface IApiPlugin_Cache_Methods {}

export interface IApiPlugin_Cache_ContextualState {}

export interface IApiPlugin_Cache_GlobalMethods {}

export interface IApiPlugin_Cache_GlobalState {}

export interface IApiPlugin_Cache_GlobalInternalMethods {}

export const ApiPlugin_Cache = new ApiPlugin<
  IApiPlugin_Cache_ExecutionContext,
  IApiPlugin_Cache_Methods,
  IApiPlugin_Cache_GlobalMethods,
  IApiPlugin_Cache_GlobalInternalMethods,
  IApiPlugin_Cache_ContextualState,
  IApiPlugin_Cache_GlobalState,
  EMeteorPluginIds.plugin_cache,
  []
>({ pluginId: EMeteorPluginIds.plugin_cache });
