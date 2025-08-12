import { TPromiseOrDirect } from "../../typescript_utils/special_types";
import { TFRFailure } from "../task_function/TaskFunctionResponses";
import {
  ETaskFunctionEndId,
  ITaskFunctionNegativeResponse,
  TFRPromise,
} from "../task_function/TaskFunctionTypes";
import { TaskFunctionError } from "../task_function/TaskFunctionUtils";
import {
  ActionRunnerContextualCore,
  IActionRunnerContextualClientConstruct,
} from "./ActionRunnerContextualCore";
import { ApiAction } from "./ApiAction";
import { TApiActionAny } from "./ApiActionTypes";
import { ApiPlugin } from "./ApiPlugin";
import { IApiPluginGlobalImplementationOutputs, TApiPluginAny } from "./ApiPluginTypes";
import { ApiStateStore } from "./ApiStateStore";

export interface IOApiRunnerClient_runAction_Input {
  action: TApiActionAny;
  actionInputs: any;
  actionContext?: ActionRunnerContextualCore;
}

interface IApiActionBackendRoute {
  baseUrl: string;
  transformedInputs?: any;
}

interface IOApiActionBackendFilterFunc_Inputs {
  action: Pick<TApiActionAny, "actionId" | "pluginIds">;
  actionInputs: any;
}

interface IOApiPluginSetState_Inputs extends IOApiActionBackendFilterFunc_Inputs {}

type TApiActionBackendFilterFunc = (
  inputs: IOApiActionBackendFilterFunc_Inputs,
) => TPromiseOrDirect<IApiActionBackendRoute>;

interface IApiActionBackendFilterObj {
  actions?: TApiActionAny[];
  route: TApiActionBackendFilterFunc | IApiActionBackendRoute;
}

type TApiActionBackendRoutingFilter = TApiActionBackendFilterFunc | IApiActionBackendFilterObj;

export interface IOApiRunnerClient_runAction_Frontend_Input
  extends Omit<IOApiRunnerClient_runAction_Input, "actionContext"> {
  baseUrl: string;
  pluginState: any;
}

export interface IPluginStateImplementation<P extends TApiPluginAny = TApiPluginAny> {
  plugin: P;
  setState: (
    inputs: IOApiPluginSetState_Inputs,
  ) => P extends ApiPlugin<any, any, any, any, infer S, any, any, any>
    ? TPromiseOrDirect<S>
    : TPromiseOrDirect<any>;
}

export interface IOApiRunnerClient_browserSetup_Input {
  routing: TApiActionBackendRoutingFilter[];
  pluginState?: IPluginStateImplementation[];
  handler: (inputs: IOApiRunnerClient_runAction_Frontend_Input) => TFRPromise;
}

let apiRunnerBackendInstance: ApiRunnerClient | undefined;

export class ApiRunnerClient {
  private isNode: boolean;

  private frontendConnection: IOApiRunnerClient_browserSetup_Input | undefined;

  public registeredPlugins: { [pluginId: string]: TApiPluginAny } = {};
  public registeredActions: { [actionId: string]: TApiActionAny } = {};

  private busyRegisteringPlugins: {
    [pluginId: string]: Promise<
      IApiPluginGlobalImplementationOutputs<any, any> & {
        store: ApiStateStore<any>;
      }
    >;
  } = {};

  public globallyInitializedPlugins: {
    [pluginId: string]: IApiPluginGlobalImplementationOutputs<any, any> & {
      store: ApiStateStore<any>;
    };
  } = {};

  constructor(isServer: boolean) {
    this.isNode = isServer;
  }

  connectFrontend(connection: IOApiRunnerClient_browserSetup_Input) {
    this.frontendConnection = connection;
  }

  registerPlugin(plugin: TApiPluginAny): ApiRunnerClient {
    if (this.registeredPlugins.hasOwnProperty(plugin.pluginId)) {
      throw new Error(
        `API Runner Client: Can't register two plugins with the same ID. Offending ID: "${plugin.pluginId}"`,
      );
    }
    this.registeredPlugins[plugin.pluginId] = plugin;
    return this;
  }

  registerPluginList(list: TApiPluginAny[]): ApiRunnerClient {
    for (const plugin of list) {
      this.registerPlugin(plugin);
    }

    return this;
  }

  registerAction(action: ApiAction<any, any, any[]>): ApiRunnerClient {
    if (this.registeredActions.hasOwnProperty(action.actionId)) {
      throw new Error(
        `API Runner Client: Can't register two actions with the same ID. Offending ID: "${action.actionId}"`,
      );
    }
    this.registeredActions[action.actionId] = action as any;
    return this;
  }

  registerActionGroup(group: { [id: string]: ApiAction<any, any, any[]> }): ApiRunnerClient {
    for (const id in group) {
      this.registerAction(group[id]);
    }
    return this;
  }

  registerActionList(list: ApiAction<any, any, any[]>[]): ApiRunnerClient {
    for (const action of list) {
      this.registerAction(action);
    }
    return this;
  }

  getAction(actionId: string): TApiActionAny {
    if (this.registeredActions[actionId] == null) {
      throw new TaskFunctionError(
        TFRFailure(
          ETaskFunctionEndId.NOT_IMPLEMENTED,
          `API Runner Backend: Action with ID "${actionId}" not registered- can't create context`,
        ),
      );
    }

    return this.registeredActions[actionId];
  }

  private async _initializePluginGlobally(plugin: TApiPluginAny): Promise<
    IApiPluginGlobalImplementationOutputs<any, any> & {
      store: ApiStateStore<any>;
    }
  > {
    const plugins: {
      [pluginId: string]: IApiPluginGlobalImplementationOutputs<any, any>;
    } = {};

    const pluginsNotfound: string[] = [];

    for (const parentPluginId of plugin.parentPluginIds) {
      if (this.registeredPlugins[parentPluginId] == null) {
        pluginsNotfound.push(parentPluginId);
        break;
      } else {
        if (this.globallyInitializedPlugins[parentPluginId] == null) {
          this.busyRegisteringPlugins[parentPluginId] = this.initializePluginGlobally(
            this.registeredPlugins[parentPluginId],
          );

          plugins[parentPluginId] = await this.busyRegisteringPlugins[parentPluginId];
        }
      }
    }

    if (pluginsNotfound.length > 0) {
      throw new TaskFunctionError(
        TFRFailure(
          ETaskFunctionEndId.NOT_IMPLEMENTED,
          `API Runner Backend: Plugin with ID "${
            plugin.pluginId
          }" has some required parent plugins that have not been implemented: "${pluginsNotfound.join(
            `", "`,
          )}"`,
        ),
      );
    }

    const store = new ApiStateStore(
      (await plugin.globalStateInitializer?.({
        incoming: undefined,
        plugins,
      })) ?? {},
    );

    let initialized: IApiPluginGlobalImplementationOutputs<any, any> & {
      store: ApiStateStore<any>;
    };

    if (plugin.initializeGlobal) {
      initialized = (await plugin.initializeGlobal({ store, plugins })) as any;
      initialized.store = store;
    } else {
      initialized = {
        store,
        methods: {},
        internalMethods: {},
      };
    }

    this.globallyInitializedPlugins[plugin.pluginId] = initialized;

    return this.globallyInitializedPlugins[plugin.pluginId];
  }

  async initializePluginGlobally(plugin: TApiPluginAny): Promise<
    IApiPluginGlobalImplementationOutputs<any, any> & {
      store: ApiStateStore<any>;
    }
  > {
    if (this.busyRegisteringPlugins[plugin.pluginId] != null) {
      return this.busyRegisteringPlugins[plugin.pluginId];
    }

    this.busyRegisteringPlugins[plugin.pluginId] = this._initializePluginGlobally(plugin);

    return this.busyRegisteringPlugins[plugin.pluginId];
  }

  initiateContext(inputs: IActionRunnerContextualClientConstruct): ActionRunnerContextualCore {
    return new ActionRunnerContextualCore(inputs);
  }

  async runAction(inputs: IOApiRunnerClient_runAction_Input): TFRPromise {
    if (this.isNode) {
      if (!inputs.actionContext) {
        throw new TaskFunctionError(
          TFRFailure(
            ETaskFunctionEndId.DATA_VALIDATION_FAILED,
            `API Runner Backend: To execute actions in the context of a Node.js page request, "actionContext" needs to be provided`,
          ),
        );
      }

      try {
        const response = await (inputs.actionContext as any).execute(
          this.getAction(inputs.action.actionId),
          inputs.actionInputs,
        );

        if (!response.positive) {
          delete response.errorPayload;
        }

        return response;
      } catch (e: any) {
        console.error(e);
        let response: ITaskFunctionNegativeResponse<any>;

        if (e instanceof TaskFunctionError) {
          response = e.taskFunctionResponse;
        } else {
          response = TFRFailure(ETaskFunctionEndId.THROWN_ERROR, e.message, e);
        }

        // Remove Internal Error Payload so it doesn't propagate to client
        delete response.errorPayload;

        response.taskId = inputs.action.actionId;
        return response;
      }
    }

    if (this.frontendConnection != null) {
      let route: IApiActionBackendRoute | undefined = undefined;

      for (const filter of this.frontendConnection.routing) {
        if (route != null) {
          break;
        }

        if (typeof filter === "function") {
          route = await filter({
            action: inputs.action,
            actionInputs: inputs.actionInputs,
          });
        } else {
          if (
            filter.actions == null ||
            filter.actions.length === 0 ||
            filter.actions.some((a) => a.actionId === inputs.action.actionId)
          ) {
            if (typeof filter.route === "function") {
              route = await filter.route({
                action: inputs.action,
                actionInputs: inputs.actionInputs,
              });
            } else {
              route = filter.route;
            }
          }
        }
      }

      if (route == null) {
        throw new TaskFunctionError(
          TFRFailure(
            ETaskFunctionEndId.NOT_IMPLEMENTED,
            "API Runner: Need to provide a viable route for routing of actions from frontend to backend",
          ),
        );
      }

      let pluginState: any = {};

      for (const plugin of this.frontendConnection.pluginState ?? []) {
        // Only implement the plugin if the action actually implements it
        if (inputs.action.pluginIds.includes(plugin.plugin.pluginId)) {
          pluginState[plugin.plugin.pluginId] = await plugin.setState({
            action: inputs.action,
            actionInputs: inputs.actionInputs,
          });
        }
      }

      return await this.frontendConnection.handler({
        action: inputs.action,
        actionInputs: route.transformedInputs ?? inputs.actionInputs,
        baseUrl: route.baseUrl,
        pluginState,
      });
    } else {
      throw new TaskFunctionError(
        TFRFailure(
          ETaskFunctionEndId.NOT_IMPLEMENTED,
          `API Runner: Need to run frontendConnect() and implement a frontend handler for actions`,
        ),
      );
    }
  }
}

export function initializeApiRunnerClient(isServer: boolean) {
  if (!apiRunnerBackendInstance) {
    apiRunnerBackendInstance = new ApiRunnerClient(isServer);
  } else {
    console.warn(`Trying to initialize the ApiRunnerClient but it is already initialized.`);
  }
}

export function getApiRunnerClient(): ApiRunnerClient {
  if (apiRunnerBackendInstance) {
    return apiRunnerBackendInstance;
  }

  apiRunnerBackendInstance = new ApiRunnerClient(true);
  return apiRunnerBackendInstance;
}
