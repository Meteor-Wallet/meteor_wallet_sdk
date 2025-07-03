import { EnvironmentStateAdapter } from "../../../modules_utility/state_utils/EnvironmentStorageUtils";
import { setupEnvironment } from "../app_adapter";
import { EAppPlatformType } from "../app_platform_types";
import { IBaseDriver } from "./base";

export class ExtensionDriver implements IBaseDriver {
  types = [EAppPlatformType.EXTENSION];

  async initialize() {
    this.setPopupSize();
    setupEnvironment({
      localStorageAdapter: new EnvironmentStateAdapter({
        getString: async (key: string) => (await chrome.storage.local.get())?.[key],
        setString: async (key: string, value: string) =>
          await chrome.storage.local.set({ [key]: value }),
      }),
      sessionAdapter: new EnvironmentStateAdapter({
        getString: async (key: string) => (await chrome.storage.session.get())?.[key],
        setString: async (key: string, value: string) =>
          await chrome.storage.session.set({ [key]: value }),
      }),
    });
  }

  setPopupSize() {
    /*    const htmlElement = document.querySelector("html")!;
    htmlElement.style.width = `${SIGN_POPUP_WIDTH}px`;
    htmlElement.style.height = `${SIGN_POPUP_HEIGHT}px`;

    const bodyElement = document.body;
    bodyElement.style.width = `${SIGN_POPUP_WIDTH}px`;
    bodyElement.style.height = `${SIGN_POPUP_HEIGHT}px`;*/
  }
}
