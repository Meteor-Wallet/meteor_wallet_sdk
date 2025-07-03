import { expect, it } from "bun:test";
import { describe } from "node:test";
import { removeTrailingDecimalZeros } from "./near_formatting_utils";

describe("Remove Decimal Trailing Zeros", () => {
  it("Should be able to remove trailing zeros only from behind decimal point", () => {
    expect(removeTrailingDecimalZeros("123.234000")).toEqual("123.234");
    expect(removeTrailingDecimalZeros("12300")).toEqual("12300");
    expect(removeTrailingDecimalZeros("32000.0000001")).toEqual("32000.0000001");
    expect(removeTrailingDecimalZeros("32000.0000001000")).toEqual("32000.0000001");
    expect(removeTrailingDecimalZeros("32.0")).toEqual("32");
    expect(removeTrailingDecimalZeros("32.10")).toEqual("32.1");
    expect(removeTrailingDecimalZeros("32.")).toEqual("32");
  });
});
