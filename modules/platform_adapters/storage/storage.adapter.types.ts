export interface IStorageAdapter {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  getJson: <T>(key: string) => Promise<T | null>;
  setJson: <T>(key: string, value: T) => Promise<void>;
}
