import { TPromiseOrDirect } from "../../typescript_utils/special_types";
import {
  IApiPluginContextualImplementationInputs,
  IApiPluginContextualImplementationOutputs,
  // IApiPluginExecutionContextProvision,
  IApiPluginGlobalImplementationInputs,
  IApiPluginGlobalImplementationOutputs,
  TApiPluginAny,
} from "./ApiPluginTypes";

/*export type TPluginContextualInitializer<
  CO extends Omit<any, keyof GL>,
  GL extends Omit<any, keyof CO>,
  IN_GL,
  CO_ST,
  GL_ST,
  ID extends string,
  P extends TApiPluginAny[]
> = (
  inputs: IApiPluginContextualImplementationInputs<any, GL, IN_GL, CO_ST, GL_ST, P>,
) => TPromiseOrDirect<IApiPluginContextualImplementationOutputs<CO>>;*/

export class ApiPlugin<
  EC,
  CO,
  GL,
  IN_GL,
  CO_ST,
  GL_ST,
  ID extends string,
  P extends TApiPluginAny[],
> {
  public pluginId: ID;
  public parentPluginIds: string[] = [];
  public requiresExecutionContext: boolean = false;

  // public availableContexts: IApiPluginExecutionContextProvision[] = [];

  /*public executionContexts: {
    [key in EApiPluginExecutionContext]?: true;
  } = {};*/
  public initializeContextual?: (
    inputs: IApiPluginContextualImplementationInputs<EC, GL, IN_GL, CO_ST, GL_ST, P>,
  ) => TPromiseOrDirect<IApiPluginContextualImplementationOutputs<CO>>;

  public initializeGlobal?: (
    inputs: IApiPluginGlobalImplementationInputs<GL_ST, P>,
  ) => TPromiseOrDirect<IApiPluginGlobalImplementationOutputs<GL, IN_GL>>;

  public globalStateInitializer?: (
    inputs: Omit<IApiPluginGlobalImplementationInputs<any, any>, "store"> & {
      incoming: GL_ST | undefined;
    },
  ) => TPromiseOrDirect<GL_ST>;
  public contextualStateInitializer?: (
    inputs: Omit<
      IApiPluginContextualImplementationInputs<any, any, any, any, any, any>,
      "store"
    > & {
      incoming: CO_ST | undefined;
      isSecure: boolean;
    },
  ) => TPromiseOrDirect<CO_ST>;

  constructor({
    pluginId,
    parentPlugins,
    requiresExecutionContext = false,
  }: {
    pluginId: ID;
    parentPlugins?: P;
    requiresExecutionContext?: boolean;
    /*globalStateInit?: (
      inputs: Omit<IApiPluginGlobalImplementationInputs<any, any>, "store"> & {
        incoming: GL_ST | undefined;
      },
    ) => TPromiseOrDirect<GL_ST>;
    contextualStateInit?: (
      inputs: Omit<IApiPluginContextualImplementationInputs<any, any, any, any, any, any>, "store"> & {
        incoming: CO_ST | undefined;
        isSecure: boolean;
      },
    ) => TPromiseOrDirect<CO_ST>;*/
  }) {
    this.requiresExecutionContext = requiresExecutionContext;
    this.pluginId = pluginId;
    this.parentPluginIds = parentPlugins?.map((p) => p.pluginId) ?? [];
    // this.globalStateInitializer = globalStateInit;
    // this.contextualStateInitializer = contextualStateInit;
  }

  implementGlobalStateInitializer(
    initialize: (
      inputs: Omit<IApiPluginGlobalImplementationInputs<any, any>, "store"> & {
        incoming: GL_ST | undefined;
      },
    ) => TPromiseOrDirect<GL_ST>,
  ) {
    this.globalStateInitializer = initialize;
  }

  implementGlobal<C>(
    initialize: (
      inputs: IApiPluginGlobalImplementationInputs<GL_ST, P>,
    ) => TPromiseOrDirect<IApiPluginGlobalImplementationOutputs<GL, IN_GL>>,
  ) {
    this.initializeGlobal = initialize;
  }

  implementContextualStateInitializer(
    initialize: (
      inputs: Omit<
        IApiPluginContextualImplementationInputs<EC, GL, IN_GL, CO_ST, GL_ST, P>,
        "store"
      > & {
        incoming: CO_ST | undefined;
        isSecure: boolean;
      },
    ) => TPromiseOrDirect<CO_ST>,
  ) {
    this.contextualStateInitializer = initialize as any;
  }

  implementContextual(
    initialize: (
      inputs: IApiPluginContextualImplementationInputs<EC, GL, IN_GL, CO_ST, GL_ST, P>,
    ) => TPromiseOrDirect<IApiPluginContextualImplementationOutputs<CO>>,
  ) {
    this.initializeContextual = initialize;
  }
}
