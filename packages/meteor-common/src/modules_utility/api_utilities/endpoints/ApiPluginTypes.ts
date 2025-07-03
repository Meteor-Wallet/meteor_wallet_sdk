import { TPromiseOrDirect } from "../../typescript_utils/special_types";
import { ApiPlugin } from "./ApiPlugin";
import { ApiStateStore } from "./ApiStateStore";

export interface IActionRunnerExecutionContext<
  ID extends string = string,
  EC = any,
  IN = (inputs: any) => EC,
> {
  pluginId: ID;
  initializer: IN;
  inputs: IN extends (inputs: infer IO) => EC ? IO : any;
}

export type TApiPluginAny = ApiPlugin<any, any, any, any, any, any, string, TApiPluginAny[]>;

export interface IApiPluginContextualImplementationInputs<
  EC,
  GL,
  IN_GL,
  CO_ST,
  GL_ST,
  P extends TApiPluginAny[],
> {
  context: EC;
  plugins: TContextualDependenciesFromPlugins<P>;
  global: IApiPluginGlobalImplementationOutputs<GL, IN_GL> & {
    store: ApiStateStore<GL_ST>;
  };
  store: ApiStateStore<CO_ST>;
}

export interface IApiPluginContextualImplementationOutputs<CO> {
  methods: CO;
  checkActionInputs?: (inputs: any) => TPromiseOrDirect<void>;
}

export interface IApiPluginGlobalImplementationInputs<GL_ST, P extends TApiPluginAny[]> {
  store: ApiStateStore<GL_ST>;
  plugins: TGlobalDependenciesFromPlugins<P>;
}

export interface IApiPluginGlobalImplementationOutputs<GL, IN_GL> {
  methods: GL;
  internalMethods: IN_GL;
}

export interface IApiPluginWithPlugins<P extends TApiPluginAny[]> {
  plugins: TContextualDependenciesFromPlugins<P>;
}

export type TContextualDependenciesFromPlugins<
  P extends TApiPluginAny[],
  REST extends TApiPluginAny[] | undefined = P extends [TApiPluginAny, ...infer R] ? R : undefined,
> = P[0] extends ApiPlugin<any, infer CO, infer GL, any, any, any, infer ID, any>
  ? {
      [key in ID]: CO & GL;
    } & (REST extends TApiPluginAny[] ? TContextualDependenciesFromPlugins<REST> : {})
  : {};

export type TGlobalDependenciesFromPlugins<
  P extends TApiPluginAny[],
  REST extends TApiPluginAny[] | undefined = P extends [TApiPluginAny, ...infer R] ? R : undefined,
> = P[0] extends ApiPlugin<any, any, infer GL, any, any, any, infer ID, any>
  ? {
      [key in ID]: GL;
    } & (REST extends TApiPluginAny[] ? TContextualDependenciesFromPlugins<REST> : {})
  : any;

/*
export type TInternalContextForPlugins<
  P extends ApiPlugin<any, any, any, string, any>[],
  REST extends ApiPlugin<any, any, any, string, any>[] | undefined = P extends [
    ApiPlugin<any, any, any, string, any>,
    ...infer R
  ]
    ? R
    : undefined
> = P[0] extends ApiPlugin<any, infer GL, infer IN_GL, infer ID, any>
  ? {
      [key in ID]: IApiPluginGlobalImplementation<GL, IN_GL>;
    } &
      (REST extends ApiPlugin<any, any, any, string, any>[] ? TConsumerContextForPlugins<REST> : {})
  : any;
*/
