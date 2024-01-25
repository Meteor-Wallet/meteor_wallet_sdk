import { IWatchableUpdate } from "./watchable.interfaces.ts";

export enum EPubSub_WatchableProps {
  on_update_props = "on_update_props",
}

export interface IPubSub_Watchable<T> {
  [EPubSub_WatchableProps.on_update_props]: IWatchableUpdate<T>;
}
