import { type ILocalStorageInterface } from "./storage.types";

export interface IStorageKeyGetterAndSetter<T> {
  get: () => Promise<T | undefined>;
  set: (value: T) => Promise<void>;
}

export class CEnvironmentStorageAdapter {
  private implementation: ILocalStorageInterface;

  constructor(implementation: ILocalStorageInterface) {
    this.implementation = implementation;
  }

  async removeItem(key: string) {
    await this.implementation.removeItem(key);
  }

  async setJson(key: string, value: any) {
    await this.implementation.setItem(key, JSON.stringify(value));
  }

  async getJson<T>(key: string): Promise<T | undefined> {
    const val = await this.implementation.getItem(key);

    if (val == null || val === "undefined" || val === "null") {
      return undefined;
    }

    return JSON.parse(val);
  }

  async setString(key: string, value: string) {
    await this.implementation.setItem(key, value);
  }

  async getString(key: string): Promise<string | undefined> {
    const val = await this.implementation.getItem(key);

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
