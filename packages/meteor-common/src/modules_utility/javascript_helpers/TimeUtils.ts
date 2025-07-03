/**
 * Trans picosecond string / number to JS Date
 * @param pico
 * @returns
 */
import { StringUtils } from "../data_type_utils/StringUtils";

export const transPico2Date = (pico: number | string) => {
  if (typeof pico === "string") {
    pico = parseFloat(pico);
  }
  const ms = pico / Math.pow(10, 6);
  return new Date(ms);
};

export const isAnotherMonth = (date1: Date, date2: Date) => {
  return date1.getFullYear() !== date2.getFullYear() || date1.getMonth() !== date2.getMonth();
};

const doubleDigitsPad = StringUtils.createPadder("0", 2);

export function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getMonthDays(month: number, year: number) {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
}

export function createTodayDateString() {
  const today = new Date();
  return `${today.getUTCFullYear()}${doubleDigitsPad(
    today.getUTCMonth() + 1,
  )}${doubleDigitsPad(today.getUTCDate())}`;
}

const TimePeriodMillis = {
  oneSecond: 1000,
  oneMinute: 60000,
  oneHour: 3600000,
  oneDay: 86400000,
};

const TimePeriodSeconds = {
  oneMinute: 60,
  oneHour: 3600,
  oneDay: 86400,
};

const TimePeriodMinutes = {
  oneHour: 60,
  oneDay: 1440,
};

const TimePeriodHours = {
  oneDay: 24,
};

const CalculateMillis = {
  secondsInMillis(seconds: number) {
    return TimePeriodMillis.oneSecond * seconds;
  },
  minutesInMillis(minutes: number) {
    return TimePeriodMillis.oneMinute * minutes;
  },
  hoursInMillis(hours: number) {
    return TimePeriodMillis.oneHour * hours;
  },
  daysInMillis(days: number) {
    return TimePeriodMillis.oneDay * days;
  },
};

const CalculateSeconds = {
  millisInSeconds(millis: number) {
    return millis / TimePeriodMillis.oneSecond;
  },
  minutesInSeconds(minutes: number) {
    return TimePeriodSeconds.oneMinute * minutes;
  },
  hoursInSeconds(hours: number) {
    return TimePeriodSeconds.oneHour * hours;
  },
  daysInSeconds(days: number) {
    return TimePeriodSeconds.oneDay * days;
  },
};

const CalculateMinutes = {
  millisInMinutes(millis: number) {
    return millis / TimePeriodMillis.oneMinute;
  },
  secondsInMinutes(seconds: number) {
    return seconds / TimePeriodSeconds.oneMinute;
  },
  hoursInMinutes(hours: number) {
    return hours * 60;
  },
  daysInMinutes(days: number) {
    return this.hoursInMinutes(24) * days;
  },
};

const CalculateHours = {
  /*millisInHours(millis: number) {
    return (millis / TimePeriodMillis.oneMinute);
  },
  secondsInHours(seconds: number) {
    return (seconds / TimePeriodSeconds.oneMinute);
  },*/
  minutesInHours(minutes: number) {
    return minutes / TimePeriodMinutes.oneHour;
  },
};

const CalculateDays = {
  hoursInDays(hours: number) {
    return hours / TimePeriodHours.oneDay;
  },
};

function getPracticalTimeString(value: number, unit: ETimeUnit): string {
  const allValues = getTimeValues(value, unit);

  const vals: IDisplayUnit[] = [];

  for (const orderAndUnits of timeUnitOrderAndUnits) {
    const val = allValues[orderAndUnits.unit];

    if (val != null) {
      vals.push({
        val,
        unit: orderAndUnits.fullUnit,
        pluralize: true,
      });
    }
  }

  return displayValues({ vals, pluralize: true, ignoreZeros: true });
}

export enum ETimeUnit {
  days = "d",
  hours = "h",
  minutes = "m",
  seconds = "s",
  milliseconds = "ms",
}

const timeUnitOrderAndUnits: { fullUnit: string; unit: ETimeUnit }[] = [
  { fullUnit: "day", unit: ETimeUnit.days },
  { fullUnit: "hour", unit: ETimeUnit.hours },
  { fullUnit: "minute", unit: ETimeUnit.minutes },
  { fullUnit: "second", unit: ETimeUnit.seconds },
  { fullUnit: "millisecond", unit: ETimeUnit.milliseconds },
];

const timeUnitInfo: {
  [key: string]: { max: number; next: ETimeUnit };
} = {
  [ETimeUnit.milliseconds]: { max: 1000, next: ETimeUnit.seconds },
  [ETimeUnit.seconds]: { max: 60, next: ETimeUnit.minutes },
  [ETimeUnit.minutes]: { max: 60, next: ETimeUnit.hours },
  [ETimeUnit.hours]: { max: 24, next: ETimeUnit.days },
  [ETimeUnit.days]: { max: -1, next: ETimeUnit.days },
};

interface IOGetTimeValuesOutput {
  [ETimeUnit.days]?: number;
  [ETimeUnit.hours]?: number;
  [ETimeUnit.minutes]?: number;
  [ETimeUnit.seconds]?: number;
  [ETimeUnit.milliseconds]?: number;
}

function getTimeValues(
  value: number,
  unit: ETimeUnit,
  cur?: IOGetTimeValuesOutput,
): IOGetTimeValuesOutput {
  if (cur == null) {
    cur = {};
  }

  const maxVal = timeUnitInfo[unit].max;

  if (maxVal > 0) {
    if (value >= maxVal) {
      const higherUnitVal = Math.floor(value / maxVal);
      cur = getTimeValues(higherUnitVal, timeUnitInfo[unit].next, cur);
    }

    cur[unit] = value % maxVal;
  } else {
    cur[unit] = value;
  }

  return cur;
}

interface IDisplayUnit {
  val: number;
  unit: string;
  pluralize?: boolean;
  ignoreZeros?: boolean;
}

interface IODisplayValuesInput {
  vals: IDisplayUnit[];
  ignoreZeros?: boolean;
  pluralize?: boolean;
}

function displayValues({
  vals,
  ignoreZeros: ignoreZerosOuter = true,
  pluralize: pluralizeOuter = true,
}: IODisplayValuesInput) {
  return vals
    .reduce((str, { val, unit, pluralize = pluralizeOuter, ignoreZeros = ignoreZerosOuter }) => {
      if (!ignoreZeros || val > 0) {
        if (val > 1 && pluralize) {
          str = `${str} ${val.toFixed(0)} ${unit}s`;
        } else {
          str = `${str} ${val.toFixed(0)} ${unit}`;
        }
      }
      return str;
    }, "")
    .trim();
}

function differenceMillis(timeOne: number | Date, timeTwo: number | Date): number {
  /*let a: number;

  if (typeof timeOne === "object") {
    timeOne.getTime();
  } else {
    a = timeOne;
  }

  let b: number;
  */

  return (
    (typeof timeTwo === "object" ? timeTwo.getTime() : timeTwo) -
    (typeof timeOne === "object" ? timeOne.getTime() : timeOne)
  );
}

export interface IPollingWaitingPeriod {
  fromMillis?: number;
  waitForMillis: number;
}

export interface IOCalculatePollingWaiting_Inputs {
  waitingPeriods: IPollingWaitingPeriod[];
  currentRuntimeMillis: number;
}

export function calculatePollingToWaitMillis({
  waitingPeriods,
  currentRuntimeMillis,
}: IOCalculatePollingWaiting_Inputs): number {
  if (waitingPeriods.length === 0) {
    throw new Error(`calculatePollingToWaitMillis(): waitingPeriods can't be empty`);
  }

  if (waitingPeriods[0].fromMillis != null) {
    throw new Error(
      `calculatePollingToWaitMillis(): can't calculate definite wait period if the initial period defines the "fromMillis" value`,
    );
  }

  const [firstPeriod, ...remainingPeriods] = waitingPeriods;

  // Reverse the periods so that we can start from the end, and
  // find the highest fromMillis that is lower than the current runtime millis
  for (const period of remainingPeriods.reverse()) {
    if (period.fromMillis != null) {
      if (period.fromMillis <= currentRuntimeMillis) {
        return period.waitForMillis;
      }
    } else {
      return period.waitForMillis;
    }
  }

  return firstPeriod.waitForMillis;
}

export const TimeUtils = {
  differenceMillis,
  TimePeriodMillis,
  TimePeriodSeconds,
  CalculateMillis,
  CalculateSeconds,
  CalculateMinutes,
  createTodayDateString,
  isLeapYear,
  getMonthDays,
  getPracticalTimeString,
};
