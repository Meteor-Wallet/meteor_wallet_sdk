import { EThemeMode } from "../../theme/ThemeStatic";
import { AppStore } from "../app_store/AppStore";

export function createReactionForForcingDarkMode() {
  console.log("createReactionForForcingDarkMode()");

  let unsubThemeReaction = AppStore.createReaction(
    (s) => s.theme.mode,
    (mode, s) => {
      console.log("Changing theme mode", mode);
      s.theme.mode = EThemeMode.dark;
      unsubThemeReaction();
      setTimeout(createReactionForForcingDarkMode, 0);
    },
  );
}
