import { TPubSubListener } from "./pubsub.types";
import { ISubscribable } from "./pubsub.interfaces";

type TListenerMap<O> = {
  [key in keyof O]?: TPubSubListener<O[key]>[];
};

export class PubSub<O extends object = any> implements Omit<ISubscribable<O>, "pubSub"> {
  private listeners: TListenerMap<O> = {};

  private ensureId<K extends keyof O>(id: K): TPubSubListener<O[K]>[] {
    if (this.listeners[id] === undefined) {
      this.listeners[id] = [];
    }

    return this.listeners[id]!;
  }

  subscribe<K extends keyof O>(id: K, listener: TPubSubListener<O[K]>): () => void {
    this.ensureId(id).push(listener);
    return () => this.unsubscribe(id, listener);
  }

  unsubscribe<K extends keyof O>(id: K, listener: TPubSubListener<O[K]>) {
    this.listeners[id] = this.ensureId(id).filter(
      (existingListener) => existingListener !== listener,
    );
  }

  notifyListeners<K extends keyof O>(id: K, value: O[K]) {
    this.ensureId(id).forEach((listener) => listener(value));
  }
}
