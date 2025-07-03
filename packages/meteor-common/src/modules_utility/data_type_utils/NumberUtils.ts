import * as _ from "lodash";
import { notNullEmpty } from "./StringUtils";

export const notNullZero = (number: unknown): number is number => {
  return number != null && typeof number === "number" && number > 0;
};

export const notNullZeroInteger = (number: number | null) => {
  return _.isInteger(number) && number! > 0;
};

export const nullZero = (number: number | null) => {
  return !notNullZero(number);
};

export const nullZeroInteger = (number: number | null) => {
  return !notNullZeroInteger(number);
};

export interface IOCleanNumberStringInput {
  decimalPlaces?: number;
}

interface IOCleanNumberStringOutput {
  isNaN: boolean;
  num: number;
  str: string;
}

export const cleanNumberString = (
  input: string,
  { decimalPlaces = -1 }: IOCleanNumberStringInput = {},
): IOCleanNumberStringOutput => {
  input = input.replace(",", ".");
  const num = Number(input.replace(",", "."));

  if (Number.isNaN(num)) {
    return {
      isNaN: true,
      num,
      str: "NaN",
    };
  }

  if (num === 0) {
    return {
      str: "0",
      num,
      isNaN: false,
    };
  }

  // clean leading zeros
  input = input.replace(/^[0]+/g, "");

  if (decimalPlaces !== -1) {
    // limit decimal places to set value
    const indexOfPoint = input.indexOf(".");

    if (indexOfPoint !== -1 && indexOfPoint < input.length - (decimalPlaces + 1)) {
      input = input.substring(0, indexOfPoint + (decimalPlaces + 1));
    }
  }

  return {
    str: input,
    num,
    isNaN: false,
  };
};

function roundToDecimal(num: number | string, decimalPlaces: number = 2): number {
  if (typeof num === "string") {
    num = Number(num);
  }

  return Number(num.toFixed(decimalPlaces));
}

function absoluteOrToDecimal(num: number, decimalPlaces: number = 2): string {
  if (num - Math.round(num) !== 0) {
    return num.toFixed(decimalPlaces);
  }

  return `${num}`;
}

function runOnValidNumberText(
  run: (num: number, numStr: string) => void,
  options: IOCleanNumberStringInput = { decimalPlaces: 0 },
): (text: string) => void {
  return (text: string) => {
    const { num, isNaN, str } = NumberUtils.cleanNumberString(text, options);
    if (!isNaN) {
      run(num, str);
    }
  };
}

function toValidNumber<T>(input: unknown, fallback: T): number | T {
  if (input != null) {
    if (typeof input === "number") {
      return input;
    }

    if (typeof input === "string" && notNullEmpty(input)) {
      input = input.replace(",", ".");
      const num = Number((input as string).replace(",", "."));
      if (!Number.isNaN(num)) {
        return num;
      }
    }
  }

  return fallback;
}

function parseNumber(str: string): number {
  const num = Number(str ?? 0);
  if (Number.isNaN(num)) {
    return 0;
  } else {
    return num;
  }
}

export const NumberUtils = {
  notNullZero,
  notNullZeroInteger,
  nullZero,
  nullZeroInteger,
  cleanNumberString,
  absoluteOrToDecimal,
  runOnValidNumberText,
  toValidNumber,
  roundToDecimal,
  parseNumber,
};
