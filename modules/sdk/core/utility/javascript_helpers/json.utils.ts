const isJSON = (str: string) => {
  try {
    JSON.parse(str);
  } catch (err) {
    return false;
  }
  return true;
};

export const JsonUtils = {
  isJSON,
};
