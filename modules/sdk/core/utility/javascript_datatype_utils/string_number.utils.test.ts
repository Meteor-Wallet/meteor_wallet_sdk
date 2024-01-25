import { StringNumberUtils } from "./string_number.utils.ts";
import { describe } from "node:test";

describe("StringNumberUtils", () => {
  // This test is not needed. Floats can also be whole numbers. This would fail on a lot of valid inputs.
  describe("isDecimal", () => {
    test("should return true for decimal strings", () => {
      expect(StringNumberUtils.isDecimal("3.14")).toBe(true);
      expect(StringNumberUtils.isDecimal("-2.718")).toBe(true);
      expect(StringNumberUtils.isDecimal("0.123")).toBe(true);
    });

    test("should return false for non-decimal strings", () => {
      expect(StringNumberUtils.isDecimal("abc")).toBe(false);
      expect(StringNumberUtils.isDecimal("123")).toBe(false);
      expect(StringNumberUtils.isDecimal("3.14abc")).toBe(false);
      expect(StringNumberUtils.isDecimal("1,234")).toBe(false);
    });
  });

  describe("isPositiveNumberOnly", () => {
    test("should return true for integer strings", () => {
      expect(StringNumberUtils.isPositiveNumber("123")).toBe(true);
      expect(StringNumberUtils.isPositiveNumber("456.2222")).toBe(true);
      expect(StringNumberUtils.isPositiveNumber("0")).toBe(true);
    });

    test("should return false for non positive number or not number", () => {
      expect(StringNumberUtils.isPositiveNumber("-456")).toBe(false);
      expect(StringNumberUtils.isPositiveNumber("-0")).toBe(false);
      expect(StringNumberUtils.isPositiveNumber("-456.22")).toBe(false);
      expect(StringNumberUtils.isPositiveNumber("abc")).toBe(false);
      expect(StringNumberUtils.isPositiveNumber("123abc")).toBe(false);
      expect(StringNumberUtils.isPositiveNumber("1,234")).toBe(false);
    });
  });
});
