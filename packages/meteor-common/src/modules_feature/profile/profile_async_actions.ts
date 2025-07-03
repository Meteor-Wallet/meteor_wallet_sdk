import { createAsyncActionWithErrors } from "../../modules_utility/api_utilities/async_action_utils";
import { profile_async_function } from "./profile_async_functions";

export const ProfileAsyncAction = {
  updateProfile: createAsyncActionWithErrors(profile_async_function.updateProfile),
  grantPermission: createAsyncActionWithErrors(profile_async_function.grantPermission),
  readProfile: createAsyncActionWithErrors(profile_async_function.readProfile),
  checkPermission: createAsyncActionWithErrors(profile_async_function.checkPermission),
};
