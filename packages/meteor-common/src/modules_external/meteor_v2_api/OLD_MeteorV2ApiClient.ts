import { getAppEnvHelper } from "../../modules_app_core/env/app_env_helper";

export class OLD_MeteorV2ApiClient {
  public static getBaseUrl() {
    return getAppEnvHelper().isDevAppVersion()
      ? // ? `https://dev-api-v2.meteorwallet.app/`
        `https://meteor-v2-analytics-dev.meteorwallet.workers.dev/`
      : `https://api-v2.meteorwallet.app/`;
  }
}
