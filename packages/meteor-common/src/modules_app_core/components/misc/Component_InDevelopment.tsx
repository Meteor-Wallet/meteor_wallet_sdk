import { Flex, Text } from "@chakra-ui/react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Component_NavigateBackButton } from "../navigational/Component_NavigateBackButton";

export interface ICPComponent_InDevelopment {
  withoutBackButton?: boolean;
}

export const Component_InDevelopment: React.FC<ICPComponent_InDevelopment> = ({
  withoutBackButton,
}) => {
  const navigate = useNavigate();

  return (
    <Flex grow={1} direction={"column"} alignItems={"center"} justifyContent={"center"} gap={"1em"}>
      {!withoutBackButton && (
        <Component_NavigateBackButton
          size={"lg"}
          aria-label={"go back"}
          // icon={<FiArrowLeft />}
          // onClick={() => {
          //   navigate(-1);
          // }}
        />
      )}
      <Text>In Development</Text>
    </Flex>
  );
};
