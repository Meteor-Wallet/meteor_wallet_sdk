import { describe, expect, it } from "bun:test";
import type { IEnumerableLocalStorageInterface } from "../../../ported_common/utils/storage/storage.types";
import { StorageBakeryBridgeLeaseProvider } from "./mobileBridgeLease";
import { createMobileBridgeStorage } from "./mobileBridgeStorage";

function memoryStorage(): IEnumerableLocalStorageInterface {
  const values = new Map<string, string>();
  return {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => void values.set(key, value),
    removeItem: async (key) => void values.delete(key),
    getKeys: async (prefix) =>
      [...values.keys()].filter((key) => prefix == null || key.startsWith(prefix)),
  };
}

describe("Meteor mobile bridge coordination", () => {
  it("serializes contenders with unique bakery registers", async () => {
    const storage = memoryStorage();
    const firstProvider = new StorageBakeryBridgeLeaseProvider(storage);
    const secondProvider = new StorageBakeryBridgeLeaseProvider(storage);
    const first = await firstProvider.acquire("identity");
    let secondAcquired = false;
    const secondPromise = secondProvider.acquire("identity").then((lease) => {
      secondAcquired = true;
      return lease;
    });

    await new Promise((resolve) => setTimeout(resolve, 75));
    expect(secondAcquired).toBe(false);
    await first.release();
    const second = await secondPromise;
    expect(secondAcquired).toBe(true);
    await second.assertOwned();
    await second.release();
  });

  it("isolates backend environments and expires live-session records on stop", async () => {
    const storage = memoryStorage();
    const production = createMobileBridgeStorage(storage, "https://bridge.example/");
    const development = createMobileBridgeStorage(storage, "https://dev.bridge.example/");
    expect(production.environmentId).not.toBe(development.environmentId);

    await production.setFencingGeneration(4);
    expect(await production.getFencingGeneration()).toBe(4);
    expect(await development.getFencingGeneration()).toBe(0);

    const session = await production.registerLiveSession("tab-a");
    expect(await production.hasOtherLiveSessions()).toBe(true);
    expect(await production.hasOtherLiveSessions("tab-a")).toBe(false);
    await session.stop();
    expect(await production.hasOtherLiveSessions()).toBe(false);
  });

  it("comprehensive reset enumerates the namespace instead of trusting indexes", async () => {
    const storage = memoryStorage();
    const context = createMobileBridgeStorage(storage, "https://bridge.example");
    await storage.setItem(`${context.rootPrefix}paired_wallets::record`, "paired");
    await storage.setItem(`${context.rootPrefix}bridge_create_channel::record`, "channel");
    await storage.setItem("unrelated", "keep");

    await context.clearIdentityStorage();

    expect(await storage.getKeys(context.rootPrefix)).toEqual([]);
    expect(await storage.getItem("unrelated")).toBe("keep");
  });
});
