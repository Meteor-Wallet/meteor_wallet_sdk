export enum EPubSub_ListManager {
  item_add = "item_add",
  item_remove = "item_remove",
  list_change = "list_change",
}

export interface IPubSub_ListManager<T> {
  [EPubSub_ListManager.item_add]: T;
  [EPubSub_ListManager.item_remove]: T;
  [EPubSub_ListManager.list_change]: T[];
}
