import { afterEach, describe, expect, it } from "bun:test";
import {
  canOpenAppWithoutNewTap,
  type ISameDeviceAutoOpenEligibility,
  isSameDeviceAutoOpenEligible,
  waitForPageToHide,
} from "./mobileAppAutoOpen";

const ELIGIBLE: ISameDeviceAutoOpenEligibility = {
  enabled: true,
  hostSuppliedOpener: false,
  actionId: "near::sign_message",
  transferTargetPlatform: undefined,
  pushWalletVerifyPublicKey: "ed25519::raw_base64::d2FsbGV0",
  mobileDevice: true,
  knownOnThisDevice: true,
};

describe("same-device auto-open eligibility", () => {
  it("is eligible only when every condition holds", () => {
    expect(isSameDeviceAutoOpenEligible(ELIGIBLE)).toBeTrue();
  });

  const blockers: Array<[string, Partial<ISameDeviceAutoOpenEligibility>]> = [
    ["the host opted out", { enabled: false }],
    ["the host supplied its own (tap-driven) opener", { hostSuppliedOpener: true }],
    [
      "the request is a transfer",
      { actionId: "meteor_wallet_core::new_key_account_transfer_start" },
    ],
    ["a transfer platform is targeted", { transferTargetPlatform: "mobile" }],
    [
      "the account has no paired wallet (sign-in, or a stale pairing)",
      { pushWalletVerifyPublicKey: undefined },
    ],
    ["the device is not a phone", { mobileDevice: false }],
    ["this browser never opened that wallet's app", { knownOnThisDevice: false }],
  ];
  for (const [reason, override] of blockers) {
    it(`is not eligible when ${reason}`, () => {
      expect(isSameDeviceAutoOpenEligible({ ...ELIGIBLE, ...override })).toBeFalse();
    });
  }
});

/** Bun has no DOM: the minimum `document`/`window`/`navigator` these helpers read. */
function installPage(input: { visibility?: DocumentVisibilityState; activation?: boolean | null }) {
  const listeners = new Map<string, Set<() => void>>();
  const on = (type: string, listener: () => void) => {
    const set = listeners.get(type) ?? new Set<() => void>();
    set.add(listener);
    listeners.set(type, set);
  };
  const off = (type: string, listener: () => void) => listeners.get(type)?.delete(listener);
  const page = {
    document: {
      visibilityState: input.visibility ?? "visible",
      addEventListener: on,
      removeEventListener: off,
    },
    window: { addEventListener: on, removeEventListener: off },
    navigator: {
      userAgent: "iPhone",
      ...(input.activation === null
        ? {}
        : { userActivation: { isActive: input.activation ?? true } }),
    },
  };
  const originals = (["document", "window", "navigator"] as const).map(
    (key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const,
  );
  for (const [key, value] of Object.entries(page)) {
    Object.defineProperty(globalThis, key, { configurable: true, value });
  }
  restorePage = () => {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  };
  return {
    page,
    fire(type: string) {
      for (const listener of [...(listeners.get(type) ?? [])]) listener();
    },
    listenerCount: () => [...listeners.values()].reduce((total, set) => total + set.size, 0),
  };
}

let restorePage: (() => void) | undefined;
afterEach(() => {
  restorePage?.();
  restorePage = undefined;
});

describe("opening without a new tap", () => {
  it("is allowed only in the foreground with the starting tap still live", () => {
    installPage({ visibility: "visible", activation: true });
    expect(canOpenAppWithoutNewTap()).toBeTrue();
  });

  it("is refused once the tap's activation has lapsed", () => {
    installPage({ activation: false });
    expect(canOpenAppWithoutNewTap()).toBeFalse();
  });

  it("is refused where activation cannot be observed at all", () => {
    installPage({ activation: null });
    expect(canOpenAppWithoutNewTap()).toBeFalse();
  });

  it("is refused while the page is in the background", () => {
    installPage({ visibility: "hidden" });
    expect(canOpenAppWithoutNewTap()).toBeFalse();
  });
});

describe("confirming the app came up", () => {
  it("confirms when the page goes to the background, and cleans up its listeners", async () => {
    const harness = installPage({});
    const confirmed = waitForPageToHide(1_000);
    harness.page.document.visibilityState = "hidden";
    harness.fire("visibilitychange");
    expect(await confirmed).toBeTrue();
    expect(harness.listenerCount()).toBe(0);
  });

  it("does not take pagehide alone as the app coming up", async () => {
    // A browser's own "cannot open" error page fires pagehide without any app switch.
    const harness = installPage({});
    const confirmed = waitForPageToHide(20);
    harness.fire("pagehide");
    expect(await confirmed).toBeFalse();
  });

  it("gives up when the page stays in the foreground", async () => {
    const harness = installPage({});
    expect(await waitForPageToHide(20)).toBeFalse();
    expect(harness.listenerCount()).toBe(0);
  });
});
