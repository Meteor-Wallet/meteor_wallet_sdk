export const brandActionButtonUnstyled = (colorMode) => {
  const disabledStyle = {
    background: colorMode === "light" ? "gray.200" : "whiteAlpha.200",
    color: colorMode === "light" ? "gray.500" : "white",
  };

  return {
    bg: "brandPrimary.200",
    color: "white",
    _disabled: disabledStyle,
    _hover: {
      bg: "#4721cb",
      _disabled: disabledStyle,
    },
  };
};
