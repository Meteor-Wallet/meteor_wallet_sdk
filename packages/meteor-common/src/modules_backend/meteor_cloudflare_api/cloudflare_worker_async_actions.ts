import { createAsyncActionWithErrors } from "../../modules_utility/api_utilities/async_action_utils";
import { cloudflare_worker_async_functions } from "./cloudflare_worker_async_functions";

export const cloudflare_worker_async_actions = {
  getSiteMetadata: createAsyncActionWithErrors(cloudflare_worker_async_functions.getSiteMetadata),
};
