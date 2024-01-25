import { TokenAmount } from "./TokenAmount.ts";
import { EPubSub_WatchableProps } from "../../utility/data_entity/watchable/watchable.pubsub.ts";
import { IWatchableTokenAmountProps } from "./TokenAmount.interfaces.ts";
import { IWatchableUpdate } from "../../utility/data_entity/watchable/watchable.interfaces.ts";

export enum EPubSub_TokenAmount {
  amount_changed = "amount_changed",
}

export interface IPubSub_TokenAmount {
  [EPubSub_TokenAmount.amount_changed]: TokenAmount;
  [EPubSub_WatchableProps.on_update_props]: IWatchableUpdate<IWatchableTokenAmountProps>;
}
