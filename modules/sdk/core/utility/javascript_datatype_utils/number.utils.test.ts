import { NumberUtils } from "./number.utils";

test("NumberUtils.isNumber", () => {
  expect(NumberUtils.isNumber(null)).toBeFalsy();
  expect(NumberUtils.isNumber(NaN)).toBeFalsy();
  expect(NumberUtils.isNumber(undefined)).toBeFalsy();

  expect(NumberUtils.isNumber(-1)).toBeTruthy();
  expect(NumberUtils.isNumber(0)).toBeTruthy();
  expect(NumberUtils.isNumber(0.1)).toBeTruthy();
  expect(NumberUtils.isNumber(1)).toBeTruthy();
  expect(NumberUtils.isNumber("0")).toBeTruthy();
  expect(NumberUtils.isNumber("")).toBeTruthy();
  expect(NumberUtils.isNumber(" ")).toBeTruthy();
});
