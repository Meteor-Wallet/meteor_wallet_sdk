import { EThemeMode } from "./ThemeStatic";

export const ThemeUtil = {
  color: {
    getAppBackgroundColor: (mode: EThemeMode): string => {
      return mode === EThemeMode.light ? "white" : "#12121d";
    },

    // Get background color for component based on theme, usually for Card or Container
    getComponentBackgroundColor: (mode: EThemeMode): string => {
      return mode === EThemeMode.light ? "gray.100" : "gray.800";
    },

    // Get background color for component based on theme, usually for Card or Container
    getComponentBackgroundHoverColor: (mode: EThemeMode): string => {
      return mode === EThemeMode.light ? "gray.200" : "gray.700";
    },

    getComponentBackgroundColor2: (mode: EThemeMode): string => {
      return mode === EThemeMode.light ? "gray.200" : "gray.600";
    },

    getThemeColor: (): string => {
      return "#471be8";
    },

    getFontWhiteColor: (): string => {
      return "whiteAlpha.900";
    },

    getFontBlackColor: (): string => {
      return "gray.900";
    },

    getFontColor: (mode: EThemeMode): string => {
      return mode === EThemeMode.light ? "gray.900" : "whiteAlpha.900";
    },

    getSuccessColor: (): string => {
      return "green.600";
    },

    getSuccessMessageColor: (mode: EThemeMode): string => {
      return mode === EThemeMode.light ? "green.200" : "green.400";
    },

    getInfoMessageColor: (mode: EThemeMode): string => {
      return mode === EThemeMode.light ? "blue.100" : "blue.300";
    },

    getWarningMessageColor: (mode: EThemeMode): string => {
      return mode === EThemeMode.light ? "#ffc45a" : "#d08b34";
    },

    getErrorMessageColor: (mode: EThemeMode): string => {
      return mode === EThemeMode.light ? "red.500" : "red.300";
    },

    getSubtitleFontColor: (): string => {
      return "gray.500";
    },

    getSubtitle2FontColor: (): string => {
      return "gray.400";
    },
  },
};
