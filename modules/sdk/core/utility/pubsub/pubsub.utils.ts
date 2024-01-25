import { EPubSub_ListManager } from "../managers/list_manager/ListManager.pubsub";

export function createPubSubIdRouter<T extends string>(
  idConvertMap: Record<EPubSub_ListManager, T>,
): (id: T) => void {
  const inverseMap: {
    [key in T]?: EPubSub_ListManager;
  } = {};

  for (const key of Object.keys(idConvertMap) as EPubSub_ListManager[]) {
    inverseMap[idConvertMap[key]] = key;
  }

  return (id: T) => {
    return inverseMap[id];
  };
}
