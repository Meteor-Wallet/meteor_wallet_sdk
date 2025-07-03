export const subtleActionButtonStyle = (colorMode) => {
  const disabledStyle = {
    background: colorMode === "light" ? "gray.200" : "whiteAlpha.200",
    color: colorMode === "light" ? "gray.500" : "white",
  };

  return {
    size: "lg",
    fontSize: "md",
    bg: colorMode === "light" ? "gray.200" : "gray.700",
    color: colorMode === "light" ? "#4e555f" : "gray.200",
    width: "100%",
    padding: "1.4em 0",
    _disabled: disabledStyle,
    _hover: {
      bg: colorMode === "light" ? "gray.300" : "gray.600",
      _disabled: disabledStyle,
    },
  };
};
