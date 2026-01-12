import type { StringKeys } from "../special_typescript_types.ts";
import type { CEnvironmentStorageAdapter } from "./EnvironmentStorageAdapter.ts";

export interface ITypedStorageHelper<T extends Record<string, any>> {
  getJson<K extends StringKeys<T>>(key: K): Promise<T[K] | undefined>;
  getJsonOrDef<K extends StringKeys<T>>(key: K, defVal: T[K]): Promise<T[K]>;
  setJson<K extends StringKeys<T>>(key: K, val: T[K]): Promise<void>;
  removeItem<K extends StringKeys<T>>(key: K): Promise<void>;
}

interface ICreateTypedStorageHelper_Input {
  storageAdapter: CEnvironmentStorageAdapter;
  keyPrefix?: string;
}

export function createTypedStorageHelper<T extends Record<string, any>>({
  storageAdapter,
  keyPrefix = "",
}: ICreateTypedStorageHelper_Input): ITypedStorageHelper<T> {
  function makeKey(key: string): string {
    return `${keyPrefix}${key}`;
  }

  const getJson = async <K extends StringKeys<T>>(key: K): Promise<T[K] | undefined> => {
    return storageAdapter.getJson<T[K]>(makeKey(key));
  };

  const getJsonOrDef = async <K extends StringKeys<T>>(key: K, defVal: T[K]): Promise<T[K]> => {
    return (await storageAdapter.getJson<T[K]>(makeKey(key))) ?? defVal;
  };

  const setJson = async <K extends StringKeys<T>>(key: K, val: T[K]): Promise<void> => {
    return storageAdapter.setJson(makeKey(key), val);
  };

  const removeItem = async <K extends StringKeys<T>>(key: K): Promise<void> => {
    return storageAdapter.removeItem(makeKey(key));
  };

  return {
    getJson,
    getJsonOrDef,
    setJson,
    removeItem,
  };
}
