import { createAsyncActionWithErrors } from "../../modules_utility/api_utilities/async_action_utils";
import { web3auth_async_functions } from "./web3auth_async_functions";

export const web3auth_async_actions = {
  signInAndGetData: createAsyncActionWithErrors(
    web3auth_async_functions.signInAndGetDataWithWeb3Auth,
  ),
};
