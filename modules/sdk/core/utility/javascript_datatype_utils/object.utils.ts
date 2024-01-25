function isEmptyObject(obj: object): obj is Record<string, never> {
  return (
    Object.keys(obj).length === 0 &&
    Object.getOwnPropertySymbols(obj).length === 0 &&
    obj.constructor === Object
  );
}

export const ObjectUtils = {
  isEmptyObject,
};
