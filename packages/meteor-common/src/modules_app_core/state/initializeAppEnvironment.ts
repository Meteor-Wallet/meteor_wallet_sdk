import { EAppPlatformType } from "../app_plaftorms/app_platform_types";
import { getDriver } from "../app_plaftorms/drivers/index";
import { AppStore } from "./app_store/AppStore";
import { THEME_SMALL_WINDOW_WIDTH_MAX } from "../theme/constants_theme";
import { EMeteorAnalytics_AppReleaseEnvironment } from "../../modules_utility/analytics/meteor_analytics_enums";
import { app_env } from "../env/app_env";
import { EThemeMode } from "../theme/ThemeStatic";

export async function initializeAppEnvironment() {
  let appDriver = EAppPlatformType.BROWSER_WEB;
  const { ENV_IS_DEV } = app_env;

  if (!getDriver().types.includes(EAppPlatformType.BROWSER_WEB)) {
    appDriver = EAppPlatformType.EXTENSION;
  }

  AppStore.update((s) => {
    s.deviceInfo.windowIsSmall = window.innerWidth < THEME_SMALL_WINDOW_WIDTH_MAX;
  });

  AppStore.update((s) => {
    s.appDriver = appDriver;
    s.isLedgerSupported =
      appDriver === EAppPlatformType.BROWSER_WEB || appDriver === EAppPlatformType.EXTENSION;
  });

  let appRelease: EMeteorAnalytics_AppReleaseEnvironment = ENV_IS_DEV
    ? EMeteorAnalytics_AppReleaseEnvironment.dev_local
    : EMeteorAnalytics_AppReleaseEnvironment.production;

  const hostname = window.location.hostname;

  if (hostname.includes("dev")) {
    appRelease = EMeteorAnalytics_AppReleaseEnvironment.dev_live;
  } else if (hostname.includes("staging")) {
    appRelease = EMeteorAnalytics_AppReleaseEnvironment.staging_live;
  } else if (hostname.startsWith("localhost")) {
    appRelease = EMeteorAnalytics_AppReleaseEnvironment.dev_local;
  }

  AppStore.update((s) => {
    s.appRelease = appRelease;
    s.theme.mode = EThemeMode.dark;
  });
}
