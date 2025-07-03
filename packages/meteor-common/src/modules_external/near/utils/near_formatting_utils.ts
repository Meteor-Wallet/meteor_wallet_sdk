import Big from "big.js";

/**
 * turn 123456789 to 123,456,789
 * @param raw only string consited of 0-9
 * @returns
 */
export const addCommaToNumString = (raw: string) => {
  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 *
 * @param raw only string consited of 0-9
 * @param maxLens
 * @returns
 */
export const parseNumWithUnit = (raw: string, maxLens = 8, addComma = true) => {
  const units = ["", "K", "M", "G", "T", "P", "E", "Z", "Y"];
  const uIndex = Math.max(0, Math.min(Math.floor((raw.length - maxLens) / 3), units.length - 1));
  const unit = units[uIndex];
  const num = Number(raw) / 10 ** (uIndex * 3);
  const numFixedStr = parseFloat(num.toFixed(maxLens)).toString();
  const [head, tail] = numFixedStr.split(".");
  const headStr = addComma ? addCommaToNumString(head) : head;
  let str = "";
  if (head.length >= maxLens || tail === undefined) {
    str = headStr;
  } else if (tail.length + head.length > maxLens) {
    const remain = maxLens - head.length;
    str = `${headStr}.${tail.substring(0, remain)}`;
  } else {
    str = `${headStr}.${tail}`;
  }
  return {
    unit,
    num,
    pureStr: str,
    withUnit: unit ? `${str} ${unit}` : `${str}`,
  };
};

/* From NEAR Wallet */

export const BOATLOAD_OF_GAS = Big(1)
  .times(10 ** 14)
  .toFixed();
const APPROX_ZERO_MIN = 10;

// Convert from readable Near number to YoctoNear
//
// TODO: Shouldn't do 10 ** 24 with JS number, also use big decimal. Might fix precision errors.
export const toYoctoNear = (value: string | number = "0") =>
  Big(value)
    .times(10 ** 24)
    .toFixed();

// Convert from YoctoNear value to readable number
export const fromYoctoNear = (value: string | number = "0", to = 2) =>
  Big(value)
    .div(10 ** 24)
    .toFixed(to === 0 ? undefined : to);

export const formatTokenAmount = (value: string, decimals = 18, precision = 2) =>
  value &&
  Big(value)
    .div(Big(10).pow(decimals))
    .toFixed(precision === -1 ? undefined : precision);

export const parseTokenAmount = (value: string, decimals = 18) =>
  value && Big(value).times(Big(10).pow(decimals)).toFixed();

const trailingDecimalZerosRegex = /^(\d+\.\d*?[1-9])0+$/g;

export const removeTrailingDecimalZeros = (amount: string): string => {
  const matches = [...amount.matchAll(trailingDecimalZerosRegex)].map((m) => m[1]);
  const resp = matches[0] ?? amount;

  if (resp.endsWith(".")) {
    return resp.slice(0, -1);
  }

  if (resp.endsWith(".0")) {
    return resp.slice(0, -2);
  }

  return resp;
};

export const removeTrailingZeros = (amount: string): string => {
  return amount.replace(/\.?0+$/, "");
};

export const calculateTokenUsdPrice = (
  amount: string,
  priceToUsd: string | number,
  decimals: number,
  precision = 2,
): string =>
  Big(removeMinusesFromNumber(amount))
    .div(Big(10).pow(decimals))
    .times(priceToUsd)
    .toFixed(precision);

function removeMinusesFromNumber(num: string): string {
  while (num.startsWith("-")) {
    num = num.slice(1);
  }

  return num;
}
