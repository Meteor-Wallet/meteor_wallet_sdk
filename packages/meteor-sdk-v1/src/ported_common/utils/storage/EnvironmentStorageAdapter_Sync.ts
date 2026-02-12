interface IStateAdapter_Sync {
  getString: (key: string) => string | null | undefined;
  setString: (key: string, value: string) => void;
  clear: (key: string) => void;
}

export interface IStorageKeyGetterAndSetter_Sync<T> {
  get: () => T | undefined;
  set: (value: T) => void;
}

export class CEnvironmentStorageAdapter_Sync {
  private implementation: IStateAdapter_Sync;

  constructor(implementation: IStateAdapter_Sync) {
    this.implementation = implementation;
  }

  setJson(key: string, value: any) {
    this.implementation.setString(key, JSON.stringify(value));
  }

  getJson<T>(key: string): T | undefined {
    const val = this.implementation.getString(key);

    if (val == null || val === "undefined" || val === "null") {
      return undefined;
    }

    return JSON.parse(val);
  }

  setString(key: string, value: string) {
    this.implementation.setString(key, value);
  }

  getString(key: string): string | undefined {
    const val = this.implementation.getString(key);

    if (val == null) {
      return undefined;
    }

    return val;
  }

  clear(key: string) {
    this.implementation.clear(key);
  }

  createJsonGetterSetter<T>(key: string): IStorageKeyGetterAndSetter_Sync<T> {
    return {
      get: () => this.getJson(key),
      set: (value: T) => this.setJson(key, value),
    };
  }

  createStringGetterSetter(key: string): IStorageKeyGetterAndSetter_Sync<string> {
    return {
      get: () => this.getString(key),
      set: (value: string) => this.setString(key, value),
    };
  }
}
