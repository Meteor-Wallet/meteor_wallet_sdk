import { EnvironmentStateAdapter } from "./EnvironmentStorageUtils";

export const createBrowserLocalStorageStateAdapter = () =>
  new EnvironmentStateAdapter({
    getString: async (key: string) => window.localStorage.getItem(key),
    setString: async (key: string, value: string) => window.localStorage.setItem(key, value),
  });

export const createBrowserSessionStorageStateAdapter = () =>
  new EnvironmentStateAdapter({
    getString: async (key: string) => window.sessionStorage.getItem(key),
    setString: async (key: string, value: string) => window.sessionStorage.setItem(key, value),
  });
