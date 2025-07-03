export enum EThemeMode {
  dark = "dark",
  light = "light",
}

interface IThemeStatic {
  gradients: {
    button: {
      regular: {
        [EThemeMode.dark]: string;
        [EThemeMode.light]: string;
      };
      hover: {
        [EThemeMode.dark]: string;
        [EThemeMode.light]: string;
      };
    };
  };
}

export const ThemeStatic: IThemeStatic = {
  gradients: {
    button: {
      regular: {
        [EThemeMode.dark]: "orange.300, red.500, pink.500",
        [EThemeMode.light]: "orange.300, red.300, red.400",
      },
      hover: {
        [EThemeMode.dark]: "orange.200, red.400, pink.300",
        [EThemeMode.light]: "orange.300, red.300, pink.200",
      },
    },
  },
};

type TRgbArray = [string, number, number, number];

export const MeteorThemeColors: {
  primary: TRgbArray;
} = {
  primary: ["71, 27, 232", 71, 27, 232],
};
