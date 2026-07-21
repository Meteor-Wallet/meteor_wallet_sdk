export interface ILocalStorageInterface {
  setItem: (key: string, value: string) => Promise<void>;
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
  /** Optional prefix enumeration used for safe cross-tab bridge leases and comprehensive reset. */
  getKeys?: (prefix?: string) => Promise<string[]>;
}

export interface IEnumerableLocalStorageInterface extends ILocalStorageInterface {
  getKeys: (prefix?: string) => Promise<string[]>;
}
