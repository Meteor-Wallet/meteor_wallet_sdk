import { describe, expect, it } from "bun:test";
import type { IMobileBridgeSnapshot } from "../target_clients/mobile_bridge/MobileBridgeSession";
import { isMobileBridgeQuietlyUnavailable } from "./mobile-bridge-availability";

const snapshotOf = (patch: Partial<IMobileBridgeSnapshot>): IMobileBridgeSnapshot => ({
  phase: "initializing",
  push: "not_attempted",
  linkPhase: "detached",
  linkRedialAttempt: 0,
  pinAttemptsUsed: 0,
  ...patch,
});

const backendUnreachable = snapshotOf({
  phase: "failed",
  errorKind: "connection",
  errorHeadline: "Could not reach https://bridge.example at all",
  error: "Failed to fetch",
});
const otherWalletOffered = { otherWalletAvailable: true, mobileEngaged: false };

describe("isMobileBridgeQuietlyUnavailable", () => {
  it("leaves the mobile option out quietly when the backend is unreachable and another wallet is on offer", () => {
    expect(isMobileBridgeQuietlyUnavailable(backendUnreachable, otherWalletOffered)).toBe(true);
  });

  it("still surfaces the failure when Meteor Mobile is the only way through", () => {
    expect(
      isMobileBridgeQuietlyUnavailable(backendUnreachable, {
        ...otherWalletOffered,
        otherWalletAvailable: false,
      }),
    ).toBe(false);
  });

  it("still surfaces the failure once a wallet has taken part in the request", () => {
    expect(
      isMobileBridgeQuietlyUnavailable(backendUnreachable, {
        ...otherWalletOffered,
        mobileEngaged: true,
      }),
    ).toBe(false);
  });

  it("decides by the typed kind: protocol rejections and local guards are never quiet", () => {
    for (const errorKind of ["terminal", "session", "bridge", "local", "unknown"] as const) {
      expect(
        isMobileBridgeQuietlyUnavailable(
          snapshotOf({ phase: "failed", errorKind }),
          otherWalletOffered,
        ),
      ).toBe(false);
    }
    expect(
      isMobileBridgeQuietlyUnavailable(snapshotOf({ phase: "failed" }), otherWalletOffered),
    ).toBe(false);
  });

  it("leaves a failure with its own remedy screen (identity reset) visible", () => {
    expect(
      isMobileBridgeQuietlyUnavailable(
        { ...backendUnreachable, identityResetRequired: true },
        otherWalletOffered,
      ),
    ).toBe(false);
  });

  it("is never quiet without a failed session", () => {
    expect(isMobileBridgeQuietlyUnavailable(undefined, otherWalletOffered)).toBe(false);
    expect(
      isMobileBridgeQuietlyUnavailable(snapshotOf({ phase: "cancelled" }), otherWalletOffered),
    ).toBe(false);
  });
});
