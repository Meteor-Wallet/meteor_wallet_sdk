import { AppStore } from "../state/app_store/AppStore";
import { ITranslations } from "./translation_types";
import { translations } from "./translations";

export const useLang = (): ITranslations => {
  const currentLanguage = AppStore.useState((s) => s.language);
  return translations[currentLanguage];
};
