import { Flex, Text } from "@chakra-ui/react";

export interface ICPBgComponent_BackgroundCopyrightText {
  [prop: string]: any;
}

export const BgComponent_BackgroundCopyrightText: React.FC<
  ICPBgComponent_BackgroundCopyrightText
> = () => {
  return (
    <Flex
      zIndex={99}
      padding={10}
      height={"inherit"}
      flexDirection={"column"}
      textAlign={"end"}
      justifyContent={"flex-end"}
      color={"#8A86B7"}
      fontSize={10}
      fontWeight={"300"}
      letterSpacing={0.5}
    >
      <Text>Copyright © 2025 Meteor Lab pte ltd</Text>
      <Text>All Rights Reserved</Text>
    </Flex>
  );
};
