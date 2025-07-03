import { AsyncUtils, waitMillis } from "./AsyncUtils";
import { IPollingWaitingPeriod, TimeUtils, calculatePollingToWaitMillis } from "./TimeUtils";

type TRaceResult<T> =
  | {
      finalRejection: boolean;
      rejected: true;
      reason: any;
    }
  | {
      result: T;
      rejected: false;
    };

function raceFirstSuccessOrAllFailed<T>(promises: Promise<T>[]): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const state = { amount: promises.length, resolved: false };

    for (const p of promises) {
      p.then((resp) => {
        console.log("racing promise resolved", resp);
        if (!state.resolved) {
          state.resolved = true;
          resolve(resp);
        }
      }).catch((reason) => {
        console.log("racing promise failed", reason, { ...state });
        if (!state.resolved) {
          state.amount -= 1;

          if (state.amount <= 0) {
            reject(reason);
          }
        }
      });
    }

    /*Promise.race<TRaceResult<T>>(
      promises.map((p) => {
        return p
          .then((resp): TRaceResult<T> => {
            return { rejected: false, result: resp };
          })
          .catch((reason): TRaceResult<T> => {
            state.amount -= 1;

            if (state.amount <= 0) {
              return {
                reason,
                rejected: true,
                finalRejection: true,
              };
            }

            return {
              reason,
              rejected: true,
              finalRejection: false,
            };
          });
      }),
    ).then((finishedResp) => {
      if (finishedResp.rejected) {
        reject(finishedResp.reason);
      } else {
        resolve(finishedResp.result);
      }
    });*/
  });
}

interface IPromiseWithFallbackOptions<T> {
  timeoutMs?: number;
  runFallbackOnError?: boolean;
  errorSpecificFallback?: (reason: any) => Promise<T>;
}

export const promiseWithFallback = <T>(
  asyncTask: () => Promise<T>,
  fallback: () => Promise<T>,
  options: IPromiseWithFallbackOptions<T> = {},
) => {
  const runFallbackOnError = options.runFallbackOnError ?? options.timeoutMs == null;

  const state: {
    initialFinished: boolean;
    initialRunningPromise: Promise<T>;
    fallbackRunningPromise?: Promise<T>;
  } = {
    initialFinished: false,
    initialRunningPromise: asyncTask()
      .catch((reason) => {
        if (state.fallbackRunningPromise != null) {
          return state.fallbackRunningPromise;
        }

        if (runFallbackOnError) {
          state.initialFinished = true;
          state.fallbackRunningPromise = options.errorSpecificFallback?.(reason) ?? fallback();
          return state.fallbackRunningPromise;
        } else {
          throw reason;
        }
      })
      .finally(() => {
        state.initialFinished = true;
      }),
  };

  return Promise.race([
    state.initialRunningPromise,
    ...(options.timeoutMs != null
      ? [
          waitMillis(options.timeoutMs).then(() => {
            if (state.fallbackRunningPromise) {
              return state.fallbackRunningPromise;
            }

            if (!state.initialFinished) {
              state.fallbackRunningPromise = fallback();
              return state.fallbackRunningPromise;
            }

            // initial has finished now- this will just be ignored
            return state.initialRunningPromise;
          }),
        ]
      : []),
  ]);
};

export interface IPromiseTimeoutRetryOptions {
  initialTimeout: number;
  attempts: number;
  errorRetryAttempts?: number;
  backoffMultiplier?: number;
  maximumTimeout?: number;
}

async function timeoutRetryPromise<R>(
  promiseToTry: () => Promise<R>,
  options: IPromiseTimeoutRetryOptions,
) {
  let fallbackPromiseFunc: () => Promise<R> = promiseToTry;
  const backoffMultiplier = options.backoffMultiplier ?? 2;

  const state = {
    errors: 0,
  };

  for (let i = options.attempts - 1; i >= 1; i -= 1) {
    let timeout = (i - 1) * backoffMultiplier * options.initialTimeout;

    if (timeout <= 0) {
      timeout = options.initialTimeout;
    }

    if (options.maximumTimeout != null && timeout > options.maximumTimeout) {
      timeout = options.maximumTimeout;
    }

    const cur = fallbackPromiseFunc;

    fallbackPromiseFunc = () => {
      const startedPromise = promiseToTry();

      return PromiseUtils.promiseWithFallback(() => startedPromise, cur, {
        timeoutMs: timeout,
        runFallbackOnError: options.errorRetryAttempts != null,
        errorSpecificFallback: (reason) => {
          state.errors += 1;

          if (options.errorRetryAttempts != null && state.errors <= options.errorRetryAttempts) {
            return cur();
          } else {
            return startedPromise;
          }
        },
      });
    };
  }

  return fallbackPromiseFunc();
}

export function handleSettledPromiseResultLogging(result: PromiseSettledResult<any>) {
  if (result.status === "rejected") {
    console.error(result.reason);
  }
}

export type THandledPollingResponse<R> = undefined | { stopAndRespond?: R };

export interface IOPollUntilFinished_Inputs<PR, R> {
  pollingFunction: () => Promise<PR>;
  timeoutSeconds: number;
  waitingPeriods: IPollingWaitingPeriod[];
  handleErrorResponse?: (error: Error) => THandledPollingResponse<R>;
  handleResponse: (response: PR) => THandledPollingResponse<R>;
}

async function pollUntilFinished<PollResp = any, RealResp = PollResp>({
  pollingFunction,
  waitingPeriods,
  timeoutSeconds,
  handleResponse,
  handleErrorResponse,
}: IOPollUntilFinished_Inputs<PollResp, RealResp>): Promise<RealResp> {
  const startTimeMillis = Date.now();

  while (true) {
    const currentStartRuntimeMillis = Date.now() - startTimeMillis;
    let handled: THandledPollingResponse<any>;

    try {
      const response = await pollingFunction();
      handled = handleResponse(response);
    } catch (e) {
      if (handleErrorResponse != null) {
        handled = handleErrorResponse(e as Error);
      } else {
        throw e;
      }
    }

    const currentEndRuntimeMillis = Date.now() - startTimeMillis;
    const timeTakenMillis = currentEndRuntimeMillis - currentStartRuntimeMillis;

    if (handled != null && handled.stopAndRespond != null) {
      return handled.stopAndRespond;
    }

    if (currentEndRuntimeMillis >= TimeUtils.CalculateMillis.secondsInMillis(timeoutSeconds)) {
      throw new Error(
        `Timeout (${timeoutSeconds} seconds) while waiting for transaction to be finalized`,
      );
    } else {
      await AsyncUtils.waitMillis(
        Math.max(
          0,
          calculatePollingToWaitMillis({
            currentRuntimeMillis: currentEndRuntimeMillis,
            waitingPeriods,
          }) - timeTakenMillis,
        ),
      );
    }
  }
}

async function promiseWithTimeout<T = any>(
  promiseToRun: () => Promise<T>,
  // millisecond timeout
  timeout: number,
) {
  return new Promise<T>((resolve, reject) => {
    let internalState = {
      isFinished: false,
    };

    const timeoutCallback = setTimeout(() => {
      internalState.isFinished = true;
      reject(new Error("Promise timed out"));
    }, timeout);

    promiseToRun()
      .then((response) => {
        clearTimeout(timeoutCallback);
        if (!internalState.isFinished) {
          resolve(response);
        }
      })
      .catch((reason) => {
        clearTimeout(timeoutCallback);
        if (!internalState.isFinished) {
          reject(reason);
        }
      });
  });
}

export const PromiseUtils = {
  raceFirstSuccessOrAllFailed,
  promiseWithFallback,
  timeoutRetryPromise,
  pollUntilFinished,
  promiseWithTimeout,
};
