import { TFRFailure } from "./TaskFunctionResponses";
import {
  ETaskFunctionEndId,
  IFractionFeedback,
  ITaskFunctionNegativeResponse,
  ITaskFunctionPositiveResponse,
  ITaskFunctionResponse,
  ITaskProgressUpdate,
} from "./TaskFunctionTypes";
import {
  _getEndIdForHttpStatusCode,
  _getHttpStatusCodeForEndId,
} from "./helpers/_getHttpStatusCodeForEndId";

export function hasEndTags<TP, TE, ET extends string>(
  response: ITaskFunctionResponse<TP, TE, ET>,
  ...tags: ET[]
): boolean {
  for (const tag of tags) {
    if (response.endTags.indexOf(tag) === -1) {
      return false;
    }
  }

  return true;
}

export function isPositive<TP, TE>(
  response: ITaskFunctionResponse<TP, TE>,
): response is ITaskFunctionPositiveResponse<TP> {
  return response.positive;
}

export function isNegative<TP, TE>(
  response: ITaskFunctionResponse<TP, TE>,
): response is ITaskFunctionNegativeResponse<TE> {
  return !response.positive;
}

export function fractionalFeedback(defaultUnit: string, defaultLimit: number) {
  return (
    current: number,
    limit: number = defaultLimit,
    unit: string = defaultUnit,
  ): IFractionFeedback => ({
    unit,
    current,
    limit,
  });
}

export function convertErrorToTFR(e: Error): ITaskFunctionNegativeResponse<any> {
  let response: ITaskFunctionNegativeResponse<any>;

  if (e instanceof TaskFunctionError) {
    response = e.taskFunctionResponse;
  } else {
    response = TFRFailure(ETaskFunctionEndId.THROWN_ERROR, e.message, e);
  }

  return response;
}

export class TaskFunctionError<EP = any, ET extends string = string> extends Error {
  taskFunctionResponse: ITaskFunctionNegativeResponse<EP, ET>;

  constructor(negativeResponse: Partial<ITaskFunctionNegativeResponse<EP, ET>>) {
    super(negativeResponse.endMessage ?? "Something went wrong");
    /*if (negativeResponse.endMessage) {
      super(negativeResponse.endMessage);
    } else {
      super("Something went wrong.");
    }*/

    this.taskFunctionResponse = {
      ...TFRFailure(ETaskFunctionEndId.ERROR),
      ...negativeResponse,
    } as ITaskFunctionNegativeResponse<EP, ET>;
  }

  errorString(): string {
    return TaskFunctionUtils.printTaskFunctionError(this.taskFunctionResponse);
  }
}

export class EmptyObserver {
  public __isEmptyObserver = true;
  private _hideWarnings: boolean;

  constructor(hideWarnings: boolean = false) {
    this._hideWarnings = hideWarnings;
  }

  hideWarnings(hideWarnings: boolean) {
    this._hideWarnings = hideWarnings;
  }

  complete() {
    if (!this._hideWarnings) {
      console.warn(`Calling empty observer.complete(). Should only be for internal processes.`);
    }
  }

  error(err: any) {
    if (!this._hideWarnings) {
      console.warn(`Calling empty observer.error(). Should only be for internal processes.`);
    }
  }

  next(value: ITaskProgressUpdate) {
    if (!this._hideWarnings) {
      console.warn(
        `Calling empty observer.next(). Should only be for internal processes.\n ProgressUpdate: ${value.status} : ${value.action} : ${value.message}`,
      );
    }
  }
}

export function getPositivePayloadOrThrow<T>(response: ITaskFunctionResponse<T>): T {
  if (response.positive) {
    return response.payload;
  }

  throw new Error(
    `Task Function: getPositiveResponseOrThrow(), did throw: ${response.endId} - ${response.endMessage}`,
  );
}

function printTaskFunctionError(error: ITaskFunctionNegativeResponse<any>): string {
  return `message("${error.endMessage}") endId(${error.endId}) taskId(${
    error.taskId ?? "_"
  }) tags(${error.endTags.join(", ")})`;
}

export const TaskFunctionUtils = {
  getHttpStatusCodeForEndId: _getHttpStatusCodeForEndId,
  getEndIdForHttpStatusCode: _getEndIdForHttpStatusCode,
  getEmptyObserver: (hideWarnings: boolean = false): EmptyObserver =>
    new EmptyObserver(hideWarnings),
  printTaskFunctionError,
};
