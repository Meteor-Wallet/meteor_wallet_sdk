import { THandledPollingResponse } from "./promise.types";
import { IPollingWaitingPeriod } from "./time.interfaces";

export interface IPromiseWithFallbackOptions<T> {
  timeoutMs?: number;
  runFallbackOnError?: boolean;
  errorSpecificFallback?: (reason: any) => Promise<T>;
}

export interface IOPollUntilFinished_Inputs<PR, R> {
  pollingFunction: () => Promise<PR>;
  timeoutSeconds: number;
  waitingPeriods: IPollingWaitingPeriod[];
  handleErrorResponse?: (error: Error) => THandledPollingResponse<R>;
  handleResponse: (response: PR) => THandledPollingResponse<R>;
}

export interface IPromiseTimeoutRetryOptions {
  initialTimeout: number;
  attempts: number;
  errorRetryAttempts?: number;
  backoffMultiplier?: number;
  maximumTimeout?: number;
}
