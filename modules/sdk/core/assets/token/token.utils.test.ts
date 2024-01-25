import { token_utils } from "./token.utils";

describe("TokenUtils", () => {
  test("convertReadableAmountToCryptoInteger with 2 decimals", async () => {
    const nativeAmount = token_utils.convertReadableAmountToCryptoInteger("1.10", 24);
    expect(nativeAmount).toEqual("1100000000000000000000000");
  });

  test("convertReadableAmountToCryptoInteger with more than 2 decimal place", async () => {
    const nativeAmount = token_utils.convertReadableAmountToCryptoInteger("1.123", 24);
    expect(nativeAmount).toEqual("1123000000000000000000000");
  });

  test("convertReadableAmountToCryptoInteger: make sure whole numbers are accept when converting to crypto amount", async () => {
    const readableAmount = token_utils.convertReadableAmountToCryptoInteger("5", 24);
    expect(readableAmount).toEqual("5000000000000000000000000");
  });

  test("convertAmountToDecimal", async () => {
    const readableAmount = token_utils.convertCryptoIntegerToReadableAmount(
      "1100000000000000000000000",
      24,
    );
    expect(readableAmount).toEqual("1.1");
  });

  test("convertAmountToDecimal with more than 2 decimal place", async () => {
    const readableAmount = token_utils.convertCryptoIntegerToReadableAmount(
      "1123000000000000000000000",
      24,
    );
    expect(readableAmount).toEqual("1.123");
  });
});
