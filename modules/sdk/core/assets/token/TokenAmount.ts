import { Token } from "./Token";
import { IListManageable } from "../../utility/managers/list_manager/list_manager.interfaces";
import { OrdIdentity } from "../../utility/managers/list_manager/OrdIdentity";
import { ISubscribable } from "../../utility/pubsub/pubsub.interfaces.ts";
import { IPubSub_TokenAmount } from "./TokenAmount.pubsub.ts";
import { TPubSubListener } from "../../utility/pubsub/pubsub.types.ts";
import { PubSub } from "../../utility/pubsub/PubSub.ts";
import { IOTokenToTokenAmount_Input, IWithToken } from "./Token.interfaces.ts";
import { IWatchableProps } from "../../utility/data_entity/watchable/watchable.interfaces.ts";
import { IWatchableTokenAmountProps } from "./TokenAmount.interfaces.ts";
import { doWatchableUpdate } from "../../utility/data_entity/editable/editable.utils.ts";
import Big from "big.js";
import { token_utils } from "./token.utils.ts";

export abstract class TokenAmount
  implements
    IListManageable<IWithToken>,
    ISubscribable<IPubSub_TokenAmount>,
    IWatchableProps<IWatchableTokenAmountProps>,
    IWatchableTokenAmountProps
{
  _ord = new OrdIdentity();
  cryptoInteger: string;
  abstract readonly token: Token;

  protected constructor({ cryptoInteger }: { cryptoInteger: string }) {
    this.cryptoInteger = cryptoInteger;
  }

  abstract getReadableAmountString(maxFractionLength?: number): string;

  comparedToReadable(readable: string | number): {
    lt: boolean;
    lte: boolean;
    gt: boolean;
    gte: boolean;
  } {
    const readableNum = Big(`${readable}`);

    const readableBig = Big(this.getReadableAmountString());

    return {
      gte: readableBig.gte(readableNum),
      gt: readableBig.gt(readableNum),
      lte: readableBig.lte(readableNum),
      lt: readableBig.lt(readableNum),
    };
  }

  setAmount(inputs: IOTokenToTokenAmount_Input) {
    console.log("Setting amount", inputs);

    let cryptoInteger = inputs.value;

    if (!inputs.isCryptoInteger) {
      cryptoInteger = token_utils.convertReadableAmountToCryptoInteger(
        inputs.value,
        this.token.decimals,
      );
    }

    this._updateWatchable({
      cryptoInteger,
    });
  }

  amountIsLargerThan(tokenAmount: TokenAmount): boolean {
    return Big(this.cryptoInteger).lt(tokenAmount.cryptoInteger);
  }

  amountIsEqualTo(tokenAmount: TokenAmount): boolean {
    return Big(this.cryptoInteger).eq(tokenAmount.cryptoInteger);
  }

  /** Compares if this is the same TOKEN as another TokenAmount
   * N.B. This is not the same as comparing the amount of tokens!
   */
  isEqualTo(other: IWithToken): boolean {
    return this.token.isEqualTo(other.token);
  }

  /*
   *   INTERNAL INTERFACE IMPLEMENTATION THINGS
   */

  getRuntimeUniqueKey(): string | number {
    return this._ord.getOrd();
  }

  getWatchableProps(): IWatchableTokenAmountProps {
    return {
      cryptoInteger: this.cryptoInteger,
    };
  }

  _updateWatchable(update: Partial<IWatchableTokenAmountProps>): void {
    doWatchableUpdate(this, update);
  }

  pubSub: PubSub<IPubSub_TokenAmount> = new PubSub<IPubSub_TokenAmount>();

  subscribe<K extends keyof IPubSub_TokenAmount>(
    id: K,
    listener: TPubSubListener<IPubSub_TokenAmount[K]>,
  ): () => void {
    return this.pubSub.subscribe(id, listener);
  }

  unsubscribe<K extends keyof IPubSub_TokenAmount>(
    id: K,
    listener: TPubSubListener<IPubSub_TokenAmount[K]>,
  ): void {
    return this.pubSub.unsubscribe(id, listener);
  }
}
