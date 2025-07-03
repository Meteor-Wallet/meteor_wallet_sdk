import { createStandaloneToast } from "@chakra-ui/react";
import { EThemeMode } from "../theme/ThemeStatic";

const { ToastContainer, toast } = createStandaloneToast({
  theme: {
    mode: EThemeMode.dark,
  },
});
export { ToastContainer, toast };
