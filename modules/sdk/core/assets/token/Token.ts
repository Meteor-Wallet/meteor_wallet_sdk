import { TokenAmount } from "./TokenAmount";
import {
  IOTokenConstructor_Input,
  IOTokenToTokenAmount_Input,
  ITokenWatchableProps,
} from "./Token.interfaces.ts";

import { IListManageable } from "../../utility/managers/list_manager/list_manager.interfaces";
import { OrdIdentity } from "../../utility/managers/list_manager/OrdIdentity";
import { IWithBasicAccount, IWithBasicAccountProps } from "../../account/account.interfaces.ts";
import { Blockchain } from "../../blockchain/Blockchain.ts";
import { IWatchableProps } from "../../utility/data_entity/watchable/watchable.interfaces.ts";
import {
  EPubSub_WatchableProps,
  IPubSub_Watchable,
} from "../../utility/data_entity/watchable/watchable.pubsub.ts";
import { PubSub } from "../../utility/pubsub/PubSub.ts";
import { TPubSubListener } from "../../utility/pubsub/pubsub.types.ts";
import { doWatchableUpdate } from "../../utility/data_entity/editable/editable.utils.ts";
import { BasicAccount } from "../../account/BasicAccount.ts";

export abstract class Token
  implements
    IWithBasicAccount,
    IListManageable<IWithBasicAccountProps>,
    IWatchableProps<ITokenWatchableProps>,
    ITokenWatchableProps
{
  _ord = new OrdIdentity();

  // Account / Contract ID
  id: string;

  abstract basic: BasicAccount;
  abstract blockchain: Blockchain;

  // is native (non-contract based token)
  isNative: boolean;

  // is bridged (i.e. is not a "native" token existing on the blockchain,
  // but rather is bridged representation, offered by a separate service)
  isBridged: boolean;

  dollarPrice?: string;
  decimals: number;

  protected constructor({
    isNative,
    isBridged,
    dollarPrice,
    id,
    decimals,
  }: IOTokenConstructor_Input) {
    this.decimals = decimals;
    this.isNative = isNative;
    this.isBridged = isBridged;
    this.dollarPrice = dollarPrice;
    this.id = id;
  }

  abstract toTokenAmount(inputs: IOTokenToTokenAmount_Input): TokenAmount;

  /*
   *   INTERNAL INTERFACE IMPLEMENTATION THINGS
   */

  getWatchableProps(): ITokenWatchableProps {
    return {
      dollarPrice: this.dollarPrice,
    };
  }

  _updateWatchable(update: Partial<ITokenWatchableProps>) {
    doWatchableUpdate(this, update);
  }

  pubSub: PubSub<IPubSub_Watchable<ITokenWatchableProps>> = new PubSub<
    IPubSub_Watchable<ITokenWatchableProps>
  >();

  subscribe<K extends EPubSub_WatchableProps.on_update_props>(
    id: K,
    listener: TPubSubListener<IPubSub_Watchable<ITokenWatchableProps>[K]>,
  ): () => void {
    return this.pubSub.subscribe(id, listener);
  }

  unsubscribe<K extends EPubSub_WatchableProps.on_update_props>(
    id: K,
    listener: TPubSubListener<IPubSub_Watchable<ITokenWatchableProps>[K]>,
  ): void {
    return this.pubSub.unsubscribe(id, listener);
  }

  getRuntimeUniqueKey(): string | number {
    return this._ord.getOrd();
  }

  isEqualTo(other: IWithBasicAccount): boolean {
    return this.basic.isEqualTo(other.basic);
  }
}
