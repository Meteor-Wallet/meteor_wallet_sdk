import { SingleTransactionExecutor } from "./SingleTransactionExecutor.ts";

export enum EPubSub_SingleTransactionExecutor {
  transaction_sign_started = "transaction_sign_started",
  transaction_sign_completed = "transaction_sign_completed",
  transaction_publish_started = "transaction_publish_started",
  transaction_publish_completed = "transaction_publish_completed",
}

export interface IPubSub_SingleTransactionExecutor<
  T extends SingleTransactionExecutor = SingleTransactionExecutor,
> {
  [EPubSub_SingleTransactionExecutor.transaction_sign_started]: T;
  [EPubSub_SingleTransactionExecutor.transaction_sign_completed]: T;
  [EPubSub_SingleTransactionExecutor.transaction_publish_started]: T;
  [EPubSub_SingleTransactionExecutor.transaction_publish_completed]: T;
}
