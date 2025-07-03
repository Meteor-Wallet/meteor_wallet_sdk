import { createAsyncActionWithErrors } from "../../modules_utility/api_utilities/async_action_utils";
import { wallet_async_function } from "./wallet_async_function";

export const wallet_async_action = {
  createErrorEntry: createAsyncActionWithErrors(wallet_async_function.createErrorEntry),
};
