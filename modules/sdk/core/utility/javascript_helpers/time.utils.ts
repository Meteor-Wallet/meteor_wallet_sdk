import { IOCalculatePollingWaiting_Inputs } from "./time.interfaces";

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

export const transPico2Date = (pico: number | string) => {
  if (typeof pico === "string") {
    pico = parseFloat(pico);
  }
  const ms = pico / Math.pow(10, 6);
  return new Date(ms);
};

export const TimeUtils = {
  TimePeriodMillis,
  TimePeriodSeconds,
  CalculateMillis,
};
