import { TFRPromise } from "../task_function/TaskFunctionTypes";
import { IActionSpecificExecutionState } from "./ActionRunnerContextualCore";
import { ApiAction } from "./ApiAction";
import { TApiPluginAny, TContextualDependenciesFromPlugins } from "./ApiPluginTypes";

type TExecuteAction = <A extends ApiAction<any, any, any>>(
  action: A,
  args: A extends ApiAction<infer I, any, any> ? I : any,
  actionState?: IActionSpecificExecutionState,
) => TFRPromise<A extends ApiAction<any, infer O, any> ? O : any>;

export type TActionCore = {
  execute: TExecuteAction;
};

export interface IApiActionContext<P extends TApiPluginAny[]> {
  plugins: TContextualDependenciesFromPlugins<P>;
  core: TActionCore;
}

export type TApiActionAny = ApiAction<any, any, TApiPluginAny[]>;

export enum EEndId_ApiActionCore {
  api_action_input_validation_failed = "api_action_input_validation_failed",
  api_action_output_validation_failed = "api_action_output_validation_failed",
}
