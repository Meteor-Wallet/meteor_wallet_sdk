import { CEnvironmentStorageAdapter } from "../EnvironmentStorageAdapter.ts";
import type { ILocalStorageInterface } from "../storage.types.ts";

export const create_bun_test_local_storage: (
  initial?: Record<string, string | undefined>,
) => ILocalStorageInterface = (initial: Record<string, string | undefined> = {}) => {
  const storage: Record<string, string | undefined> = {
    ...initial,
  };

  return {
    getItem: async (key) => {
      return storage[key] ?? null;
    },
    setItem: async (key, value) => {
      storage[key] = value;
    },
    removeItem: async (key) => {
      storage[key] = undefined;
    },
  };
};

export function create_bun_test_local_storage_with_adapter(
  initial?: Record<string, string | undefined>,
): {
  storageInterface: ILocalStorageInterface;
  storage: CEnvironmentStorageAdapter;
} {
  const storageInterface = create_bun_test_local_storage(initial);

  return {
    storageInterface,
    storage: new CEnvironmentStorageAdapter(storageInterface),
  };
}
