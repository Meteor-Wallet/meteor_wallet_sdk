import { type ILocalStorageInterface } from "../storage.types";

export const webpage_local_storage: ILocalStorageInterface = {
  getItem: async (key) => {
    return localStorage.getItem(key);
  },
  setItem: async (key, value) => {
    localStorage.setItem(key, value);
  },
  removeItem: async (key) => {
    localStorage.removeItem(key);
  },
  getKeys: async (prefix) => {
    const keys: string[] = [];
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (key != null && (prefix == null || key.startsWith(prefix))) keys.push(key);
    }
    return keys;
  },
};
