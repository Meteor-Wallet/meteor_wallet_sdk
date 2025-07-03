import { notNullEmpty } from "../../../data_type_utils/StringUtils";
import { TFRFailure, TFRFailureDefaults } from "../TaskFunctionResponses";
import { ETaskFunctionEndId, ITaskFunctionNegativeResponse } from "../TaskFunctionTypes";
import { TaskFunctionError } from "../TaskFunctionUtils";

export async function catchAndThrowTFR<O>(
  getValue: (() => Promise<O>) | Promise<O>,
  error?: ((e) => ITaskFunctionNegativeResponse<any>) | Partial<ITaskFunctionNegativeResponse<any>>,
): Promise<O> {
  try {
    if (typeof getValue === "function") {
      return await getValue();
    } else {
      return await getValue;
    }
  } catch (e: any) {
    if (error) {
      if (typeof error === "function") {
        throw new TaskFunctionError(error(e));
      } else {
        const tfrError = TFRFailureDefaults({
          endId: error?.endId ?? ETaskFunctionEndId.THROWN_ERROR,
          endMessage: notNullEmpty(error.endMessage)
            ? `${error.endMessage}: ${e.message}`
            : e.message,
          errorPayload: error.errorPayload ?? e,
          endTags: error.endTags ?? [],
          taskId: error.taskId,
        });

        throw new TaskFunctionError(tfrError);
      }
    }

    throw new TaskFunctionError(TFRFailure(ETaskFunctionEndId.THROWN_ERROR, e.message, e));
  }
}
