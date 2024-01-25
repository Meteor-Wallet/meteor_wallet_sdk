import {
  IOPollUntilFinished_Inputs,
  IPromiseTimeoutRetryOptions,
  IPromiseWithFallbackOptions,
} from "./promise.interfaces";
import { THandledPollingResponse } from "./promise.types";
import { calculatePollingToWaitMillis, TimeUtils } from "./time.utils";
import { WaitUtils } from "./wait.utils";

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
          WaitUtils.waitMillis(options.timeoutMs).then(() => {
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
      await WaitUtils.waitMillis(
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

export const PromiseUtils = {
  promiseWithFallback,
  timeoutRetryPromise,
  pollUntilFinished,
};
