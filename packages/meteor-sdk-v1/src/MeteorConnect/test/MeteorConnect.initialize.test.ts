import { describe, expect, it } from "bun:test";
import { create_bun_test_local_storage } from "../../ported_common/utils/storage/bun_test/create_bun_test_local_storage";
import type { ILocalStorageInterface } from "../../ported_common/utils/storage/storage.types";
import { MeteorConnect } from "../MeteorConnect";

/**
 * REVIEW-consumer-implementation H-01: a rejected `MeteorConnect.initialize()` used to be sticky.
 * `initializePromise` was cached before the attempt and never cleared on rejection, so every later
 * caller got the same rejected promise back and the only recovery was `disposeMobileBridge()` or a
 * page reload. The nested mobile-bridge client already rearmed its own; the top-level client did
 * not, and MNW's `.catch()` on its own wrapper could not help because the retry re-entered the
 * same `MeteorConnect` instance.
 */

/**
 * Storage whose first `n` writes fail, standing in for a transient storage/coordination fault
 * (quota pressure, a lock the host could not take, a cross-tab race).
 */
function createFlakyStorage(failWrites: number): {
  storage: ILocalStorageInterface;
  writeAttempts: () => number;
} {
  const inner = create_bun_test_local_storage();
  let attempts = 0;
  return {
    writeAttempts: () => attempts,
    storage: {
      getItem: (key) => inner.getItem(key),
      removeItem: (key) => inner.removeItem(key),
      setItem: async (key, value) => {
        attempts += 1;
        if (attempts <= failWrites) {
          throw new Error("transient_storage_failure");
        }
        await inner.setItem(key, value);
      },
    },
  };
}

describe("MeteorConnect.initialize failure rearm", () => {
  it("retries successfully on the same instance after a transient failure", async () => {
    const { storage, writeAttempts } = createFlakyStorage(1);
    const meteorConnect = new MeteorConnect({ isDev: true });
    meteorConnect.setLoggingLevel("none");

    await expect(meteorConnect.initialize({ storage })).rejects.toThrow(
      "transient_storage_failure",
    );
    expect(writeAttempts()).toBe(1);

    // The retry must start a NEW attempt, not replay the cached rejection.
    await meteorConnect.initialize({ storage });
    expect(writeAttempts()).toBe(2);

    const lastInitialized = await storage.getItem("met_data_lastInitialized");
    expect(lastInitialized).not.toBeNull();
  });

  it("coalesces concurrent callers onto one attempt, and rearms once for all of them", async () => {
    const { storage, writeAttempts } = createFlakyStorage(1);
    const meteorConnect = new MeteorConnect({ isDev: true });
    meteorConnect.setLoggingLevel("none");

    const first = meteorConnect.initialize({ storage });
    const second = meteorConnect.initialize({ storage });

    const results = await Promise.allSettled([first, second]);
    expect(results.map((r) => r.status)).toEqual(["rejected", "rejected"]);
    // One shared attempt, not one per caller.
    expect(writeAttempts()).toBe(1);

    await meteorConnect.initialize({ storage });
    expect(writeAttempts()).toBe(2);
  });

  it("still coalesces concurrent callers on the success path", async () => {
    const { storage, writeAttempts } = createFlakyStorage(0);
    const meteorConnect = new MeteorConnect({ isDev: true });
    meteorConnect.setLoggingLevel("none");

    await Promise.all([
      meteorConnect.initialize({ storage }),
      meteorConnect.initialize({ storage }),
      meteorConnect.initialize({ storage }),
    ]);

    // `initialize()` is `async`, so each call returns its own wrapper promise even when they share
    // the cached attempt — count the work instead of comparing identities.
    expect(writeAttempts()).toBe(1);
  });

  it("keeps refusing a mismatched configuration after a failure that already bound the instance", async () => {
    const { storage } = createFlakyStorage(1);
    const meteorConnect = new MeteorConnect({ isDev: true });
    meteorConnect.setLoggingLevel("none");

    await expect(meteorConnect.initialize({ storage })).rejects.toThrow(
      "transient_storage_failure",
    );

    // The write-once storage/key-store properties already hold the first call's objects, so a
    // retry with a different storage implementation must be refused rather than silently reusing
    // the original adapters.
    await expect(
      meteorConnect.initialize({ storage: create_bun_test_local_storage() }),
    ).rejects.toThrow("mobile_bridge_config_mismatch");

    // ...and the original configuration still retries cleanly.
    await meteorConnect.initialize({ storage });
  });
});
