import { EPubSub_ListManager } from "./ListManager.pubsub";

export type TPubSubIdMap_ListManager<T extends string> = {
  [key in T]: EPubSub_ListManager;
};
