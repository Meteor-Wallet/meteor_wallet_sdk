import { createAsyncActionWithErrors } from "../../modules_utility/api_utilities/async_action_utils";
import { rpc_async_functions } from "./rpc_async_functions";

export const rpc_async_actions = {
  getRpcPing: createAsyncActionWithErrors(rpc_async_functions.getRpcPing),
};
