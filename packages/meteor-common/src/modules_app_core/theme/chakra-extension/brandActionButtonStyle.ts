export const brandActionButtonStyle = (colorMode) => {
  const disabledStyle = {
    background: colorMode === "light" ? "gray.200" : "whiteAlpha.200",
    color: colorMode === "light" ? "gray.500" : "white",
  };

  return {
    size: "lg",
    fontSize: "md",
    bg: "brandPrimary.500",
    color: "white",
    width: "100%",
    padding: "1.4em 0",
    _disabled: disabledStyle,
    _hover: {
      bg: "#4721cb",
      _disabled: disabledStyle,
    },
  };
};
