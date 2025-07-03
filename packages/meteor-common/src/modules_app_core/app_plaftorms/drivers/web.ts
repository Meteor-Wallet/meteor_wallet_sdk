import { EnvironmentStateAdapter } from "../../../modules_utility/state_utils/EnvironmentStorageUtils";
import { setupEnvironment } from "../app_adapter";
import { EAppPlatformType } from "../app_platform_types";
import { IBaseDriver } from "./base";

export class WebDriver implements IBaseDriver {
  types = [EAppPlatformType.BROWSER_WEB];

  async initialize() {
    console.log("Initializing web");
    setupEnvironment({
      localStorageAdapter: new EnvironmentStateAdapter({
        getString: async (key: string) => window.localStorage.getItem(key),
        setString: async (key: string, value: string) => window.localStorage.setItem(key, value),
      }),
      sessionAdapter: new EnvironmentStateAdapter({
        getString: async (key: string) => window.sessionStorage.getItem(key),
        setString: async (key: string, value: string) => window.sessionStorage.setItem(key, value),
      }),
    });
  }
}
