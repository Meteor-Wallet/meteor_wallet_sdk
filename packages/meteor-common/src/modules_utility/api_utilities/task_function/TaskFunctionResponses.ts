import { emptyObject } from "../../data_type_utils/ObjectUtils";
import {
  ETaskFunctionEndId,
  ITaskFunctionEndLabel,
  ITaskFunctionNegativeResponse,
  ITaskFunctionPositiveResponse,
  ITaskFunctionResponse,
} from "./TaskFunctionTypes";
import { TaskFunctionError } from "./TaskFunctionUtils";
import { _getDefaultErrorMessageForEndId } from "./helpers/_getHttpStatusCodeForEndId";

export const TFR = <TP = any, TE = any>({
  positive = true,
  endId = ETaskFunctionEndId.SUCCESS,
  endMessage = "",
  endTags = [],
  payload = {} as TP,
  errorPayload = null,
  taskId = null,
}: ITaskFunctionResponse = emptyObject): ITaskFunctionResponse => {
  if (positive) {
    return {
      positive,
      endId,
      endMessage,
      endTags,
      payload,
      errorPayload,
      taskId,
    } as ITaskFunctionPositiveResponse<TP>;
  } else {
    return {
      positive,
      endId,
      endMessage,
      endTags,
      payload,
      errorPayload,
      taskId,
    } as ITaskFunctionNegativeResponse<TE>;
  }
};

export const TFRSuccessPayload = <T, ET extends string = string>(
  responseObject: T,
  responseMessage: string = "",
  endTags: ET[] = [] as ET[],
): ITaskFunctionPositiveResponse<T, ET> => ({
  positive: true,
  endId: ETaskFunctionEndId.SUCCESS,
  endMessage: responseMessage,
  endTags,
  payload: responseObject,
  errorPayload: null,
});

export const TFRSuccess = <T, ET extends string = string>(
  responseObject: T = {} as T,
  responseMessage: string = "",
  endTags: ET[] = [] as ET[],
): ITaskFunctionPositiveResponse<T, ET> => {
  return {
    positive: true,
    endId: ETaskFunctionEndId.SUCCESS,
    endMessage: responseMessage,
    endTags,
    payload: responseObject,
    errorPayload: null,
  };
};

export const TFRFailure = <E>(
  errorId: ETaskFunctionEndId,
  reason?: string,
  errorPayload: E = {} as E,
): ITaskFunctionNegativeResponse<E> => {
  return {
    positive: false,
    endId: errorId,
    endMessage: reason ? reason : _getDefaultErrorMessageForEndId(errorId),
    endTags: [],
    payload: null,
    errorPayload,
  };
};

// ! Newer stuff for ending task functions

export interface ITFRSuccessDefaults<P, ET> {
  endMessage?: string;
  endTags?: ET[];
  labels?: ITaskFunctionEndLabel[];
  payload?: P;
  taskId?: string | null;
}

export const TFRSuccessDefaults = <P = any, ET extends string = string>({
  endMessage = "Finished successfully",
  endTags = [] as ET[],
  labels,
  payload = {} as P,
  taskId = null,
}: ITFRSuccessDefaults<P, ET> = {}): ITaskFunctionPositiveResponse<P, ET> => ({
  positive: true,
  errorPayload: null,
  endId: ETaskFunctionEndId.SUCCESS,
  payload,
  endMessage,
  endTags,
  labels,
  taskId,
});

export interface ITFRFailureDefaults<E, ET> {
  endId?: ETaskFunctionEndId;
  endMessage?: string;
  endTags?: ET[];
  labels?: ITaskFunctionEndLabel[];
  errorPayload?: E;
  taskId?: string | null;
}

export const TFRFailureDefaults = <E = any, ET extends string = string>({
  endId = ETaskFunctionEndId.ERROR,
  endMessage,
  endTags = [] as ET[],
  labels,
  errorPayload = {} as E,
  taskId = null,
}: ITFRFailureDefaults<E, ET> = {}): ITaskFunctionNegativeResponse<E, ET> => ({
  positive: false,
  payload: null,
  endId,
  endMessage: endMessage ? endMessage : _getDefaultErrorMessageForEndId(endId),
  endTags,
  labels,
  errorPayload,
  taskId,
});

export function TFRErrorBuilder() {
  const endIds: ETaskFunctionEndId[] = [];
  const tags: string[] = [];
  const labels: ITaskFunctionEndLabel[] = [];
  const messages: (string | undefined)[] = [];

  const hasErrors = () => endIds.length > 0;

  const finalize = () => {
    if (hasErrors()) {
      return TFRFailureDefaults({
        labels: labels.length > 0 ? labels : undefined,
        endTags: tags,
        endId: endIds[0],
        endMessage: messages[0],
      });
    }

    return TFRFailureDefaults();
  };

  return {
    id: (endId: ETaskFunctionEndId, message?: string) => {
      endIds.push(endId);
      messages.push(message);
    },
    tag: (endId: ETaskFunctionEndId, tag: string, message?: string) => {
      endIds.push(endId);
      tags.push(tag);
      messages.push(message);
    },
    label: (endId: ETaskFunctionEndId, label: ITaskFunctionEndLabel, message?: string) => {
      endIds.push(endId);
      tags.push(label.tag);
      labels.push(label);
      messages.push(message);
    },
    hasErrors,
    throwIfErrors: () => {
      if (hasErrors()) {
        throw new TaskFunctionError(finalize());
      }
    },
    finalize,
  };
}
