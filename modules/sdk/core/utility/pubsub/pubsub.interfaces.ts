import { TPubSubListener } from "./pubsub.types";
import { PubSub } from "./PubSub";

export interface ISubscribable<O extends object> {
  pubSub: PubSub<O>;

  subscribe<K extends keyof O>(id: K, listener: TPubSubListener<O[K]>): () => void;

  unsubscribe<K extends keyof O>(id: K, listener: TPubSubListener<O[K]>): void;
}

export interface IPubSub_WatchableProps<P extends object> {}
