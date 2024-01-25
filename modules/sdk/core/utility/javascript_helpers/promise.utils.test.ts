import { PromiseUtils } from "./promise.utils";
import { WaitUtils } from "./wait.utils";

describe("PromiseUtils.promiseWithDelayedFallback()", () => {
  it("Should return first promise and not run second if delay not met", async () => {
    const resp = await PromiseUtils.promiseWithFallback<{ tag: string }>(
      async () => {
        await WaitUtils.waitMillis(50);
        return {
          tag: "one",
        };
      },
      async () => {
        await WaitUtils.waitMillis(100);
        return {
          tag: "two",
        };
      },
      {
        timeoutMs: 75,
      },
    );

    expect(resp.tag).toEqual("one");
  });

  it("Should return first promise even though delay was met and second started running", async () => {
    const resp = await PromiseUtils.promiseWithFallback<{ tag: string }>(
      async () => {
        await WaitUtils.waitMillis(50);
        return {
          tag: "one",
        };
      },
      async () => {
        await WaitUtils.waitMillis(100);
        return {
          tag: "two",
        };
      },
      {
        timeoutMs: 10,
      },
    );

    expect(resp.tag).toEqual("one");
  });

  it("Should return second promise and not first if delay met and second finishes first", async () => {
    const resp = await PromiseUtils.promiseWithFallback<{ tag: string }>(
      async () => {
        await WaitUtils.waitMillis(500);
        return {
          tag: "one",
        };
      },
      async () => {
        await WaitUtils.waitMillis(100);
        return {
          tag: "two",
        };
      },
      {
        timeoutMs: 75,
      },
    );

    expect(resp.tag).toEqual("two");
  });

  it("Should run fallback if first promise throws an error", async () => {
    const respOne = await PromiseUtils.promiseWithFallback<{ tag: string }>(
      async () => {
        await WaitUtils.waitMillis(10);
        throw new Error("Something bad");
      },
      async () => {
        await WaitUtils.waitMillis(100);
        return {
          tag: "two",
        };
      },
      {
        runFallbackOnError: true,
      },
    );

    const respTwo = await PromiseUtils.promiseWithFallback<{ tag: string }>(
      async () => {
        await WaitUtils.waitMillis(10);
        throw new Error("Something bad");
      },
      async () => {
        await WaitUtils.waitMillis(100);
        return {
          tag: "two",
        };
      },
    );

    expect(respOne.tag).toEqual("two");
    expect(respTwo.tag).toEqual("two");
  });
});

describe("PromiseUtils.timeoutRetryPromise()", () => {
  it("Should timeout and retry it 3 times, with correct backoff times", async () => {
    const mockFunc = jest.fn();

    const state = {
      timeStart: -1,
    };

    const times: number[] = [];

    await PromiseUtils.timeoutRetryPromise(
      async () => {
        if (state.timeStart <= 0) {
          state.timeStart = Date.now();
        }

        const timePassed = Date.now() - state.timeStart;
        times.push(timePassed);
        mockFunc(timePassed);
        await WaitUtils.waitMillis(200);
        return true;
      },
      {
        initialTimeout: 10,
        attempts: 3,
      },
    );

    expect(mockFunc.mock.calls.length).toEqual(3);
    expect(mockFunc.mock.calls[0][0]).toBeLessThan(10);
    expect(mockFunc.mock.calls[1][0]).toBeGreaterThan(9);
    expect(mockFunc.mock.calls[1][0]).toBeLessThan(30);
    expect(mockFunc.mock.calls[2][0]).toBeGreaterThan(29);
    expect(mockFunc.mock.calls[2][0]).toBeLessThan(60);
  });

  it("Should run 2 times total, after throwing 2 errors (only 1 error attempt allowed)", async () => {
    const mockFunc = jest.fn();

    const state = {
      timeStart: -1,
    };

    const times: number[] = [];

    try {
      await PromiseUtils.timeoutRetryPromise(
        async () => {
          if (state.timeStart <= 0) {
            state.timeStart = Date.now();
          }

          const timePassed = Date.now() - state.timeStart;
          times.push(timePassed);
          mockFunc(timePassed);
          await WaitUtils.waitMillis(10);
          throw new Error("BANG");
          return true;
        },
        {
          initialTimeout: 50,
          attempts: 3,
          errorRetryAttempts: 1,
        },
      );
    } catch (e) {
      expect((e as Error).message).toEqual("BANG");
    }

    console.log(times);

    expect(mockFunc.mock.calls.length).toEqual(2);
    expect(mockFunc.mock.calls[0][0]).toBeLessThan(10);
    expect(mockFunc.mock.calls[1][0]).toBeGreaterThan(9);
    expect(mockFunc.mock.calls[1][0]).toBeLessThan(30);
    // expect(mockFunc.mock.calls[2][0]).toBeGreaterThan(29);
    // expect(mockFunc.mock.calls[2][0]).toBeLessThan(60);
  });

  it("Should never exceed the maximum timeout", async () => {
    const mockFunc = jest.fn();
    const state = {
      timeStart: -1,
    };

    await PromiseUtils.timeoutRetryPromise(
      async () => {
        if (state.timeStart <= 0) {
          state.timeStart = Date.now();
        }

        const timePassed = Date.now() - state.timeStart;
        mockFunc(timePassed);
        await WaitUtils.waitMillis(2000);
        return true;
      },
      {
        initialTimeout: 50,
        backoffMultiplier: 4,
        attempts: 5,
        maximumTimeout: 150,
      },
    );

    expect(mockFunc.mock.calls.length).toEqual(5);
    expect(mockFunc.mock.calls[0][0]).toBeLessThan(10);
    expect(mockFunc.mock.calls[1][0]).toBeGreaterThan(50);
    expect(mockFunc.mock.calls[1][0]).toBeLessThan(100);
    expect(mockFunc.mock.calls[2][0]).toBeGreaterThan(200);
    expect(mockFunc.mock.calls[2][0]).toBeLessThan(250);
    expect(mockFunc.mock.calls[3][0]).toBeGreaterThan(350);
    expect(mockFunc.mock.calls[3][0]).toBeLessThan(400);
    expect(mockFunc.mock.calls[4][0]).toBeGreaterThan(500);
    expect(mockFunc.mock.calls[4][0]).toBeLessThan(550);
  });

  it("Should finish early if the initial run finished while a timeout retry run is still busy", async () => {
    const mockFunc = jest.fn();
    const state = {
      timeStart: -1,
    };

    await PromiseUtils.timeoutRetryPromise(
      async () => {
        if (state.timeStart <= 0) {
          state.timeStart = Date.now();
        }

        const timePassed = Date.now() - state.timeStart;
        mockFunc(timePassed);
        await WaitUtils.waitMillis(155);
        return true;
      },
      {
        initialTimeout: 50,
        backoffMultiplier: 4,
        attempts: 5,
        maximumTimeout: 150,
      },
    );

    expect(mockFunc.mock.calls.length).toEqual(2);
    expect(mockFunc.mock.calls[0][0]).toBeLessThan(10);
    expect(mockFunc.mock.calls[1][0]).toBeGreaterThan(49);
    expect(mockFunc.mock.calls[1][0]).toBeLessThan(100);
  });
});
