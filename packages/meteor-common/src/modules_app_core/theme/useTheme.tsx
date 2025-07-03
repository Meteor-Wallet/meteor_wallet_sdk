import { AppStore } from "../state/app_store/AppStore";
import { customThemeColors } from "./meteor_custom_theme";
import { IAppThemeBaseVariables, IAppTheme_Colors, IAppTheme_CustomCss } from "./theme_types";

export const useTheme = (): IAppTheme_Colors & IAppThemeBaseVariables & IAppTheme_CustomCss => {
  const theme = AppStore.useState((s) => s.theme);
  return {
    css: customCssStyle,
    ...theme,
    ...customThemeColors[theme.mode],
  };
};

const customCssStyle = {
  hiddenScrollBar: {
    "&::-webkit-scrollbar": {
      width: "4px",
    },
    "&::-webkit-scrollbar-track": {
      width: "6px",
    },
    "&::-webkit-scrollbar-thumb": {
      borderRadius: "24px",
    },
  },
  thinScrollBar: {
    "scrollbar-width": "thin",
    "scrollbar-color": "#d6dee1 transparent",
  },
};
