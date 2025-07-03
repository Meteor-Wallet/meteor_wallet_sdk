// DO NOT REMOVE THIS
import type { WebApp } from "@grammyjs/web-app";
import { ETelegramHapticFeedbackImpactStyle } from "./telegram.enums";
import { ITelegramData } from "./telegram.types";

const getTelegramWebApp = async () => {
  try {
    return await (async () => {
      const module = await import("@grammyjs/web-app");
      return module.WebApp;
    })();
  } catch (error) {
    console.warn("Failed to import TelegramWebApp:", error);
  }
};

async function checkIsTelegramUser(): Promise<boolean> {
  const TelegramWebApp = await getTelegramWebApp();
  if (TelegramWebApp) {
    return TelegramWebApp.platform !== "unknown" && TelegramWebApp.version !== "unknown";
  }
  return false;
}

async function getTelegramUserData(): Promise<ITelegramData | null> {
  const TelegramWebApp = await getTelegramWebApp();
  if (TelegramWebApp) {
    return TelegramWebApp.platform !== "unknown"
      ? {
          version: TelegramWebApp.version,
          platform: TelegramWebApp.platform,
          initData: TelegramWebApp.initDataUnsafe,
          telegramAuthPayload: {
            initDataString: TelegramWebApp.initData,
          },
        }
      : null;
  } else {
    console.warn("getTelegramUserData failed: User is not a Telegram user.");
    return null;
  }
}

async function runFunctionWithTelegramCheck(func: (TelegramWebApp: WebApp) => any) {
  const TelegramWebApp = await getTelegramWebApp();
  if (TelegramWebApp) {
    return func(TelegramWebApp);
  } else {
    console.warn("runFunctionWithTelegramCheck failed: User is not a Telegram user.");
  }
}

function toggleHapticFeedback(style: ETelegramHapticFeedbackImpactStyle) {
  runFunctionWithTelegramCheck((TelegramWebApp) => {
    TelegramWebApp.HapticFeedback.impactOccurred(style);
  });
}

function openTelegramLink(url: string) {
  runFunctionWithTelegramCheck((TelegramWebApp) => {
    TelegramWebApp.openLink(url);
  });
}

function toggleCloseWebApp() {
  runFunctionWithTelegramCheck((TelegramWebApp) => {
    TelegramWebApp.close();
  });
}

function toggleReadyWebApp() {
  runFunctionWithTelegramCheck((TelegramWebApp) => {
    TelegramWebApp.ready();
  });
}

function toggleExpandWebApp() {
  runFunctionWithTelegramCheck((TelegramWebApp) => {
    TelegramWebApp.expand();
  });
}

function setIsBackButtonVisible(isVisible: boolean) {
  runFunctionWithTelegramCheck((TelegramWebApp) => {
    if (isVisible) {
      TelegramWebApp.BackButton.show();
    } else {
      TelegramWebApp.BackButton.hide();
    }
  });
}

function registerBackButtonEvent(eventHandler: () => void) {
  runFunctionWithTelegramCheck((TelegramWebApp) => {
    TelegramWebApp.onEvent("backButtonClicked", eventHandler);
  });
}

function unregisterBackButtonEvent(eventHandler: () => void) {
  runFunctionWithTelegramCheck((TelegramWebApp) => {
    TelegramWebApp.offEvent("backButtonClicked", eventHandler);
  });
}

const getStartParam = async (): Promise<string> => {
  return await runFunctionWithTelegramCheck(async (TelegramWebApp) => {
    const tgWebAppStartParam = TelegramWebApp.initDataUnsafe?.start_param;
    if (tgWebAppStartParam) {
      let startParam = tgWebAppStartParam;
      while (startParam.length % 4 !== 0) {
        startParam += "=";
      }
      // save into localStorage as well
      const allAccountsString = localStorage.getItem("allAccounts");
      const allAccounts: any[] = allAccountsString ? JSON.parse(allAccountsString) : [];

      if (allAccounts.length === 0) {
        localStorage.setItem("tgRefferalStartParam", startParam);
      }
      return startParam;
    }

    // check referrer have inside the localstorage
    let referralLocal = localStorage.getItem("tgRefferalStartParam");
    if (referralLocal) {
      while (referralLocal.length % 4 !== 0) {
        referralLocal += "=";
      }
      return referralLocal;
    }

    return null;
  });
};

export const telegram_utils = {
  checkIsTelegramUser,
  getTelegramUserData,
  toggleHapticFeedback,
  openTelegramLink,
  toggleCloseWebApp,
  toggleReadyWebApp,
  toggleExpandWebApp,
  setIsBackButtonVisible,
  registerBackButtonEvent,
  unregisterBackButtonEvent,
  getStartParam,
};
