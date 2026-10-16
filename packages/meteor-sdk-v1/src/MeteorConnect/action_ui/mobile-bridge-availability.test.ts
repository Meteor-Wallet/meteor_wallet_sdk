import { describe, expect, it } from "bun:test";
import type { IMobileBridgeSnapshot } from "../target_clients/mobile_bridge/MobileBridgeSession";
import {
  isMobileBridgeQuietlyUnavailable,
  mobileBridgeRetryableFailure,
} from "./mobile-bridge-availability";

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

/** The exact snapshot the 2026-10-16 production allocation halt produced. */
const refusedAtCreation = snapshotOf({
  phase: "failed",
  failedFromPhase: "creating_bridge",
  errorKind: "bridge",
  errorIds: ["allocation_halted"],
  errorHeadline: "New bridge allocation is temporarily halted; retry later",
  errorDetail:
    "A typed bridge-level rejection (allocation, lease, or transport authorization). Check the ids against the bridge error catalogue; most are not retryable as-is.",
  error: "New bridge allocation is temporarily halted; retry later",
});
const DEEP_LINK = "https://wallet.example/b?f=s2#s=secret";

describe("mobileBridgeRetryableFailure", () => {
  it("offers a fresh request when the QR was never created", () => {
    expect(mobileBridgeRetryableFailure(refusedAtCreation)).toBe("not_created");
  });

  it("decides by the phase the failure interrupted, never by the error", () => {
    for (const errorKind of ["terminal", "session", "bridge", "connection", "local", "unknown"] as const) {
      expect(mobileBridgeRetryableFailure({ ...refusedAtCreation, errorKind })).toBe("not_created");
    }
    expect(
      mobileBridgeRetryableFailure(snapshotOf({ phase: "failed", failedFromPhase: "initializing" })),
    ).toBe("not_created");
  });

  it("reads a link that stopped working before any wallet picked it up as expired", () => {
    expect(
      mobileBridgeRetryableFailure(
        snapshotOf({
          phase: "failed",
          failedFromPhase: "waiting_for_wallet",
          deepLink: DEEP_LINK,
          error: "mobile_bridge_expired",
        }),
      ),
    ).toBe("expired");
  });

  it("leaves a failure a wallet already took part in to its own copy", () => {
    for (const failedFromPhase of [
      "busy_other_tab",
      "wallet_confirmation",
      "wallet_verification",
      "wallet_action",
      "result_ready",
      "external_work",
    ] as const) {
      expect(
        mobileBridgeRetryableFailure(
          snapshotOf({ phase: "failed", failedFromPhase, deepLink: DEEP_LINK }),
        ),
      ).toBeUndefined();
    }
  });

  it("is never retryable without a recorded failure, or when it has its own remedy screen", () => {
    expect(mobileBridgeRetryableFailure(undefined)).toBeUndefined();
    expect(
      mobileBridgeRetryableFailure(
        snapshotOf({ phase: "cancelled", failedFromPhase: "waiting_for_wallet" }),
      ),
    ).toBeUndefined();
    // A snapshot from before the phase was recorded makes no claim either way.
    expect(mobileBridgeRetryableFailure(snapshotOf({ phase: "failed" }))).toBeUndefined();
    expect(
      mobileBridgeRetryableFailure({ ...refusedAtCreation, identityResetRequired: true }),
    ).toBeUndefined();
  });
});
