import { TimeUtils } from "../../../core/utility/javascript_helpers/time.utils";
import { IPollingWaitingPeriod } from "../../../core/utility/javascript_helpers/time.interfaces";

export const default_transaction_waiting_periods: IPollingWaitingPeriod[] = [
  {
    waitForMillis: TimeUtils.CalculateMillis.secondsInMillis(1),
  },
  {
    fromMillis: 2000,
    waitForMillis: 350,
  },
  {
    fromMillis: 8000,
    waitForMillis: 1000,
  },
];
