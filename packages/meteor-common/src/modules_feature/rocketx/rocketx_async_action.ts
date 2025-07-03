import { createAsyncActionWithErrors } from "../../modules_utility/api_utilities/async_action_utils";
import { rocketx_async_functions } from "./rocketx_async_function";

export const rocketx_async_action = {
  getConfigs: createAsyncActionWithErrors(rocketx_async_functions.getConfigs),
  getAllTokensByChainId: createAsyncActionWithErrors(rocketx_async_functions.getAllTokensByChainId),
  getQuotation: createAsyncActionWithErrors(rocketx_async_functions.getQuotation),
  createSwap: createAsyncActionWithErrors(rocketx_async_functions.createSwap),
};
