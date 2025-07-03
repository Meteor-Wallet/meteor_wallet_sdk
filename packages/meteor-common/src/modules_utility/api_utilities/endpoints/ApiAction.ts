import {
  IOCreateAsyncActionOutput,
  createAsyncAction,
  errorResult,
  successResult,
} from "pullstate";
import { SafeParseError, ZodError, ZodType } from "zod";
import { TFRFailureDefaults } from "../task_function/TaskFunctionResponses";
import {
  ETaskFunctionEndId,
  ITaskFunctionNegativeResponse,
  TFRPromise,
} from "../task_function/TaskFunctionTypes";
import { TaskFunctionError } from "../task_function/TaskFunctionUtils";
import { EEndId_ApiActionCore, IApiActionContext } from "./ApiActionTypes";
import { TApiPluginAny } from "./ApiPluginTypes";
import { getApiRunnerClient } from "./ApiRunnerClient";

export class ApiAction<I, O, P extends TApiPluginAny[]> {
  public actionId: string;
  public pluginIds: string[] = [];
  private createdAsyncAction: IOCreateAsyncActionOutput<I, O> | undefined;
  private implementation:
    | ((inputs: I, actionContext: IApiActionContext<P>) => TFRPromise<O>)
    | undefined;
  private _inputValidation?: ZodType<I>;
  private _outputValidation?: ZodType<O>;

  constructor(actionId: string, plugins: P) {
    this.actionId = actionId;
    this.pluginIds = plugins?.map((p) => p.pluginId) ?? [];
  }

  get isImplemented(): boolean {
    return this.implementation != null;
  }

  run(inputs: I, actionContext: IApiActionContext<P>): TFRPromise<O> {
    if (this.implementation != null) {
      return this.implementation(inputs, actionContext);
    }

    throw new Error(
      `API Action with ID "${this.actionId}" - was ran before it was implemented. Implement it using YourActionName.implement()`,
    );
  }

  get asyncAction(): IOCreateAsyncActionOutput<I, O> {
    return this.createdAsyncAction ?? this.createClientAsyncAction();
  }

  setValidation(inputValidation?: ZodType<I>, outputValidation?: ZodType<O>) {
    this._inputValidation = inputValidation;
    this._outputValidation = outputValidation;
  }

  createClientAsyncAction(): IOCreateAsyncActionOutput<I, O> {
    this.createdAsyncAction = createAsyncAction<I, O>(
      async (args, stores, customContext) => {
        const resp = await getApiRunnerClient().runAction({
          action: this,
          actionInputs: args,
          actionContext: customContext?.actionContext,
        });

        if (resp.positive) {
          return successResult(resp.payload, resp.endTags, resp.endMessage);
        }

        return errorResult(resp.endTags, resp.endMessage, resp.errorPayload);
      },
      {
        actionId: this.actionId,
      },
    );

    return this.createdAsyncAction;
  }

  implement(action: (inputs: I, actionContext: IApiActionContext<P>) => TFRPromise<O>): void {
    this.implementation = async (inputs: I, actionContext: IApiActionContext<P>): TFRPromise<O> => {
      const validatedInputs = this._inputValidation?.safeParse(inputs) ?? {
        data: inputs,
        success: true,
      };

      if (validatedInputs.success) {
        let response = await action(validatedInputs.data, actionContext);

        if (response.positive) {
          const validatedOutputs = this._outputValidation?.safeParse(response.payload) ?? {
            data: response.payload,
            success: true,
          };

          if (validatedOutputs.success) {
            response.payload = validatedOutputs.data;
          } else {
            response = createValidationTaskFunctionError(
              (validatedOutputs as SafeParseError<any>).error as any,
            );
            response.endTags.push(EEndId_ApiActionCore.api_action_output_validation_failed);
          }
        }

        response.taskId = this.actionId;
        return response;
      }

      const errorResponse = createValidationTaskFunctionError(
        (validatedInputs as SafeParseError<any>).error as any,
      );
      errorResponse.endTags.push(EEndId_ApiActionCore.api_action_input_validation_failed);
      errorResponse.taskId = this.actionId;

      throw new TaskFunctionError(errorResponse);
    };
  }
}

function createValidationTaskFunctionError(
  error: ZodError<any>,
): ITaskFunctionNegativeResponse<any> {
  return TFRFailureDefaults({
    endMessage: error.errors
      .map((err) => `( { ${err.path.join(` -> `)} }: ${err.message} )`)
      .join(", "),
    endId: ETaskFunctionEndId.DATA_VALIDATION_FAILED,
    endTags: [],
    errorPayload: error,
  });
}
