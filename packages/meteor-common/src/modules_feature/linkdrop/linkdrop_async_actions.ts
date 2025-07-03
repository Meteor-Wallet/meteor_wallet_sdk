import { createAsyncActionWithErrors } from "../../modules_utility/api_utilities/async_action_utils";
import { linkdrop_async_functions } from "./linkdrop_async_functions";

export const linkdrop_async_actions = {
  getDropInformation: createAsyncActionWithErrors(linkdrop_async_functions.getDropInformation),
  getKeyInformation: createAsyncActionWithErrors(linkdrop_async_functions.getKeyInformation),
  createAccountAndClaim: createAsyncActionWithErrors(
    linkdrop_async_functions.createAccountAndClaim,
  ),
  getKeyBalance: createAsyncActionWithErrors(linkdrop_async_functions.getKeyBalance),
  claim: createAsyncActionWithErrors(linkdrop_async_functions.claim),
  getDropNftMetadata: createAsyncActionWithErrors(linkdrop_async_functions.getDropNftMetadata),
};
