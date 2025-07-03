interface IStateAdapter {
  getString: (key: string) => Promise<string | null | undefined>;
  setString: (key: string, value: string) => Promise<void>;
}

export interface IStorageKeyGetterAndSetter<T> {
  get: () => Promise<T | undefined>;
  set: (value: T) => Promise<void>;
}

export class EnvironmentStateAdapter {
  private implementation: IStateAdapter;

  constructor(implementation: IStateAdapter) {
    this.implementation = implementation;
  }

  async setJson(key: string, value: any) {
    await this.implementation.setString(key, JSON.stringify(value));
  }

  async getJson<T>(key: string): Promise<T | undefined> {
    const val = await this.implementation.getString(key);

    if (val == null || val === "undefined" || val === "null") {
      return undefined;
    }

    return JSON.parse(val);
  }

  async setString(key: string, value: string) {
    await this.implementation.setString(key, value);
  }

  async getString(key: string): Promise<string | undefined> {
    const val = await this.implementation.getString(key);

    if (val == null) {
      return undefined;
    }

    return val;
  }

  createJsonGetterSetter<T>(key: string): IStorageKeyGetterAndSetter<T> {
    return {
      get: () => this.getJson(key),
      set: (value: T) => this.setJson(key, value),
    };
  }

  createStringGetterSetter(key: string): IStorageKeyGetterAndSetter<string> {
    return {
      get: () => this.getString(key),
      set: (value: string) => this.setString(key, value),
    };
  }
}

interface IStateAdapter_Sync {
  getString: (key: string) => string | null | undefined;
  setString: (key: string, value: string) => void;
  clear: (key: string) => void;
}

export interface IStorageKeyGetterAndSetter_Sync<T> {
  get: () => T | undefined;
  set: (value: T) => void;
}

export class EnvironmentStateAdapter_Sync {
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
