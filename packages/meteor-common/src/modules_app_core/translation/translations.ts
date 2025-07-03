import { translation_en } from "./languages/en";
import { translation_fr } from "./languages/fr";
import { translation_id } from "./languages/id";
import { translation_vi } from "./languages/vi";
import { translation_zh } from "./languages/zh";
import { ELanguage, ITranslations } from "./translation_types";

export const translations: {
  [key in ELanguage]: ITranslations;
} = {
  [ELanguage.en]: translation_en,
  [ELanguage.fr]: translation_fr,
  [ELanguage.id]: translation_id,
  [ELanguage.zh]: translation_zh,
  [ELanguage.vi]: translation_vi,
};
