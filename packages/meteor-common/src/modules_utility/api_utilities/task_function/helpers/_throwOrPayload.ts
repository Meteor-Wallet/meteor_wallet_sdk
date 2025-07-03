import { ITaskFunctionResponse } from "../TaskFunctionTypes";
import { TaskFunctionError } from "../TaskFunctionUtils";

export function throwOrPayload<TP, TE, ET extends string>(
  response: ITaskFunctionResponse<TP, TE, ET>,
): TP {
  if (!response.positive) {
    throw new TaskFunctionError(response);
  }

  return response.payload;
}
