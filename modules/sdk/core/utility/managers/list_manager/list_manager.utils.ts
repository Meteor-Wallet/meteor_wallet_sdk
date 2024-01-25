import { EPubSub_ListManager } from "./ListManager.pubsub";

export function isListManagerPubSubId(id: string): id is EPubSub_ListManager {
  return Object.values(EPubSub_ListManager).includes(id as EPubSub_ListManager);
}
