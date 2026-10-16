import type {
  IMobileBridgeSnapshot,
  TMobileBridgePhase,
} from "../target_clients/mobile_bridge/MobileBridgeSession";

/**
 * Whether the Connect popup should leave the Meteor Mobile option out quietly instead of
 * rendering the mobile bridge's failure.
 *
 * A backend that cannot be reached — the classifier's `connection` kind: unreachable, answered by
 * something that is not a Meteor Connect backend, or refused the dial — is nothing the user can
 * fix from this screen, and while Meteor Web or the extension is on offer those still work. An
 * alarming error card in the "or connect with mobile" slot would only scare users off, so the
 * failure goes to the console instead. The decision is made against the typed `errorKind`,
 * never the error message.
 *
 * It is NOT quiet when the mobile bridge is the user's only way through (`otherWalletAvailable`
 * false: a mobile-only configuration, or a request locked to an account that lives in Meteor
 * Mobile), once a wallet has taken part in the request (`mobileEngaged`), or when the failure
 * carries its own remedy screen (`identityResetRequired`).
 */
export function isMobileBridgeQuietlyUnavailable(
  snapshot: IMobileBridgeSnapshot | undefined,
  input: { otherWalletAvailable: boolean; mobileEngaged: boolean },
): boolean {
  if (snapshot == null || !input.otherWalletAvailable || input.mobileEngaged) return false;
  if (snapshot.identityResetRequired === true) return false;
  return snapshot.phase === "failed" && snapshot.errorKind === "connection";
}

/** Phases in which no wallet has taken part in the request yet. */
const PRE_WALLET_PHASES: readonly TMobileBridgePhase[] = [
  "initializing",
  "creating_bridge",
  "waiting_for_wallet",
];

/**
 * `not_created`: the request's link — the QR — never existed. `expired`: it existed, but stopped
 * working before any wallet picked it up (to the user, every way that happens reads as expiry).
 */
export type TMobileBridgeRetryableFailure = "not_created" | "expired";

/**
 * How the mobile request failed, when it failed before any wallet took part in it — or undefined.
 *
 * Nothing was handed to a wallet in that case, so the one remedy is a fresh request, and the popup
 * offers exactly that ("Try Again") instead of the classifier's copy, which is written for
 * integrators and goes to the console (`reportMobileBridgeFailure`). Decided from the typed phase
 * the session failed in (`failedFromPhase`), never from the error message.
 *
 * Undefined for every other state: a failure a wallet was already part of keeps its own copy, and
 * the identity-reset screen keeps its own remedy.
 */
export function mobileBridgeRetryableFailure(
  snapshot: IMobileBridgeSnapshot | undefined,
): TMobileBridgeRetryableFailure | undefined {
  if (snapshot == null || snapshot.phase !== "failed") return undefined;
  if (snapshot.identityResetRequired === true) return undefined;
  if (snapshot.failedFromPhase == null || !PRE_WALLET_PHASES.includes(snapshot.failedFromPhase)) {
    return undefined;
  }
  return snapshot.deepLink == null ? "not_created" : "expired";
}

/** Console only — the classifier's headline and detail are written for the integrator. */
export function reportMobileBridgeFailure(summary: string, snapshot: IMobileBridgeSnapshot): void {
  const reason = [snapshot.errorHeadline, snapshot.errorDetail].filter((part) => part).join(" ");
  console.warn(`[MeteorConnect] ${summary} ${reason}`.trim(), snapshot.error);
}
