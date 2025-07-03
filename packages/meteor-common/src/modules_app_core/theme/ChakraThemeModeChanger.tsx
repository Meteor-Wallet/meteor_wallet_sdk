import { useColorMode } from "@chakra-ui/react";
import { useEffect } from "react";
import { AppStore } from "../state/app_store/AppStore";
import { EThemeMode } from "./ThemeStatic";

interface ICPChakraThemeModeChanger {
  mode: EThemeMode;
}

export function ChakraThemeModeChanger({ mode }: ICPChakraThemeModeChanger) {
  const meteorMode = AppStore.useState((s) => s.theme.mode);

  const { colorMode, setColorMode } = useColorMode();

  useEffect(() => {
    if (mode !== colorMode) {
      setColorMode(mode);
    } else if (meteorMode !== colorMode) {
      setColorMode(meteorMode);
    }
  }, [mode, meteorMode, colorMode]);

  return <></>;
}
