import { TransactionExecutionPlan } from "./TransactionExecutionPlan";
import { BlockchainTransaction } from "./BlockchainTransaction.ts";
import { BlockchainSignedTransaction } from "./BlockchainSignedTransaction.ts";

export enum EPubSub_TransactionExecutionPlan {
  execution_started = "execution_started",
  execution_completed = "execution_completed",
  execution_stopped = "execution_stopped",
}

export interface IPubSub_TransactionExecutionPlan<
  T extends TransactionExecutionPlan = TransactionExecutionPlan,
> {
  [EPubSub_TransactionExecutionPlan.execution_started]: T;
  [EPubSub_TransactionExecutionPlan.execution_completed]: T;
  [EPubSub_TransactionExecutionPlan.execution_stopped]: T;
}
