import { EThemeMode } from "./ThemeStatic";
import { IAppTheme_Colors } from "./theme_types";

export const customThemeColors: {
  [mode in EThemeMode]: IAppTheme_Colors;
} = {
  [EThemeMode.light]: {
    colors: {
      appBackgroundColor: "white",
      appDeeperBackgroundColor: "gray.50",
      appTextColor: "gray.900",
      cardBackgroundColor: "gray.100",
      cardBackgroundHoverColor: "gray.200",
      cardDeeperBackgroundColor: "gray.200",
      buttonPrimaryBackgroundColor: "#471be8",
      buttonPrimaryTextColor: "whiteAlpha.900",
      buttonSecondaryBackgroundColor: "#d3d9e0",
      buttonSecondaryTextColor: "gray.900",
      successColor: "green.600",
      infoColor: "blue.100",
      warningColor: "#ffc45a",
      errorColor: "red.500",
      subtleTextColor: "gray.500",
      subtleDeeperTextColor: "gray.400",
      fontWhite: "whiteAlpha.800",
      textLinkColor: "blue.600",
      inputDarkBackground: "#0B0B12",
    },
  },
  [EThemeMode.dark]: {
    colors: {
      appBackgroundColor: "#1b202c",
      appDeeperBackgroundColor: "gray.900",
      appTextColor: "whiteAlpha.900",
      cardBackgroundColor: "gray.800",
      cardBackgroundHoverColor: "gray.700",
      cardDeeperBackgroundColor: "gray.600",
      buttonPrimaryBackgroundColor: "#471be8",
      buttonPrimaryTextColor: "whiteAlpha.900",
      buttonSecondaryBackgroundColor: "#3d3d3f",
      buttonSecondaryTextColor: "gray.900",
      successColor: "green.600",
      infoColor: "blue.300",
      warningColor: "#d08b34",
      errorColor: "red.300",
      subtleTextColor: "gray.500",
      subtleDeeperTextColor: "gray.400",
      fontWhite: "whiteAlpha.800",
      textLinkColor: "blue.400",
      inputDarkBackground: "#0B0B12",
    },
  },
};
