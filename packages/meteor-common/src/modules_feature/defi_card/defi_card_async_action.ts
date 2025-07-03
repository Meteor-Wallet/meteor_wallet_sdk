import { createAsyncActionWithErrors } from "../../modules_utility/api_utilities/async_action_utils";
import { defi_card_functions } from "./defi_card_functions";

export const defi_card_async_action = {
  getSignUpRequest: createAsyncActionWithErrors(defi_card_functions.getSignUpRequest),
  signUpPayment: createAsyncActionWithErrors(defi_card_functions.signUpPayment),
  updateSignUpData: createAsyncActionWithErrors(defi_card_functions.updateSignUpData),
  cancelApplication: createAsyncActionWithErrors(defi_card_functions.cancelApplication),
};
