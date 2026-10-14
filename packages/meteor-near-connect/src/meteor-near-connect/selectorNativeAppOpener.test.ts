import { describe, expect, it } from "bun:test";
import {
  createSelectorNativeAppOpener,
  SELECTOR_NATIVE_OPENER_REFUSED,
  SELECTOR_NATIVE_OPENER_UNAVAILABLE,
} from "./selectorNativeAppOpener";

const LINK = "meteorwallet://b?f=s2&l=abc#s=xyz";

describe("NEAR Connect sandbox native app opener", () => {
  it("asks the host to open the link synchronously from the tap, as a top-level window.open", async () => {
    const calls: Array<{ url: string; target?: boolean | string; features?: string }> = [];
    const opener = createSelectorNativeAppOpener(() => ({
      open: (url, target, features) => {
        calls.push({ url, target, features });
        return { windowIdPromise: Promise.resolve("window-1") };
      },
    }));

    const attempt = opener.open(LINK);

    // The request must leave the sandbox inside the user-activation window, not after an await.
    expect(calls).toEqual([{ url: LINK, target: "_blank", features: undefined }]);
    await expect(attempt).resolves.toBeUndefined();
  });

  it("does not treat a host that returned no window as a failure", async () => {
    // Mobile browsers hand custom-scheme opens to the OS and may return no window although the
    // app launched; only the host's refusal is a failure the UI should report.
    const opener = createSelectorNativeAppOpener(() => ({
      open: () => ({ windowIdPromise: Promise.resolve(null) }),
    }));
    const warnings: unknown[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => void warnings.push(args);
    try {
      await expect(opener.open(LINK)).resolves.toBeUndefined();
    } finally {
      console.warn = originalWarn;
    }
    expect(warnings.length).toBe(1);
  });

  it("surfaces the host's refusal (allowsOpen denied) instead of pretending the app was opened", async () => {
    const opener = createSelectorNativeAppOpener(() => ({
      open: () => ({ windowIdPromise: Promise.reject("Permission denied") }),
    }));

    await expect(opener.open(LINK)).rejects.toThrow(
      `${SELECTOR_NATIVE_OPENER_REFUSED}: Permission denied`,
    );
  });

  it("fails closed when the host exposes no open proxy", () => {
    const opener = createSelectorNativeAppOpener(() => ({}));
    expect(() => opener.open(LINK)).toThrow(SELECTOR_NATIVE_OPENER_UNAVAILABLE);
    const absent = createSelectorNativeAppOpener(() => undefined);
    expect(() => absent.open(LINK)).toThrow(SELECTOR_NATIVE_OPENER_UNAVAILABLE);
  });
});
