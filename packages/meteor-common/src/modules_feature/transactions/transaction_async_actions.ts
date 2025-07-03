import { createAsyncActionWithErrors } from "../../modules_utility/api_utilities/async_action_utils";
import { transaction_async_functions } from "./transaction_async_functions";

export const transaction_async_actions = {
  signAndSendMultipleTransactionsSync: createAsyncActionWithErrors(
    transaction_async_functions.signAndSendMultipleTransactionsSync,
  ),
};
