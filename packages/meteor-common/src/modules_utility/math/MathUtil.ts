import Big from "big.js";
import { fromYoctoNear } from "../../modules_external/near/utils/near_formatting_utils";

export const MathUtil = {
  toFixedRoundDown: (num: number | string, fixed: number): string => {
    if (Number(num) < 0) {
      return "0";
    }
    return new Big(num).round(fixed, Big.roundDown).toFixed();
  },

  fromYoctoNearRoundDown: (yoctoNear: string, decimal: number) => {
    return MathUtil.toFixedRoundDown(fromYoctoNear(yoctoNear, 8), decimal);
  },

  fromYoctoNearToNum: (yoctoNear: string) => {
    return parseFloat(fromYoctoNear(yoctoNear));
  },

  parseAmount: (amount: string, decimals = 18) => {
    return amount && Big(amount).times(Big(10).pow(decimals)).toFixed();
  },

  skipParsingPrefixZero: (rawValue: string, formattedValue: string): string => {
    return Big(formattedValue).eq(0) ? rawValue : formattedValue;
  },

  humanReadableFromBigInt: (balance: string | number, decimals = 18, maxDecimal = 8): string => {
    if (!balance) {
      return "0";
    }

    return new Big(balance)
      .div(new Big(10 ** decimals))
      .round(maxDecimal, Big.roundDown)
      .toFixed();
  },

  toFixedWithoutTrailingZero: (n: number | string, decimal: number): string => {
    try {
      return Big(n).round(decimal, Big.roundDown).toFixed();
    } catch (err) {
      return n.toString();
    }
  },

  toFixedWithoutRounding: (n: string | number, decimal: number): string => {
    const gbZero = "0000000000";
    const subNumber = n.toString().split(".");

    if (subNumber.length === 1) return [subNumber[0], ".", "0000"].join("");

    let result = "";
    if (subNumber[1].length > decimal) {
      result = subNumber[1].substring(0, decimal);
    } else {
      result = subNumber[1] + gbZero.substring(0, decimal - subNumber[1].length);
    }

    if (result === "") {
      return subNumber[0];
    }

    return [subNumber[0], ".", result].join("");
  },

  toPlainString: (n: number): string => {
    return ("" + +n).replace(
      /(-?)(\d*)\.?(\d*)e([+-]\d+)/,
      (a: string, b: string, c: string, d: string, e: string) =>
        e < "0"
          ? b + "0." + Array(1 - Number(e) - c.length).join("0") + c + d
          : b + c + d + Array(Number(e) - d.length + 1).join("0"),
    );
  },

  nanosecondToDays: (nanoseconds: number) => {
    return nanoseconds / 1000000000 / 60 / 60 / 24;
  },

  nanosecondToDate: (nanoseconds: number) => {
    return new Date(nanoseconds / 1000000);
  },

  dateDifference: (
    date1: Date,
    date2: Date,
  ): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } => {
    const msInSecond = 1000;
    const msInMinute = 60 * msInSecond;
    const msInHour = 60 * msInMinute;
    const msInDay = 24 * msInHour;

    // Calculate the difference in milliseconds
    const differenceInMs = date2.getTime() - date1.getTime();

    // Convert to days, hours, minutes, and seconds
    const days = Math.floor(differenceInMs / msInDay);
    const hours = Math.floor((differenceInMs % msInDay) / msInHour);
    const minutes = Math.floor((differenceInMs % msInHour) / msInMinute);
    const seconds = Math.floor((differenceInMs % msInMinute) / msInSecond);

    return { days, hours, minutes, seconds };
  },

  hoursToHoursAndMinutes: (num: number) => {
    const hours = Math.floor(num);
    const minutesTotal = (num - hours) * 60;
    const minutes = Math.floor(minutesTotal);
    const seconds = Math.round((minutesTotal - minutes) * 60); // Use Math.round to round to the nearest second

    return {
      hours,
      minutes,
      seconds,
    };
  },

  hoursToDaysHoursMinutes: (num: number) => {
    const days = Math.floor(num / 24);
    const remainder = num % 24;
    const { hours, minutes } = MathUtil.hoursToHoursAndMinutes(remainder);
    return {
      days,
      hours,
      minutes,
    };
  },

  padZero: (number: number) => {
    if (number.toString().length === 1) {
      return `0${number}`;
    } else {
      return number;
    }
  },

  safeBig: (input: number | string | null | undefined): Big => {
    if (input) {
      try {
        return Big(input);
      } catch (e) {
        console.warn("Failed to parse input as Big", input);
        return Big(0);
      }
    }
    return Big(0);
  },

  /** @deprecated Please use abbreviateNumber instead. */
  abbreviateBigNumber: (input: number | string) => {
    try {
      const num = Big(input);
      const billion = new Big(1_000_000_000);
      const million = new Big(1_000_000);
      const thousand = new Big(1_000);

      if (num.gte(billion)) {
        return num.div(billion).toFixed(1).replace(/\.0$/, "") + "B";
      } else if (num.gte(million)) {
        return num.div(million).toFixed(1).replace(/\.0$/, "") + "M";
      } else if (num.gte(thousand)) {
        return num.div(thousand).toFixed(1).replace(/\.0$/, "") + "k";
      } else {
        return num.toString();
      }
    } catch (e) {
      return input;
    }
  },

  abbreviateNumber: (input: number | string, customSmallAmout?: string) => {
    try {
      const num = Big(input);

      if (num.gte(1_000_000_000)) {
        return `${num.div(1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
      }

      if (num.gte(1_000_000)) {
        return `${num.div(1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
      }

      if (num.gte(1_000)) {
        return `${num.div(1_000).toFixed(1).replace(/\.0$/, "")}k`;
      }

      if (num.gte(0.0001)) {
        return num.toString();
      }

      return customSmallAmout ?? "<0.0001";
    } catch (e) {
      return input;
    }
  },
};
