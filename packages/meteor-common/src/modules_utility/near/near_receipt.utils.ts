import { ExecutionOutcomeWithId } from "@near-js/types";

// Notes: we are using object here for Failure as near-api-js type of ExecutionError is inaccurate even in latest version (v5)
const isFailedReceipt = (
  executionOutcome: ExecutionOutcomeWithId,
): executionOutcome is ExecutionOutcomeWithId & {
  outcome: { status: { Failure: object } };
} => {
  return (
    typeof executionOutcome.outcome.status == "object" &&
    "Failure" in executionOutcome.outcome.status
  );
};

const isFunctionCallErrorReceipt = (
  executionOutcome: ExecutionOutcomeWithId,
): executionOutcome is ExecutionOutcomeWithId & {
  outcome: {
    status: {
      Failure: {
        ActionError: {
          index: number;
          kind: {
            FunctionCallError: { ExecutionError: string };
          };
        };
      };
    };
  };
} => {
  if (!isFailedReceipt(executionOutcome)) {
    return false;
  }

  const failure = executionOutcome.outcome.status.Failure;

  return (
    typeof failure === "object" &&
    "ActionError" in failure &&
    failure.ActionError != null &&
    typeof failure.ActionError === "object" &&
    "kind" in failure.ActionError &&
    typeof failure.ActionError.kind === "object" &&
    failure.ActionError.kind != null &&
    "FunctionCallError" in failure.ActionError.kind &&
    typeof failure.ActionError.kind.FunctionCallError === "object" &&
    failure.ActionError.kind.FunctionCallError != null &&
    "ExecutionError" in failure.ActionError.kind.FunctionCallError
  );
};

export const near_receipt_utils = {
  isFailedReceipt,
  isFunctionCallErrorReceipt,
};
