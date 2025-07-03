import { ArrayUtils } from "../../../modules_utility/data_type_utils/ArrayUtils";
import { ECommonStateTaskErrorEndTags } from "./state_tasks.enums";
import { IStateTaskOutput_Failure, TStateTaskOutput } from "./state_tasks.types";

function ensureTagData<T extends string>(tags?: T[] | T): T[] {
  if (tags == null) {
    tags = [];
  }

  if (!ArrayUtils.isArrayLike(tags)) {
    tags = [tags];
  }

  return tags;
}

export function taskFail<T extends string>(tags?: T[] | T): IStateTaskOutput_Failure<T> {
  return {
    success: false,
    tags: Object.fromEntries(ensureTagData(tags).map((tag) => [tag, true])) as {
      [tag in T]?: true;
    },
  };
}

export function taskSuccess<T extends string, P = undefined>(
  result?: P,
  tags?: T[] | T,
): TStateTaskOutput<T, P> {
  if (result == null) {
    return {
      success: true,
      result: result as P,
      tags: Object.fromEntries(ensureTagData(tags).map((tag) => [tag, true])) as {
        [tag in T]?: true;
      },
    };
  } else {
    return {
      result,
      success: true,
      tags: Object.fromEntries(ensureTagData(tags).map((tag) => [tag, true])) as {
        [tag in T]?: true;
      },
    };
  }
}

export function handleSettledPromiseResultLogging_stateTask<
  T extends string = string,
  P = undefined,
>(result: PromiseSettledResult<TStateTaskOutput<T, P>>, contextName?: string) {
  if (result.status === "rejected") {
    console.error(result.reason);
  } else {
    if (!result.value.success) {
      console.error(
        `State Task Failed${
          contextName != null ? ` (${contextName})` : ""
        }: [${Object.keys(result.value.tags).join(", ")}]`,
      );
    }
  }
}

export function handleLogging_stateTask<T extends string = string, P = undefined>(
  output: TStateTaskOutput<T, P>,
  contextName?: string,
) {
  if (!output.success) {
    console.error(
      `State Task Failed${
        contextName != null ? ` (${contextName})` : ""
      }: [${Object.keys(output.tags).join(", ")}]`,
    );
  }
}

export function taskErrorCatcherSync<T extends string = string, P = any>(
  stateTaskRunner: () => TStateTaskOutput<T, P>,
): TStateTaskOutput<T, P> {
  try {
    return stateTaskRunner();
  } catch (e) {
    console.error(e);
    return taskFail(ECommonStateTaskErrorEndTags.unknown_error);
  }
}
