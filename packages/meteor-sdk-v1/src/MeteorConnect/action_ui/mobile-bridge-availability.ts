import type { IMobileBridgeSnapshot } from "../target_clients/mobile_bridge/MobileBridgeSession";

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
