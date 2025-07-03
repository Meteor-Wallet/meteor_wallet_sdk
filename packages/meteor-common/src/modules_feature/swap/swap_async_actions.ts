import { createAsyncActionWithErrors } from "../../modules_utility/api_utilities/async_action_utils";
import { swap_async_functions } from "./swap_async_functions";

export const swap_async_actions = {
  getRoutesForAccount: createAsyncActionWithErrors(swap_async_functions.getRoutesForAccount),
  buildSwapTransaction: createAsyncActionWithErrors(swap_async_functions.buildSwapTransactions),
};
