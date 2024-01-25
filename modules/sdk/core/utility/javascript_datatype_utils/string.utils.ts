const notNullEmpty = (str: string | null | undefined): str is string => {
  return str != null && str.length > 0;
};

const nullEmpty = (str: string | null | undefined): str is null | undefined | "" => {
  return !notNullEmpty(str);
};

function isString(val: unknown): val is string {
  return typeof val === "string";
}

export const StringUtils = {
  nullEmpty,
  notNullEmpty,
  isString,
};
