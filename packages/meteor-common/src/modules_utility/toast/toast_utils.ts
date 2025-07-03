import { CreateToastFnReturn } from "@chakra-ui/react";

export const toast_utils = {
  error(toast: CreateToastFnReturn, description: string, title: string = "Something went wrong") {
    return toast({
      title: title,
      description: description,
      status: "error",
      duration: 9000,
      isClosable: true,
    });
  },
  success(toast: CreateToastFnReturn, description: string, title: string = "Success") {
    return toast({
      title: title,
      description: description,
      status: "success",
      duration: 9000,
      isClosable: true,
    });
  },
};
