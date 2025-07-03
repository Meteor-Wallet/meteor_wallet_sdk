import { TFRFailure, TFRFailureDefaults } from "../TaskFunctionResponses";
import { ETaskFunctionEndId, ITaskFunctionNegativeResponse } from "../TaskFunctionTypes";
import { TaskFunctionError } from "../TaskFunctionUtils";

type TErrorType<I> =
  | ((val?: I) => Partial<ITaskFunctionNegativeResponse<any>>)
  | Partial<ITaskFunctionNegativeResponse<any>>;

export function assertTFR<I = any>(val?: I, error?: TErrorType<I>): asserts val is I {
  if (val != null || (typeof val === "boolean" && val !== false)) {
    return;
  } else {
    if (error) {
      if (typeof error === "function") {
        throw new TaskFunctionError(
          TFRFailureDefaults({
            endId: ETaskFunctionEndId.DATA_VALIDATION_FAILED,
            ...error(val),
          }),
        );
      } else {
        throw new TaskFunctionError(
          TFRFailureDefaults({
            endId: ETaskFunctionEndId.DATA_VALIDATION_FAILED,
            ...error,
          }),
        );
      }
    }

    throw new TaskFunctionError(TFRFailure(ETaskFunctionEndId.DATA_VALIDATION_FAILED));
  }
}
