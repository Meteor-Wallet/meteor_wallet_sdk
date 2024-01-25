import { TokenAmount } from "../../../core/assets/token/TokenAmount";
import { NearToken } from "./NearToken";
import BN from "bn.js";
import { token_utils } from "../../../core/assets/token/token.utils.ts";

export class NearTokenAmount extends TokenAmount {
  readonly token: NearToken;

  constructor({ cryptoInteger, token }: { cryptoInteger: string; token: NearToken }) {
    super({ cryptoInteger });
    this.token = token;
  }

  getNativeAmountInBN(): BN {
    return new BN(this.cryptoInteger);
  }

  getReadableAmountString(maxFractionLength?: number): string {
    const readable = token_utils.convertCryptoIntegerToReadableAmount(
      this.cryptoInteger,
      this.token.decimals,
    );

    if (maxFractionLength === undefined) return readable;

    const parts = readable.split(".");

    if (parts.length > 1) {
      return `${parts[0]}.${parts[1].slice(0, maxFractionLength)}`;
    }

    return readable;
  }
}
