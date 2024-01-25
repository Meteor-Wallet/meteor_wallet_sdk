import { IEditableAndWatchableProps } from "./editable.interfaces.ts";
import isEqual from "fast-deep-equal";
import { EPubSub_WatchableProps } from "../watchable/watchable.pubsub.ts";
import { IWatchableProps } from "../watchable/watchable.interfaces.ts";

export function updateWithDefinedProps<T extends object, W extends T, O extends object & T>(
  obj: O,
  update: Partial<W>,
): void {
  for (const key in update) {
    // @ts-ignore
    obj[key] = update[key]!;
  }
}

export function doEditablePropsUpdate<
  E extends object,
  O extends IEditableAndWatchableProps<E, any>,
>(obj: O, update: Partial<E>) {
  return doWatchableUpdate(obj, update as Partial<any>);
}

export function doWatchableUpdate<O extends IWatchableProps<W>, W extends object>(
  obj: O,
  update: Partial<W>,
  deepCheck?: {
    [key in keyof W]?: true;
  },
) {
  const prev: W = obj.getWatchableProps();

  const changedProps: (keyof W)[] = [];

  // If there are no actual changes, do nothing
  for (const prop in update) {
    // Deep check property equality
    if (deepCheck?.[prop] === true) {
      if (!isEqual(prev[prop], update[prop])) {
        changedProps.push(prop);
      }

      continue;
    }

    // Referential equality
    if (prev[prop] !== update[prop]) {
      changedProps.push(prop);
    }
  }

  if (changedProps.length === 0) {
    return;
  }

  updateWithDefinedProps(obj, update);

  obj.pubSub.notifyListeners(EPubSub_WatchableProps.on_update_props, {
    prev: prev,
    current: obj.getWatchableProps(),
    changedProps,
  });
}
