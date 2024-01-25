import { IOCalculatePollingWaiting_Inputs } from "./time.interfaces";
import { calculatePollingToWaitMillis } from "./time.utils";

describe("calculatePollingToWaitMillis", () => {
  it("throws an error if waitingPeriods is empty", () => {
    const inputs: IOCalculatePollingWaiting_Inputs = {
      waitingPeriods: [],
      currentRuntimeMillis: 0,
    };

    expect(() => calculatePollingToWaitMillis(inputs)).toThrowError(
      /waitingPeriods can't be empty/,
    );
  });

  it('throws an error if the initial period defines "fromMillis" value', () => {
    const inputs: IOCalculatePollingWaiting_Inputs = {
      waitingPeriods: [
        {
          fromMillis: 0,
          waitForMillis: 1000,
        },
      ],
      currentRuntimeMillis: 0,
    };

    expect(() => calculatePollingToWaitMillis(inputs)).toThrowError(
      /can't calculate definite wait period/,
    );
  });

  it("returns correct wait time based on waitingPeriods and currentRuntimeMillis", () => {
    const inputs: IOCalculatePollingWaiting_Inputs = {
      waitingPeriods: [
        {
          waitForMillis: 1000,
        },
        {
          fromMillis: 1000,
          waitForMillis: 2000,
        },
        {
          fromMillis: 3000,
          waitForMillis: 3000,
        },
      ],
      currentRuntimeMillis: 2500,
    };

    const result = calculatePollingToWaitMillis(inputs);
    expect(result).toBe(2000);
  });
});
