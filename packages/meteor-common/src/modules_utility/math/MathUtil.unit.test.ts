import { describe, expect, test } from "bun:test";
import { MathUtil } from "./MathUtil";

describe("MathUtil", () => {
  describe("toFixedRoundDown()", () => {
    test("Number > 1", () => {
      expect(MathUtil.toFixedRoundDown("12.34567890", 4)).toEqual("12.3456");
      expect(MathUtil.toFixedRoundDown("12.345678901234567890", 6)).toEqual("12.345678");
      expect(MathUtil.toFixedRoundDown("12.345678901234567890", 4)).toEqual("12.3456");
      expect(MathUtil.toFixedRoundDown("12.345678901234567890", 2)).toEqual("12.34");
      expect(MathUtil.toFixedRoundDown("12.345678901234567890", 0)).toEqual("12");
      expect(MathUtil.toFixedRoundDown("12.0", 0)).toEqual("12");
      expect(MathUtil.toFixedRoundDown("1234.56789", 4)).toEqual("1234.5678");
      expect(MathUtil.toFixedRoundDown("1234.56789", 8)).toEqual("1234.56789");
      expect(MathUtil.toFixedRoundDown(1234.56789, 8)).toEqual("1234.56789");
    });

    test("Number < 1", () => {
      expect(MathUtil.toFixedRoundDown("0.1234567890", 3)).toEqual("0.123");
      expect(MathUtil.toFixedRoundDown("0.1234567890", 6)).toEqual("0.123456");
    });

    test("Number <= 0", () => {
      expect(MathUtil.toFixedRoundDown("0", 6)).toEqual("0");
      // Since this function is used for showing balance, we will just return 0
      expect(MathUtil.toFixedRoundDown("-1.234567890", 6)).toEqual("0");
      expect(MathUtil.toFixedRoundDown("-1.234", 3)).toEqual("0");
      expect(MathUtil.toFixedRoundDown("-1.234", 6)).toEqual("0");
    });

    test("Number smaller than required decimal", () => {
      // 5.724643580141584e-8
      // biome-ignore lint/correctness/noPrecisionLoss: <explanation>
      expect(MathUtil.toFixedRoundDown(Number(57246435801415836) / 10 ** 24, 6)).toEqual("0");
    });

    test("Number larger than required decimal", () => {
      expect(MathUtil.toFixedRoundDown("22000", 4)).toEqual("22000");
    });
  });

  describe("prettyBalance()", () => {
    test("Within maxLen", () => {
      expect(MathUtil.humanReadableFromBigInt("1234567890", 6)).toEqual("1234.56789");
      expect(MathUtil.humanReadableFromBigInt("1234567890", 3)).toEqual("1234567.89");
      expect(MathUtil.humanReadableFromBigInt("1234567891", 3)).toEqual("1234567.891");

      // Default max length is 8
      expect(MathUtil.humanReadableFromBigInt("1234567891", 10)).toEqual("0.12345678");
    });

    test("Exceed maxLen", () => {
      expect(MathUtil.humanReadableFromBigInt("1234567890", 8, 4)).toEqual("12.3456");
      expect(MathUtil.humanReadableFromBigInt("1234597890", 8, 4)).toEqual("12.3459");

      // exceed default max length
      expect(MathUtil.humanReadableFromBigInt("123459789123456789", 13, 10)).toEqual(
        "12345.9789123456",
      );
    });

    test("Remove trailing zero", () => {
      expect(MathUtil.humanReadableFromBigInt("1200000000", 8, 4)).toEqual("12");
      expect(MathUtil.humanReadableFromBigInt("1200010000", 8, 4)).toEqual("12.0001");
      expect(MathUtil.humanReadableFromBigInt("1210000000", 8, 4)).toEqual("12.1");
      expect(MathUtil.humanReadableFromBigInt("1210100000", 8, 4)).toEqual("12.101");
    });

    test("Random test", () => {
      expect(MathUtil.humanReadableFromBigInt("11235957246435801415836", 24, 1)).toEqual("0");
      expect(MathUtil.humanReadableFromBigInt("11235957246435801415836", 24, 2)).toEqual("0.01");
      expect(MathUtil.humanReadableFromBigInt("11235957246435801415836", 24, 3)).toEqual("0.011");
      expect(MathUtil.humanReadableFromBigInt("11235957246435801415836", 24, 4)).toEqual("0.0112");
      expect(MathUtil.humanReadableFromBigInt("11235957246435801415836", 24, 5)).toEqual("0.01123");
      expect(MathUtil.humanReadableFromBigInt("11235957246435801415836", 24, 6)).toEqual(
        "0.011235",
      );
      expect(MathUtil.humanReadableFromBigInt("11235957246435801415836", 24, 7)).toEqual(
        "0.0112359",
      );
      expect(MathUtil.humanReadableFromBigInt("11235957246435801415836", 24, 8)).toEqual(
        "0.01123595",
      );
      expect(MathUtil.humanReadableFromBigInt("11235957246435801415836", 24, 9)).toEqual(
        "0.011235957",
      );
      expect(MathUtil.humanReadableFromBigInt("11235957246435801415836", 24, 10)).toEqual(
        "0.0112359572",
      );

      expect(MathUtil.humanReadableFromBigInt("57246435801415836", 24, 8)).toEqual("0.00000005");
    });
  });
});
