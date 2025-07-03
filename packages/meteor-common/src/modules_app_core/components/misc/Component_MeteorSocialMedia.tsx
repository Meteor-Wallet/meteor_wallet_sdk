import { Flex, Grid, Icon, Text } from "@chakra-ui/react";
import React from "react";
import { FaDiscord, FaTwitter } from "react-icons/fa";
import { useLang } from "../../translation/useLang";

export interface ICPComponent_MeteorSocialMedia {
  [prop: string]: any;
}

export const Component_MeteorSocialMedia: React.FC<ICPComponent_MeteorSocialMedia> = () => {
  const lang = useLang();

  return (
    <Grid
      gridAutoRows={"1fr"}
      gridTemplateColumns={"1fr 1fr"}
      // flexGrow={1}
      width={"100%"}
      gap={"1em"}
      marginTop={"2rem"}
      alignItems={"flex-start"}
    >
      <Flex
        as={"a"}
        href={"https://twitter.com/MeteorWallet"}
        target={"_blank"}
        h={"100%"}
        direction={"column"}
        gap={"0.5em"}
        alignItems={"center"}
        justifyContent={"center"}
        padding={"1.5em"}
        borderRadius={"1em"}
        border="1px"
        _hover={{ bg: "blackAlpha.100", transition: "0.4s all" }}
        borderColor={"blackAlpha.200"}
      >
        <Icon boxSize={"2em"} as={FaTwitter} />
        <Text align={"center"} fontSize={"0.8em"} fontWeight={700}>
          {lang.pageContent.accountSuccess.followUsOnTwitter}
        </Text>
      </Flex>
      <Flex
        as={"a"}
        href={"https://discord.gg/rC8YuzbS4G"}
        target={"_blank"}
        h={"100%"}
        grow={1}
        direction={"column"}
        gap={"0.5em"}
        alignItems={"center"}
        justifyContent={"center"}
        padding={"1em"}
        borderRadius={"1em"}
        border="1px"
        _hover={{ bg: "blackAlpha.100", transition: "0.4s all" }}
        borderColor={"blackAlpha.200"}
      >
        <Icon boxSize={"2em"} as={FaDiscord} />
        <Text align={"center"} fontSize={"0.8em"} fontWeight={700}>
          {lang.pageContent.accountSuccess.joinDiscord}
        </Text>
      </Flex>
    </Grid>
  );
};
