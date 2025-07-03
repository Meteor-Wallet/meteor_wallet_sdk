import { Flex } from "@chakra-ui/react";
import React from "react";
import { AppStore } from "../../state/app_store/AppStore";
import { BgComponent_BackgroundBoxFront } from "./components/BgComponent_BackgroundBoxFront";
import { BgComponent_BackgroundCopyrightText } from "./components/BgComponent_BackgroundCopyrightText";
import { BgComponent_BackgroundSvg } from "./components/BgComponent_BackgroundSvg";

export interface ICPComponent_MeteorBackground {
  [prop: string]: any;
}

export const Component_MeteorBackground: React.FC<ICPComponent_MeteorBackground> = () => {
  const [appDriver, windowIsSmall] = AppStore.useState(
    (s) => [s.appDriver, s.deviceInfo.windowIsSmall] as const,
  );

  const [colorMode] = AppStore.useState((s) => [s.theme.mode] as const);

  if (windowIsSmall) {
    return <></>;
  }

  return (
    <Flex
      direction={"column"}
      position={"absolute"}
      w={"100%"}
      h={"100%"}
      zIndex={0}
      style={{
        filter:
          colorMode === "dark" ? "contrast(1.2) brightness(2)" : "contrast(1.2) brightness(1.2)",
      }}
    >
      <BgComponent_BackgroundSvg />
      <BgComponent_BackgroundBoxFront />
      <BgComponent_BackgroundCopyrightText />
    </Flex>
  );
};
