import { MeteorError } from "../../../errors/MeteorError";
import { EErrorId_ListManager, TErrorId } from "../../../errors/MeteorErrorIds";
import { PubSub } from "../../pubsub/PubSub";
import { EPubSub_ListManager, IPubSub_ListManager } from "./ListManager.pubsub";
import { ISubscribable } from "../../pubsub/pubsub.interfaces";
import { TPubSubListener } from "../../pubsub/pubsub.types";
import { IEqualityCheckable, IListManageable, IOrdIdentifiable } from "./list_manager.interfaces";
import { OrdIdentity } from "./OrdIdentity";

type TListManagerCustomErrorIdMap = {
  [key in EErrorId_ListManager]?: TErrorId;
};

export class ListManager<
  I extends IListManageable<T>,
  T = I extends IEqualityCheckable<infer S> ? (I extends S ? S : never) : never,
> implements ISubscribable<IPubSub_ListManager<I>>, IOrdIdentifiable
{
  readonly pubSub = new PubSub<IPubSub_ListManager<any>>();

  private listItems: I[] = [];
  private readonly errorMap: TListManagerCustomErrorIdMap = {};
  _ord = new OrdIdentity();

  constructor({
    errorMap,
  }: {
    errorMap?: TListManagerCustomErrorIdMap;
  } = {}) {
    this.errorMap = errorMap ?? {};
  }

  private getErrorId(id: EErrorId_ListManager): TErrorId {
    return this.errorMap[id] ?? id;
  }

  subscribe<K extends keyof IPubSub_ListManager<I>>(
    id: K,
    listener: TPubSubListener<IPubSub_ListManager<I>[K]>,
  ): () => void {
    return this.pubSub.subscribe(id, listener);
  }

  unsubscribe<K extends keyof IPubSub_ListManager<I>>(
    id: K,
    listener: TPubSubListener<IPubSub_ListManager<I>[K]>,
  ): void {
    return this.pubSub.unsubscribe(id, listener);
  }

  add(item: I, options: { notifyList?: boolean } = { notifyList: true }) {
    if (this.includes(item as unknown as T)) {
      throw MeteorError.fromId(
        this.getErrorId(EErrorId_ListManager.list_item_already_exists),
        this.get(item as unknown as T),
      );
    }

    this.listItems.push(item);

    this.pubSub.notifyListeners(EPubSub_ListManager.item_add, item);

    if (options.notifyList) {
      this.pubSub.notifyListeners(EPubSub_ListManager.list_change, this.listItems);
    }
  }

  addMultiple(items: I[]) {
    for (const item of items) {
      if (this.includes(item as unknown as T)) {
        throw MeteorError.fromId(
          this.getErrorId(EErrorId_ListManager.list_item_already_exists),
          this.get(item as unknown as T),
        );
      }
    }

    for (const item of items) {
      this.add(item, { notifyList: false });
    }

    this.pubSub.notifyListeners(EPubSub_ListManager.list_change, this.listItems);
  }

  get(item: T) {
    const foundItem = this.listItems.find((existingItem) => existingItem.isEqualTo(item));

    if (!foundItem) {
      throw MeteorError.fromId(this.getErrorId(EErrorId_ListManager.list_item_not_found));
    }

    return foundItem;
  }

  includes(item: T) {
    return this.listItems.some((existingItem) => existingItem.isEqualTo(item));
  }

  includesAll(items: T[]) {
    return !items.some((item) => !this.includes(item));
  }

  hasAny(): boolean {
    return this.listItems.length > 0;
  }

  getFirst(): I {
    if (!this.hasAny()) {
      throw MeteorError.fromId(this.getErrorId(EErrorId_ListManager.list_is_empty));
    }

    return this.listItems[0];
  }

  getAll(): I[] {
    return this.listItems;
  }

  keepOnlyMatching(keepItems: T[]) {
    const toRemove: I[] = [];
    const newItems: I[] = [];

    if (!this.includesAll(keepItems)) {
      throw MeteorError.fromId(this.getErrorId(EErrorId_ListManager.list_item_not_found));
    }

    for (const currentListItem of this.listItems) {
      if (!keepItems.some((keepItem) => currentListItem.isEqualTo(keepItem))) {
        toRemove.push(currentListItem);
      } else {
        newItems.push(currentListItem);
      }
    }

    for (const removeItem of toRemove) {
      this.remove(removeItem as unknown as T);
    }

    this.pubSub.notifyListeners(EPubSub_ListManager.list_change, this.listItems);
    this.listItems = newItems;
  }

  removeByIndex(index: number): I {
    const [deletedItem] = this.listItems.splice(index, 1);

    this.pubSub.notifyListeners(EPubSub_ListManager.item_remove, deletedItem);
    this.pubSub.notifyListeners(EPubSub_ListManager.list_change, this.listItems);
    return deletedItem;
  }

  remove(item: T): I {
    if ((item as any)._ord !== undefined) {
      try {
        return this.removeByOrd((item as any)._ord.getOrd());
      } catch (error) {}
    }

    const itemIndex = this.listItems.findIndex((existingItem) => existingItem.isEqualTo(item));

    if (itemIndex === -1) {
      throw MeteorError.fromId(this.getErrorId(EErrorId_ListManager.list_item_not_found));
    }

    return this.removeByIndex(itemIndex);
  }

  removeByOrd(ord: number): I {
    const itemIndex = this.listItems.findIndex((item) => item._ord.getOrd() === ord);

    if (itemIndex === -1) {
      throw MeteorError.fromId(this.getErrorId(EErrorId_ListManager.list_item_not_found));
    }

    return this.removeByIndex(itemIndex);
  }

  removeAll() {
    const oldListItems = [...this.listItems];
    this.listItems = [];

    for (const item of oldListItems) {
      this.pubSub.notifyListeners(EPubSub_ListManager.item_remove, item);
    }

    this.pubSub.notifyListeners(EPubSub_ListManager.list_change, this.listItems);
  }
}
