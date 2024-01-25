import { StringUtils } from "./string.utils";

describe("StringUtils.notNullEmpty function", () => {
  test("returns true for non-empty strings", () => {
    expect(StringUtils.notNullEmpty("hello")).toBe(true);
  });

  test("returns false for null, undefined, and empty strings", () => {
    expect(StringUtils.notNullEmpty(null)).toBe(false);
    expect(StringUtils.notNullEmpty(undefined)).toBe(false);
    expect(StringUtils.notNullEmpty("")).toBe(false);
  });
});

describe("StringUtils.nullEmpty", () => {
  it("should return true for null or undefined", () => {
    expect(StringUtils.nullEmpty(null)).toBe(true);
    expect(StringUtils.nullEmpty(undefined)).toBe(true);
  });

  it("should return true for empty string", () => {
    expect(StringUtils.nullEmpty("")).toBe(true);
  });

  it("should return false for non-empty strings", () => {
    expect(StringUtils.nullEmpty("Hello")).toBe(false);
    expect(StringUtils.nullEmpty(" ")).toBe(false);
    expect(StringUtils.nullEmpty("null")).toBe(false);
    expect(StringUtils.nullEmpty("undefined")).toBe(false);
  });
});

describe("StringUtils.isString function", () => {
  test("returns true for string values", () => {
    expect(StringUtils.isString("hello")).toBe(true);
  });

  test("returns false for non-string values", () => {
    expect(StringUtils.isString(42)).toBe(false);
    expect(StringUtils.isString(null)).toBe(false);
    expect(StringUtils.isString(undefined)).toBe(false);
  });
});
