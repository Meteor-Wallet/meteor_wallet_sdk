export const notNullEmpty = (str: string | null | undefined): str is string => {
  return str != null && str.length > 0;
};

export const nullEmpty = (str: string | null | undefined): str is null | undefined | "" => {
  return !notNullEmpty(str);
};
