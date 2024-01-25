export interface IPollingWaitingPeriod {
  fromMillis?: number;
  waitForMillis: number;
}

export interface IOCalculatePollingWaiting_Inputs {
  waitingPeriods: IPollingWaitingPeriod[];
  currentRuntimeMillis: number;
}
