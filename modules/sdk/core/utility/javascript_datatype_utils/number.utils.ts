function isNumber(val: unknown): val is number {
  return val !== null && !isNaN(val as number) && val !== undefined;
}

export const NumberUtils = {
  isNumber,
};
