import { IRpcEndpointEditableProps } from "./RpcEndpoint.interfaces.ts";
import { IWatchableUpdate } from "../../utility/data_entity/watchable/watchable.interfaces.ts";
import { EPubSub_WatchableProps } from "../../utility/data_entity/watchable/watchable.pubsub.ts";

export enum EPubSub_RpcEndpoint {
  is_enabled_changed = "is_enabled_changed",
}

export interface IPubSub_RpcEndpoint {
  [EPubSub_RpcEndpoint.is_enabled_changed]: boolean;
  [EPubSub_WatchableProps.on_update_props]: IWatchableUpdate<IRpcEndpointEditableProps>;
}
