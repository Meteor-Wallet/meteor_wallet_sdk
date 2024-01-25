import { WaitUtils } from "./wait.utils";

describe("WaitUtils", () => {
  test("waitMillis resolves after the specified milliseconds", async () => {
    jest.useFakeTimers();

    const asyncFunction = async () => {
      await WaitUtils.waitMillis(1000);
      return true;
    };

    const resultPromise = asyncFunction();

    jest.runAllTimers();

    const result = await resultPromise;

    expect(result).toBe(true);

    jest.useRealTimers();
  });

  test("waitSeconds resolves after the specified seconds", async () => {
    jest.useFakeTimers();

    const asyncFunction = async () => {
      await WaitUtils.waitSeconds(1);
      return true;
    };

    const resultPromise = asyncFunction();

    jest.runAllTimers();

    const result = await resultPromise;

    expect(result).toBe(true);

    jest.useRealTimers();
  });

  test("waitMinutes resolves after the specified minutes", async () => {
    jest.useFakeTimers();

    const asyncFunction = async () => {
      await WaitUtils.waitMinutes(1);
      return true;
    };

    const resultPromise = asyncFunction();

    jest.runAllTimers();

    const result = await resultPromise;

    expect(result).toBe(true);

    jest.useRealTimers();
  });
});
