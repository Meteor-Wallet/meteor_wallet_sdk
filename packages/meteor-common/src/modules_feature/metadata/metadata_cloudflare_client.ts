import { getAppEnvHelper } from "../../modules_app_core/env/app_env_helper";
import { FetchHelper } from "../../modules_utility/http_utilities/FetchHelper";
import { IGetBlacklistedTokens_Result, IGetWhitelistedRedirect_Result } from "./metadata_types";

export class MetadataCloudflareClient extends FetchHelper {
  constructor() {
    super();
  }

  getBaseUrl() {
    return getAppEnvHelper().getBackendApiMetadataBaseUrl();
  }

  async getBlacklistedTokens(): Promise<IGetBlacklistedTokens_Result["data"]> {
    return (await this.getJson(`/blacklisted_tokens`)).data;
  }

  async getWhitelistedRedirect(): Promise<IGetWhitelistedRedirect_Result["data"]> {
    return (await this.getJson(`/whitelisted_redirect_hostnames`)).data;
  }
}
