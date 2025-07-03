import { createAsyncActionWithErrors } from "../../modules_utility/api_utilities/async_action_utils";
import { onramping_async_functions } from "./onramping_async_function";

export const onramping_async_action = {
  getCountryCode: createAsyncActionWithErrors(onramping_async_functions.getCountryCode),
  getMercuryoSignature: createAsyncActionWithErrors(onramping_async_functions.getMercuryoSignature),
};
