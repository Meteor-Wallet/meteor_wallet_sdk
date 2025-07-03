/**
 * Created by Paul on 2017-06-19.
 */
import _ from "lodash";

const isArrayLike = <T>(item: any | null | undefined): item is T[] => {
  return (
    Array.isArray(item) ||
    (!!item &&
      typeof item === "object" &&
      "length" in item &&
      typeof item.length === "number" &&
      (item.length === 0 || (item.length > 0 && item.length - 1 in item)))
  );
};

export const firstNotNullEmptyArray = <T>(
  ...arrays: (T[] | undefined | null)[]
): T[] | undefined => {
  for (const array of arrays) {
    if (notNullEmptyArray(array)) {
      return array;
    }
  }

  return undefined;
};

export const notNullEmptyArray = <T>(array: T[] | undefined | null): array is T[] => {
  return array != null && isArrayLike(array) && array.length > 0;
};

export const nullEmptyArray = (array: any[] | null | undefined) => {
  return !notNullEmptyArray(array);
};

function firstElementOrNull<T>(array: T[]): T | null {
  if (notNullEmptyArray(array)) {
    return array[0];
  }

  return null;
}

const safeIterate = <T>(
  array: T[] | null | undefined,
  iterator: (value: T, index: number, array: T[]) => void,
) => {
  if (notNullEmptyArray(array)) {
    array.forEach(iterator);
  }
};

function safeFmap<T, O>(
  array: T[] | null | undefined,
  fmapIterator: (value: T, index: number, array: T[]) => null | undefined | O,
): O[] {
  if (notNullEmptyArray(array)) {
    return fmapCall.call(array, fmapIterator);
  }

  return [];
}

function safeMap<T>(
  array: T[],
  mapIterator: (value: T, index: number, array: T[]) => any,
): null | any[] {
  if (notNullEmptyArray(array)) {
    return array.map(mapIterator);
  }

  return null;
}

export function fmapCall(this: any, callback) {
  return this.reduce((accum, ...args) => {
    const x = callback(...args);

    if (x != null) {
      accum.push(x);
    }

    return accum;
  }, []);
}

function subArrayGroups<T>(array: T[], keyOrFunc: ((item: T) => string | number) | keyof T): T[][] {
  return Object.values(_.groupBy(array, keyOrFunc));
}

function subGroupIterate<T>(
  array: T[],
  groupSize: number,
  iterateFunction: (subGroup: T[]) => void,
) {
  const cutArray = array.slice();

  while (cutArray.length > 0) {
    iterateFunction(cutArray.splice(0, groupSize));
  }
}

async function subGroupIterateAsync<T>(
  array: T[],
  groupSize: number,
  iterateFunction: (subGroup: T[]) => Promise<any>,
) {
  const cutArray = array.slice();

  while (cutArray.length > 0) {
    await iterateFunction(cutArray.splice(0, groupSize));
  }
}

const hasIntersection = (arrayOne: any[], arrayTwo: any[]) => {
  if (arrayOne.length > arrayTwo.length) {
    for (const item of arrayTwo) {
      if (arrayOne.includes(item)) {
        return true;
      }
    }
  } else {
    for (const item of arrayOne) {
      if (arrayTwo.includes(item)) {
        return true;
      }
    }
  }

  return false;
};

const deepFMap = (
  array: any[],
  deepMapFunction: (value: any, index: number, depth: number) => any,
  mapAtDepth: number | null = null,
  startingDepthCounter = 1,
): any[] => {
  return fmapCall.call(array, (v, i) => {
    if (mapAtDepth != null && startingDepthCounter === mapAtDepth) {
      return deepMapFunction(v, i, startingDepthCounter);
    }

    if (ArrayUtils.isArrayLike(v)) {
      return deepFMap(v, deepMapFunction, mapAtDepth, startingDepthCounter + 1);
    } else {
      return deepMapFunction(v, i, startingDepthCounter);
    }
  });
};

function sortNumbers(array: number[], desc = false) {
  if (desc) {
    return array.sort((a, b) => b - a);
  }

  return array.sort((a, b) => a - b);
}

export const notNull = (item) => item != null;

function pushAndReturn<I = any>(array: Array<I> | undefined, ...items: Array<I>): Array<I> {
  if (!array) {
    array = [];
  }

  array.push(...items);
  return array;
}

function spliceAndReturn<I = any>(array: Array<I>, index: number, count: number) {
  array.splice(index, count);
  return array;
}

function pushOrCreateOnObject(obj: any, key: string, item: any): void {
  if (obj[key] == null) {
    (obj as any)[key] = [];
  }

  ((obj as any)[key] as Array<any>).push(item);
}

export type TItemMatchPredicate<T> = ((arrayItem: T, inputItem: T) => boolean) | string | string[];

function indexOfMatchedPredicate<T>(
  array: Array<T>,
  item: T,
  matchPredicate: TItemMatchPredicate<T>,
): number {
  if (typeof matchPredicate === "string") {
    let index = -1;
    for (const i of array) {
      index += 1;
      if (i[matchPredicate] === item[matchPredicate]) {
        return index;
      }
    }
  } else if (Array.isArray(matchPredicate)) {
    let index = -1;
    for (const i of array) {
      index += 1;
      if (_.get(i, matchPredicate) === _.get(item, matchPredicate)) {
        return index;
      }
    }
  } else {
    let index = -1;
    for (const i of array) {
      index += 1;
      if (matchPredicate(i, item)) {
        return index;
      }
    }
  }

  return -1;
}

function addIfMissing<T>(
  array: Array<T>,
  item: T | T[],
  matchPredicate?: TItemMatchPredicate<T>,
): Array<T> {
  if (Array.isArray(item)) {
    for (const i of item) {
      addIfMissing(array, i, matchPredicate);
    }
  } else {
    if (matchPredicate) {
      if (indexOfMatchedPredicate(array, item, matchPredicate) >= 0) {
        return array;
      }
      /*if (typeof matchPredicate === "string") {
        for (const i of array) {
          if (i[matchPredicate] === item[matchPredicate]) {
            return array;
          }
        }
      } else if (Array.isArray(matchPredicate)) {
        for (const i of array) {
          if (_.get(i, matchPredicate) === _.get(item, matchPredicate)) {
            return array;
          }
        }
      } else {
        for (const i of array) {
          if (matchPredicate(i, item)) {
            return array;
          }
        }
      }*/

      array.push(item);
      return array;
    }

    if (!array.includes(item)) {
      array.push(item);
    }
  }

  return array;
}

function toggleItems<T>(
  array: Array<T>,
  item: T | T[],
  matchPredicate?: TItemMatchPredicate<T>,
): Array<T> {
  if (Array.isArray(item)) {
    for (const i of item) {
      toggleItems(array, i);
    }
  } else {
    let matchedIndex;

    if (matchPredicate) {
      matchedIndex = indexOfMatchedPredicate(array, item, matchPredicate);
    } else {
      matchedIndex = array.indexOf(item);
    }

    if (matchedIndex >= 0) {
      array.splice(matchedIndex, 1);
    } else {
      array.push(item);
    }
  }

  return array;
}

export function last<T>(array: T[]): T {
  return array[array.length - 1];
}

function removeUndefinedOrNull<T>(array: (T | undefined)[]): T[] {
  return safeFmap(array, (i) => i);
}

function collectProperty<T, K extends keyof T, P extends T[K] = T[K]>(
  array: T[],
  itemProperty: K,
): P[] {
  const collectSet = new Set<P>();

  for (const item of array) {
    collectSet.add(item[itemProperty] as P);
  }

  return [...collectSet];
}

/**
 * judge is list1's content equal with list2's (order insensitive)
 * @param list1
 * @param list2
 * @returns
 */
const isStringSetEqual = (list1: string[], list2: string[]) => {
  if (!list1 || !list2 || list1.length !== list2.length) {
    return false;
  }
  const list = [...list2];
  for (const str1 of list1) {
    const i = list.findIndex((str2) => str1 === str2);
    if (i < 0) {
      return false;
    }
    delete list[i];
  }
  return !list.filter((v) => v).length;
};

function removeDuplicate(array: string[]) {
  return [...new Set(array)];
}

/**
 * Check if lists are equal, order sensitive
 * @param array1
 * @param array2
 * @param itemEqualityCheck optional equality check function to compare two items
 * @returns
 */
const isEqual = <T = any>(
  array1: T[],
  array2: T[],
  itemEqualityCheck?: (a: T, b: T) => boolean,
): boolean => {
  if (array1.length !== array2.length) {
    return false;
  }

  const equalityCheck = itemEqualityCheck ?? ((a, b) => a === b);

  for (let i = 0; i < array1.length; i++) {
    if (!equalityCheck(array1[i], array2[i])) {
      return false;
    }
  }

  return true;
};

const moveByIndex = <T = any>(arr: T[], from: number, to: number) => {
  const copied = _.cloneDeep(arr);
  copied.splice(from, 1, copied.splice(to, 1, copied[from])[0]);

  return copied;
};

export const ArrayUtils = {
  isEqual,
  collectProperty,
  subArrayGroups,
  hasIntersection,
  isArrayLike,
  deepFMap,
  notNullEmptyArray,
  nullEmptyArray,
  firstElementOrNull,
  safeIterate,
  safeFmap,
  safeMap,
  subGroupIterate,
  subGroupIterateAsync,
  sortNumbers,
  pushOrCreateOnObject,
  addIfMissing,
  toggleItems,
  pushAndReturn,
  spliceAndReturn,
  removeUndefinedOrNull,
  isStringSetEqual,
  removeDuplicate,
  moveByIndex,
};
