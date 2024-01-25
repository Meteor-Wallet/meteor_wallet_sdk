import { MeteorInternalError } from "../../errors/MeteorError.ts";
import { StringUtils } from "../../utility/javascript_datatype_utils/string.utils.ts";
import { StringNumberUtils } from "../../utility/javascript_datatype_utils/string_number.utils.ts";

function checkInputIsNumberAndPositive(num: string, functionLabel?: string) {
  if (StringUtils.nullEmpty(num)) {
    throw new MeteorInternalError(`${functionLabel}(): number string must not be empty or null`);
  }

  // check string is number and positive
  if (!StringNumberUtils.isPositiveNumber(num)) {
    throw new MeteorInternalError(
      `${functionLabel}(): number string value must be a postive number only`,
    );
  }
}

// reference: https://github.com/octopus-network/nep141-token-convertor-ui/blob/aa3cda4aca3742cf793e6423cd2df9b135c02271/src/domain/near/NearAmount.ts#L31-L50
function convertCryptoIntegerToReadableAmount(cryptoInteger: string, decimals: number): string {
  checkInputIsNumberAndPositive(cryptoInteger, "convertCryptoIntegerToReadableAmount");

  if (StringNumberUtils.isDecimal(cryptoInteger)) {
    throw new MeteorInternalError(
      "convertAmountToNonDecimal: The cryptoInteger string value must not be a decimal value",
    );
  }

  const wholeStr = cryptoInteger.substring(0, cryptoInteger.length - decimals) || "0";
  const fractionStr = cryptoInteger
    .substring(cryptoInteger.length - decimals)
    .padStart(decimals, "0")
    .substring(0, decimals);

  return `${wholeStr}.${fractionStr}`.replace(/\.?0+$/, "");
}

function convertReadableAmountToCryptoInteger(readableAmount: string, decimals: number): string {
  if (StringUtils.nullEmpty(readableAmount)) {
    throw new MeteorInternalError(
      "convertAmountToNonDecimal: decimalAmount must not be empty or null",
    );
  }

  if (!StringNumberUtils.isPositiveNumber(readableAmount)) {
    throw new MeteorInternalError(
      "convertAmountToNonDecimal: decimalAmount string value must be a postive number only",
    );
  }

  const [wholePart, fracPart = ""] = readableAmount.split(".");

  return `${wholePart}${fracPart.padEnd(decimals, "0").slice(0, decimals)}`
    .replace(/^0+/, "")
    .padStart(1, "0");
}

export const token_utils = {
  convertCryptoIntegerToReadableAmount,
  convertReadableAmountToCryptoInteger,
};
