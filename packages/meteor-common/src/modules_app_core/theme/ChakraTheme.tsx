import {
  type ThemeConfig,
  createMultiStyleConfigHelpers,
  defineStyleConfig,
  extendTheme,
} from "@chakra-ui/react";
import "../assets/font/gilroy/stylesheet.css";
import "../assets/font/retrogaming/stylesheet.css";
import { EThemeMode } from "./ThemeStatic";
import { brandActionButtonStyle } from "./chakra-extension/brandActionButtonStyle";
import { brandActionButtonUnstyled } from "./chakra-extension/brandActionButtonUnstyled";
import { subtleActionButtonStyle } from "./chakra-extension/subtleActionButtonStyle";

let chakraTheme: any;

const brandPrimaryColors: any = {
  100: "#8375f8",
  200: "#321fd3",
  300: "#6859ef",
  400: "#653dec",
  500: "#471be8",
  600: "#471be8",
  700: "#471be8",
  800: "#471be8",
  900: "#471be8",
};
const redColors: any = {
  100: "#FED7D7",
  200: "#ff5858",
  300: "#FC8181",
  400: "#F56565",
  500: "#E53E3E",
  600: "#C53030",
  700: "#9B2C2C",
  800: "#822727",
  900: "#63171B",
};
const blueColors: any = {
  100: "#B5AFFF",
  200: "#411EDF",
  300: "#292448",
  400: "#AFFFF5",
  500: "#A6A6A6",
  600: "#8A86B7",
  700: "#00FFE0",
  800: "#2F2D7675",
  900: "#180E35",
};
const greenColors: any = {
  200: "#22C46D",
};

// This function creates a set of function that helps us create multipart component styles.
const helpers = createMultiStyleConfigHelpers(["menu", "item"]);

const Menu = helpers.defineMultiStyleConfig({
  baseStyle: {
    item: {
      fontSize: "1em",
    },
  },
});

const Text = defineStyleConfig({
  variants: {
    secondaryLinkText: ({ colorMode = "dark" }) => ({
      alignSelf: "center",
      color: "gray.500",
      cursor: "pointer",
      fontSize: ".9em",
      _hover: { opacity: 0.8 },
      mt: 2,
    }),
    successWithBackDrop: ({ colorMode = "dark" }) => ({
      bgGradient: "linear(to-r, #22C46D, #1A9F58)",
      bgClip: "text",
      fontSize: "1.5em", // Adjust as needed
      fontWeight: "bold", // Adjust as per design
      textShadow: "0px 0px 15px rgba(34, 196, 109, 0.6)",
    }),
    errorWithBackDrop: ({ colorMode = "dark" }) => ({
      fontSize: "1.5em",
      fontWeight: "bold",
      letterSpacing: ".05em",
      bgGradient: "linear(to-r, #FF0A0A, #B11D1D)",
      bgClip: "text",
      textShadow: "0px 0px 15px rgba(255, 0, 0, 0.6)", // Red shadow with 60% opacity and 15px blur
    }),
  },
});
const Button = defineStyleConfig({
  variants: {
    brandActionInvert: ({ colorMode = "dark" }) => ({
      background: colorMode === "dark" ? "gray.700" : "gray.100",
      color: colorMode === "dark" ? "gray.100" : "gray.900",
      _hover: {
        bg: colorMode === "dark" ? "brandPrimary.300" : "brandPrimary.300",
        color: "gray.50",
      },
      // borderColor: colorMode === "light" ? "black" : "white",
    }),
    brandAction: ({ colorMode = "dark" }) => brandActionButtonStyle(colorMode),
    newBrandAction: ({ isDisabled }) => ({
      borderRadius: "10px",
      maxHeight: "2.5em",
      flex: 1,
      _hover: !isDisabled && {
        opacity: 0.9,
      },
      py: "1.5em",
      bg: "linear-gradient(90deg, #2505CA 0%, #784DE5 100%)",
    }),
    newBrandCancelAction: () => ({
      borderRadius: "10px",
      flex: 1,
      _hover: {
        opacity: 0.9,
      },
      bg: "#2C2C3DFF",
      py: "1.6em",
    }),
    brandActionUnstyled: ({ colorMode = "dark" }) => brandActionButtonUnstyled(colorMode),
    subtleAction: ({ colorMode = "dark" }) => subtleActionButtonStyle(colorMode),
    brandLightAction: ({ colorMode = "dark" }) => ({
      // bg: colorMode === "light" ? "blackAlpha.100" : "whiteAlpha.100",
      bg: "rgba(50, 100, 255, 0.1)",
      color: colorMode === "dark" ? "brandPrimary.100" : "brandPrimary.500",
      _hover: {
        bg: "rgba(50, 100, 255, 0.05)",
      },
      // border: "1px solid rgba(50, 100, 255, 0.25)",
      // borderColor: colorMode === "light" ? "black" : "white",
    }),
    topBarIcon: ({ colorMode = "dark" }) => ({
      // borderRadius: "full",
      bg: "transparent",
      color: colorMode === "light" ? "black" : "white",
      // borderColor: colorMode === "light" ? "black" : "white",
    }),
    keyNavigation: ({ colorMode = "dark" }) => ({
      borderRadius: "full",
      bg: colorMode === "light" ? "blackAlpha.100" : "whiteAlpha.100",
      color: colorMode === "light" ? "black" : "white",
    }),
  },
  // 1. We can update the base styles
  baseStyle: {
    borderRadius: "full",
    fontWeight: 600,
    fontSize: "1em",
  },
});

export function getChakraTheme(defaultMode: EThemeMode) {
  if (chakraTheme != null) {
    return chakraTheme;
  }

  const config: ThemeConfig = {
    initialColorMode: defaultMode,
    useSystemColorMode: false,
  };

  chakraTheme = extendTheme(
    {
      colors: {
        brandPrimary: brandPrimaryColors,
        red: redColors,
        blue: blueColors,
        green: greenColors,
      },
      config,
      textStyles: {
        paragraph: {
          fontWeight: 500,
        },
      },
      fonts: {
        heading: "Gilroy, sans-serif",
        body: "Gilroy, Inter, sans-serif",
        retro: "RetroGaming, sans-serif",
      },
      components: {
        Menu,
        Link: {
          variants: {
            // you can name it whatever you want
            primary: ({ colorScheme = "blue", colorMode = "dark" }) => ({
              color: colorMode === "dark" ? `${colorScheme}.200` : `${colorScheme}.500`,
              _hover: {
                color: `${colorScheme}.400`,
              },
            }),
          },
          defaultProps: {
            // you can name it whatever you want
            variant: "primary",
          },
        },
        Text: {
          baseStyle: ({ colorMode }) => ({
            fontWeight: 500,
            color: colorMode === "dark" ? "white" : "black",
          }),
          ...Text,
        },
        Heading: {
          baseStyle: ({ colorMode }) => ({
            color: colorMode === "dark" ? "white" : "black",
          }),
        },
        CloseButton: {
          variants: {
            keyNavigation: ({ colorMode = "dark" }) => ({
              borderRadius: "full",
              bg: colorMode === "dark" ? "white" : "black",
              color: colorMode === "dark" ? "black" : "white",
            }),
          },
        },
        IconButton: {},
        Button,
        Input: {
          defaultProps: {
            variant: "filled",
          },
          sizes: {
            lg: {
              field: {
                borderRadius: "full",
                fontWeight: 500,
              },
              addon: {
                bg: "white",
              },
            },
            md: {
              field: {
                borderRadius: "full",
                fontWeight: 500,
              },
              addon: {
                bg: "white",
              },
            },
          },
        },
      },
      styles: {
        global: (props) => ({
          // Optionally set global CSS styles
          body: {
            fontWeight: 500,
            fontSize: {
              base: "100%",
              sm: "100%",
              md: "100%",
              lg: "100%",
              // xl: "125%",
            },
          },
        }),
      },
      breakpoints: {
        desktop: "600px",
      },
    },
    /*withDefaultColorScheme({
      colorScheme: "brandPrimary",
      components: ["Button", "Badge"],
    }),*/
  );
  return chakraTheme;
}
