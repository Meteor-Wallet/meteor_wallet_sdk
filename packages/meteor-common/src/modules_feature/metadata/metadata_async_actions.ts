import { createAsyncActionWithErrors } from "../../modules_utility/api_utilities/async_action_utils";
import { MetadataCloudflareClient } from "./metadata_cloudflare_client";
import {
  IOGetBlacklistedTokens_Input,
  IOGetBlacklistedTokens_Output,
  IOGetWhitelistedRedirect_Input,
  IOGetWhitelistedRedirect_Output,
} from "./metadata_types";

export const MetadataAsyncActions = {
  getBlacklistedTokens: createAsyncActionWithErrors<IOGetBlacklistedTokens_Input, string[]>(
    getBlacklistedTokens,
  ),
  getWhitelistedRedirect: createAsyncActionWithErrors<IOGetWhitelistedRedirect_Input, string[]>(
    getWhitelistedRedirect,
  ),
};

export async function getBlacklistedTokens(): Promise<IOGetBlacklistedTokens_Output> {
  try {
    const blacklistedTokens = await new MetadataCloudflareClient().getBlacklistedTokens();
    return blacklistedTokens.map((item) => item.contract_id);
  } catch (err) {
    return [];
  }
}

export async function getWhitelistedRedirect(): Promise<IOGetWhitelistedRedirect_Output> {
  const whitelisted = await new MetadataCloudflareClient().getWhitelistedRedirect();
  return whitelisted.map((item) => item.hostname);
}
