import { ISubscribable } from "../../pubsub/pubsub.interfaces.ts";
import { IPubSub_Watchable } from "./watchable.pubsub.ts";

export interface IWatchableProps<P extends object> extends ISubscribable<IPubSub_Watchable<P>> {
  getWatchableProps: () => P;
  _updateWatchable: (update: Partial<P>) => void;
}

export interface IWatchableUpdate<P> {
  prev: P;
  current: P;
  changedProps: (keyof P)[];
}
