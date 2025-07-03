import { appFrontendOnlyCodeCheck, isOnWeb } from "../../modules_utility/env/env_guards";
import { app_env } from "./app_env";
const {
  ENV_API_ACTION_BASE_URL_DEV,
  ENV_API_ACTION_BASE_URL_PROD,
  ENV_BACKEND_API_BASE_URL_DEV,
  ENV_BACKEND_API_BASE_URL_PROD,
  ENV_BACKEND_API_METADATA_URL_DEV,
  ENV_BACKEND_API_METADATA_URL_PROD,
} = app_env;

appFrontendOnlyCodeCheck();

class AppEnvHelper {
  isDevAppVersion(): boolean {
    if (isOnWeb()) {
      const url = new URL(window.location.href);
      if (url.host.includes("release-webapp-pre-prod") || url.host.includes("wallet-pre-prod")) {
        return false;
      }

      return (
        url.host.includes(".meteorwallet.pages.dev") ||
        url.host.startsWith("wallet-dev") ||
        url.host.startsWith("localhost")
      );
    }

    console.warn("Still need to add dev check for mobile app frontend");
    return false;
  }

  getBackendApiBaseUrl(): string {
    return this.isDevAppVersion() ? ENV_BACKEND_API_BASE_URL_DEV : ENV_BACKEND_API_BASE_URL_PROD;
  }

  getBackendApiActionBaseUrl(): string {
    return this.isDevAppVersion() ? ENV_API_ACTION_BASE_URL_DEV : ENV_API_ACTION_BASE_URL_PROD;
  }

  getBackendApiMetadataBaseUrl(): string {
    return this.isDevAppVersion()
      ? ENV_BACKEND_API_METADATA_URL_DEV
      : ENV_BACKEND_API_METADATA_URL_PROD;
  }
}

let helper: { envHelper?: AppEnvHelper } = {};

export function getAppEnvHelper() {
  if (helper.envHelper == null) {
    helper.envHelper = new AppEnvHelper();
  }

  return helper.envHelper;
}
