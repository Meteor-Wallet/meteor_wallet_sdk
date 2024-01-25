function isPositiveNumber(value: string): boolean {
  const numberRegex = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
  return numberRegex.test(value);
}

function isDecimal(value: string): boolean {
  const decimalRegex = /^-?\d+?\.\d+?$/;
  return decimalRegex.test(value);
}

export const StringNumberUtils = {
  isPositiveNumber,
  isDecimal,
};
