import { EThemeMode } from "./ThemeStatic";

export interface IAppTheme_Colors {
  colors: {
    appBackgroundColor: string;
    appDeeperBackgroundColor: string;
    appTextColor: string;
    cardBackgroundColor: string;
    cardBackgroundHoverColor: string;
    cardDeeperBackgroundColor: string;
    buttonPrimaryBackgroundColor: string;
    buttonPrimaryTextColor: string;
    buttonSecondaryBackgroundColor: string;
    buttonSecondaryTextColor: string;
    successColor: string;
    infoColor: string;
    warningColor: string;
    errorColor: string;
    subtleTextColor: string;
    subtleDeeperTextColor: string;
    fontWhite: string;
    textLinkColor: string;
    inputDarkBackground: string;
  };
}

export interface IAppThemeBaseVariables {
  mode: EThemeMode;
}

export interface IAppTheme_CustomCss {
  css: {
    hiddenScrollBar: any;
    thinScrollBar: any;
  };
}
