import {
  IPollingWaitingPeriod,
  TimeUtils,
} from "../../../../modules_utility/javascript_helpers/TimeUtils";

export const default_transaction_waiting_periods: IPollingWaitingPeriod[] = [
  {
    waitForMillis: TimeUtils.CalculateMillis.secondsInMillis(9),
  },
  {
    fromMillis: TimeUtils.CalculateMillis.secondsInMillis(8.5),
    waitForMillis: TimeUtils.CalculateMillis.secondsInMillis(3),
  },
  {
    fromMillis: TimeUtils.CalculateMillis.secondsInMillis(10.3),
    waitForMillis: TimeUtils.CalculateMillis.secondsInMillis(5),
  },
];
