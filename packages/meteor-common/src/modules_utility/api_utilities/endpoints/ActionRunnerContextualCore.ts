import { nanoid } from "nanoid";
import { NumberUtils } from "../../data_type_utils/NumberUtils";
import { TFRFailure } from "../task_function/TaskFunctionResponses";
import {
  ETaskFunctionEndId,
  ITaskFunctionResponse,
  TFRPromise,
} from "../task_function/TaskFunctionTypes";
import { TaskFunctionError, convertErrorToTFR } from "../task_function/TaskFunctionUtils";
import { ApiAction } from "./ApiAction";
import { IApiActionContext } from "./ApiActionTypes";
import {
  IActionRunnerExecutionContext,
  IApiPluginContextualImplementationOutputs,
  TApiPluginAny,
  TContextualDependenciesFromPlugins,
} from "./ApiPluginTypes";
import { ApiRunnerClient } from "./ApiRunnerClient";
import { ApiStateStore } from "./ApiStateStore";

export interface IActionRunnerContextualClientConstruct {
  /** Is this context being run from a secure / internal environment- as opposed to an API endpoint */
  isSecure?: boolean;
  contexts: IActionRunnerExecutionContext[];
  client: ApiRunnerClient;
  label?: string;
  pluginState: {
    [pluginId: string]: any;
  };
}

export interface IExecutionLog {
  actionId: string;
  status: "start";
  pluginId?: string;
  pluginMethod?: string;
}

export interface IExecutionStackEntry {
  // parentOrds: number[];
  // childOrds: number[];
  ord: number;
  type: "action" | "plugin";
  id: string;
  contextId: string;
  method?: string;
  input?: any;
  output?: any;
  outputThrown?: boolean;
  outputOrd?: number;
  timeStart: number;
  timeEnd?: number;
}

export interface IActionContextExecutionContext {
  id?: string;
  // stateOverride?: {
  //   [pluginId: string]: <T>(currentState: T) => void;
  // };
}

export interface IActionSpecificExecutionState {}

interface IOInitializePlugin_Inputs {
  actionContextId?: string;
  checkInputs?: any;
}

export class ActionRunnerContextualCore {
  public pluginExecutionContexts: {
    [key: string]: IActionRunnerExecutionContext;
  } = {};

  private initializedPlugins: {
    [pluginId: string]: IApiPluginContextualImplementationOutputs<any>;
  } = {};
  private client: ApiRunnerClient;

  private busyInitializingPlugins: {
    [pluginId: string]: Promise<IApiPluginContextualImplementationOutputs<any>>;
  } = {};

  private incomingPluginState: {
    [pluginId: string]: any;
  } = {};

  private wrappedPluginMethodsForContext: {
    [actionContextId: string]: {
      [pluginId: string]: { [methodName: string]: (...args: any[]) => any };
    };
  } = {};

  private pluginStores: {
    [pluginId: string]: ApiStateStore<any>;
  } = {};

  private label: string = "";

  private executionOrd: number = 0;
  private executionState: {
    [ord: number]: IExecutionStackEntry;
  } = {};
  private executionStack: {
    [actionContextId: string]: IExecutionStackEntry[];
  } = {};
  private contextUid: string;
  private isSecure: boolean;
  private _currentActionInputs: any;

  constructor(inputs: IActionRunnerContextualClientConstruct) {
    this.client = inputs.client;
    this.incomingPluginState = inputs.pluginState;
    this.label = inputs.label ?? "";
    this.contextUid = nanoid();
    this.isSecure = inputs.isSecure ?? false;

    for (const context of inputs.contexts) {
      this.pluginExecutionContexts[context.pluginId] = context;
    }
  }

  private addToStack(
    actionContextId: string,
    stackEntry: Pick<IExecutionStackEntry, "input" | "method" | "type" | "id">,
  ): { ord: number } {
    const ord = this.executionOrd++;
    this.executionState[ord] = {
      contextId: actionContextId,
      timeStart: Date.now(),
      // parentOrds: stackEntry.parentOrds,
      // childOrds: [],
      ord,
      type: stackEntry.type,
      id: stackEntry.id,
      input: stackEntry.input,
      method: stackEntry.method,
    };

    /*for (const parentOrd of stackEntry.parentOrds) {
      this.executionState[parentOrd].childOrds.push(ord);
    }*/
    if (this.executionStack[actionContextId] == null) {
      this.executionStack[actionContextId] = [];
    }
    this.executionStack[actionContextId].push(this.executionState[ord]);
    return { ord };
  }

  private popStack(
    actionContextId: string,
    {
      wasThrown = false,
      output,
      ord,
      isRootAction = false,
    }: {
      output: any;
      wasThrown?: boolean;
      ord: number;
      isRootAction?: boolean;
    },
  ) {
    // const ord = this.executionStack[actionContextId].pop()!.ord;
    this.executionStack[actionContextId] = this.executionStack[actionContextId].filter(
      (s) => s.ord !== ord,
    );
    this.executionState[ord].output = output;
    this.executionState[ord].outputThrown = wasThrown;
    this.executionState[ord].outputOrd = NumberUtils.toValidNumber(output?.uid, undefined) ?? ord;
    this.executionState[ord].timeEnd = Date.now();
    if (isRootAction) {
      console.log(
        `[${this.contextUid} : ${actionContextId}] Finished [${this.executionState[ord].ord} ${this.executionState[ord].type}:${this.executionState[ord].id}]`,
        Object.values(this.executionState).filter((state) => state.contextId === actionContextId),
      );
    }
  }

  private printStack(actionContextId: string, withInputs: boolean = false) {
    if (this.executionStack[actionContextId].length > 0) {
      const message = `[${
        this.contextUid
      } : ${actionContextId}] Action Stack: ${this.executionStack[actionContextId]
        .map((s) => `[${s.ord} ${s.type}:${s.id}${s.method ? `:${s.method}()` : ""}]`)
        .join(" > ")}`;

      if (withInputs) {
        console.log(
          message,
          this.executionStack[actionContextId][this.executionStack[actionContextId].length - 1]
            .input ?? "",
        );
      } else {
        console.log(message);
      }
    }
  }

  private wrapPluginMethods(
    actionContextId: string,
    plugin: TApiPluginAny,
    methods: { [methodName: string]: (...args: any[]) => any },
  ): { [methodName: string]: (...args: any[]) => any } {
    const returnMethods: {
      [methodName: string]: (...args: any[]) => any;
    } = {};

    for (const methodName of Object.keys(methods)) {
      returnMethods[methodName] = (...args: any[]) => {
        const entry = this.addToStack(actionContextId, {
          type: "plugin",
          id: plugin.pluginId,
          method: methodName,
          input: args[0] ?? undefined,
        });
        this.printStack(actionContextId, true);

        let handled = false;
        const handleError = (e: any) => {
          const errorResponse = convertErrorToTFR(e);
          errorResponse.taskId = plugin.pluginId;
          if (errorResponse.uid == null) {
            errorResponse.uid = `${entry.ord}`;
          }

          if (!handled) {
            this.popStack(actionContextId, {
              output: errorResponse,
              wasThrown: true,
              ord: entry.ord,
            });
            this.printStack(actionContextId);
          }

          handled = true;
          throw e;
        };

        if (methods[methodName].constructor.name === "AsyncFunction") {
          return (async () => {
            try {
              const response = await methods[methodName](...args);

              this.popStack(actionContextId, {
                output: response,
                wasThrown: false,
                ord: entry.ord,
              });
              this.printStack(actionContextId);

              return response;
            } catch (e: any) {
              // console.warn(`Handling ASYNC Function error for plugin "${plugin.pluginId}"`, e);
              if (!e._errorWasLogged && !(e instanceof TaskFunctionError)) {
                console.error(e);
                e._errorWasLogged = true;
              }

              handleError(e);
            }
          })();
        } else {
          try {
            const response = methods[methodName](...args);

            this.popStack(actionContextId, {
              output: response,
              wasThrown: false,
              ord: entry.ord,
            });
            this.printStack(actionContextId);

            return response;
          } catch (e: any) {
            if (!e._errorWasLogged && !(e instanceof TaskFunctionError)) {
              console.error(e);
              e._errorWasLogged = true;
            }
            // console.warn(`Handling regular error for plugin "${plugin.pluginId}"`, e);
            handleError(e);
          }
        }
      };
    }

    return returnMethods;
  }

  public getExecutionState(): {
    [ord: number]: IExecutionStackEntry;
  } {
    return this.executionState;
  }

  public getExecutionStack(): {
    [actionContextId: string]: IExecutionStackEntry[];
  } {
    return this.executionStack;
  }

  public async setPluginState<S>(
    pluginId: string,
    updater: (state: S) => void,
  ): Promise<() => void> {
    const plugin = this.client.registeredPlugins[pluginId];

    if (plugin == null) {
      throw new TaskFunctionError(
        TFRFailure(
          ETaskFunctionEndId.NOT_IMPLEMENTED,
          `API Runner Backend: Trying to set plugin state directly, on plugin with ID "${pluginId}"- but couldn't find it`,
        ),
      );
    } else {
      await this.initializePlugin(plugin, {});
    }

    const previousState = this.pluginStores[pluginId].current;
    this.pluginStores[pluginId].update(updater);

    console.log(`Set Plugin State [${pluginId}]`, this.pluginStores[pluginId].current);

    return () => {
      this.pluginStores[pluginId].replace(previousState);
    };
  }

  public async execute<A extends ApiAction<any, any, any>>(
    action: A,
    args: A extends ApiAction<infer I, any, any> ? I : any,
    actionState?: IActionSpecificExecutionState,
    executionContext?: IActionContextExecutionContext,
  ): TFRPromise<A extends ApiAction<any, infer O, any> ? O : any> {
    console.log(`Executing Action: "${action.actionId}"`);
    this._currentActionInputs = args;

    if (this.client.registeredActions[action.actionId] == null) {
      throw new TaskFunctionError(
        TFRFailure(
          ETaskFunctionEndId.NOT_IMPLEMENTED,
          `API Runner Backend: Action with ID "${action.actionId}" not registered- can't create context`,
        ),
      );
    }

    if (!action.isImplemented) {
      throw new TaskFunctionError(
        TFRFailure(
          ETaskFunctionEndId.NOT_IMPLEMENTED,
          `API Runner Backend: Action with ID "${action.actionId}" has no implementation registered on this backend!`,
        ),
      );
    }

    const pluginsNotFound: string[] = [];

    let actionContextId: string | undefined = executionContext?.id;
    let isRootAction = false;

    if (actionContextId == null) {
      actionContextId = nanoid(6);
      isRootAction = true;

      this.executionStack[actionContextId] = [];
      this.wrappedPluginMethodsForContext[actionContextId] = {};
    }

    const directActionContext: IApiActionContext<any[]> = {
      plugins: {},
      core: {
        execute: (action, args, nextActionState) => {
          return this.execute(action, args, nextActionState, {
            id: actionContextId!,
          });
        },
      },
    };

    let wasThrown: boolean = false;
    let response: ITaskFunctionResponse;

    const entry = this.addToStack(actionContextId, {
      id: action.actionId,
      type: "action",
      input: args,
    });

    for (const pluginId of action.pluginIds) {
      const plugin = this.client.registeredPlugins[pluginId];

      if (plugin == null) {
        pluginsNotFound.push(pluginId);
      } else {
        try {
          directActionContext.plugins[pluginId] = (
            await this.initializePlugin(plugin, {
              actionContextId,
              checkInputs: args,
            })
          ).methods;
        } catch (e: any) {
          if (!e._errorWasLogged && !(e instanceof TaskFunctionError)) {
            console.error(e);
            e._errorWasLogged = true;
          }
          const errorResponse = convertErrorToTFR(e);
          if (errorResponse.uid == null) {
            errorResponse.uid = `${entry.ord}`;
          }

          if (errorResponse.taskId == null) {
            errorResponse.taskId = action.actionId;
          }

          wasThrown = true;
          response = errorResponse;
          break;
        }
      }
    }

    if (pluginsNotFound.length > 0) {
      throw new TaskFunctionError(
        TFRFailure(
          ETaskFunctionEndId.NOT_IMPLEMENTED,
          `API Runner Backend: Action with ID "${
            action.actionId
          }" couldn't find some required plugins: "${pluginsNotFound.join(`", "`)}"`,
        ),
      );
    }

    this.printStack(actionContextId, true);

    if (!wasThrown) {
      console.log(`Running Action: ${action.actionId}`);
      try {
        response = await action.run(args, directActionContext);
      } catch (e: any) {
        if (!e._errorWasLogged && !(e instanceof TaskFunctionError)) {
          console.error(e);
          e._errorWasLogged = true;
        }
        const errorResponse = convertErrorToTFR(e);
        if (errorResponse.uid == null) {
          errorResponse.uid = `${entry.ord}`;
        }
        errorResponse.taskId = action.actionId;
        wasThrown = true;
        response = errorResponse;
      }
    }

    this.popStack(actionContextId, {
      output: response!,
      wasThrown,
      ord: entry.ord,
      isRootAction,
    });
    this.printStack(actionContextId);

    return response!;
  }

  async _initializePlugin(
    plugin: TApiPluginAny,
    options: IOInitializePlugin_Inputs,
  ): Promise<IApiPluginContextualImplementationOutputs<any>> {
    let executionContext: any = {};

    if (plugin.requiresExecutionContext) {
      const context = this.pluginExecutionContexts[plugin.pluginId];
      if (context == null) {
        throw new TaskFunctionError(
          TFRFailure(
            ETaskFunctionEndId.NOT_IMPLEMENTED,
            `API Runner Backend: Plugin with ID "${plugin.pluginId}" requires some execution context to be set up- but it hasn't been created. Pass the required context when creating the ActionRunnerContextualCore()`,
          ),
        );
      }
      executionContext = context.initializer(context.inputs);
    }

    if (this.client.globallyInitializedPlugins[plugin.pluginId] == null) {
      await this.client.initializePluginGlobally(plugin);
    }

    console.log(
      `PLUGIN: Initializing "${
        plugin.pluginId
      }" with parents: [${plugin.parentPluginIds.join(`, `)}]`,
    );

    const plugins: TContextualDependenciesFromPlugins<any[]> = {};
    const parentPluginsNotFound: string[] = [];

    for (const parentPluginId of plugin.parentPluginIds) {
      if (this.initializedPlugins[parentPluginId] != null) {
        plugins[parentPluginId] = this.initializedPlugins[parentPluginId];
      } else {
        const parentPlugin = this.client.registeredPlugins[parentPluginId];
        if (parentPlugin == null) {
          parentPluginsNotFound.push(parentPluginId);
        } else {
          plugins[parentPluginId] = (await this.initializePlugin(parentPlugin, options)).methods;
        }
      }
    }

    if (parentPluginsNotFound.length > 0) {
      throw new TaskFunctionError(
        TFRFailure(
          ETaskFunctionEndId.NOT_IMPLEMENTED,
          `API Runner Backend: Plugin with ID "${
            plugin.pluginId
          }" has some required parent plugins that have not been implemented: "${parentPluginsNotFound.join(
            `", "`,
          )}"`,
        ),
      );
    }

    // const context = { type: executionContext, inputs: this.pluginExecutionContexts[executionContext] };

    const store = new ApiStateStore(
      plugin.contextualStateInitializer != null
        ? await plugin.contextualStateInitializer({
            incoming: this.incomingPluginState[plugin.pluginId],
            context: executionContext,
            global: this.client.globallyInitializedPlugins[plugin.pluginId],
            plugins,
            isSecure: this.isSecure,
          })
        : (this.incomingPluginState[plugin.pluginId] ?? {}),
    );

    this.pluginStores[plugin.pluginId] = store;

    if (plugin.initializeContextual) {
      const pluginInitializeEntry = this.addToStack(options.actionContextId!, {
        id: plugin.pluginId,
        type: "plugin",
        method: "__initialize__",
      });

      try {
        const returnPlugin = await plugin.initializeContextual({
          context: executionContext,
          global: this.client.globallyInitializedPlugins[plugin.pluginId],
          plugins,
          store,
        });

        this.popStack(options.actionContextId!, {
          output: {},
          wasThrown: false,
          ord: pluginInitializeEntry.ord,
        });

        return returnPlugin;
      } catch (e: any) {
        console.error(e);
        const errorResponse = convertErrorToTFR(e);
        if (errorResponse.uid == null) {
          errorResponse.uid = `${pluginInitializeEntry.ord}`;
        }
        errorResponse.taskId = plugin.pluginId;

        this.popStack(options.actionContextId!, {
          output: errorResponse!,
          wasThrown: true,
          ord: pluginInitializeEntry.ord,
        });
        this.printStack(options.actionContextId!);
        throw e;
      }
    } else {
      return { methods: {} };
    }
  }

  async initializePlugin(
    plugin: TApiPluginAny,
    options: IOInitializePlugin_Inputs,
  ): Promise<IApiPluginContextualImplementationOutputs<any>> {
    if (this.busyInitializingPlugins[plugin.pluginId] == null) {
      this.busyInitializingPlugins[plugin.pluginId] = this._initializePlugin(plugin, options);
    }

    const initializedPlugin = await this.busyInitializingPlugins[plugin.pluginId];

    if (initializedPlugin.checkActionInputs != null && options.checkInputs != null) {
      await initializedPlugin.checkActionInputs(options.checkInputs);
    }

    if (options.actionContextId) {
      if (this.wrappedPluginMethodsForContext[options.actionContextId][plugin.pluginId] == null) {
        this.wrappedPluginMethodsForContext[options.actionContextId][plugin.pluginId] =
          this.wrapPluginMethods(options.actionContextId, plugin, {
            ...initializedPlugin.methods,
            ...this.client.globallyInitializedPlugins[plugin.pluginId].methods,
          });
      }

      return {
        methods: this.wrappedPluginMethodsForContext[options.actionContextId][plugin.pluginId],
      };
    }

    return {
      methods: {
        ...initializedPlugin.methods,
        ...this.client.globallyInitializedPlugins[plugin.pluginId].methods,
      },
    };
  }
}
