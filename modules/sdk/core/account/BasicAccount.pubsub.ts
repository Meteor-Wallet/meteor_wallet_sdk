import { IWatchableUpdate } from "../utility/data_entity/watchable/watchable.interfaces.ts";
import { EPubSub_WatchableProps } from "../utility/data_entity/watchable/watchable.pubsub.ts";
import { IBasicAccountEditableProps } from "./BasicAccount.interfaces.ts";

export interface IPubSub_BasicAccount {
  [EPubSub_WatchableProps.on_update_props]: IWatchableUpdate<IBasicAccountEditableProps>;
}
