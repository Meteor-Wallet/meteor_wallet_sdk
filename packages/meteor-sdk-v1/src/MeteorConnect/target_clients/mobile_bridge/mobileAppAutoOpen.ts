/**
 * Same-device auto-open: opening Meteor Mobile for a request from an account signed in with it,
 * without waiting for the "Open Meteor Mobile" tap.
 *
 * A web page may only open an app inside the activation window of a real user tap (Chrome keeps
 * it ~5s; WebKit documents the same, but can be shorter in practice). The tap that started the
 * request — "Sign message" in the dApp — is that gesture, so the link has to be opened while it is
 * still live, after the bridge session (and so the link) has been created.
 *
 * Everything here is conservative by construction: anything uncertain means "do not try", and a
 * request that is not auto-opened behaves exactly as before — push notification plus Open button.
 */

/**
 * How long an automatic open waits for the page to go to the background before treating the
 * attempt as not taken. A real app switch hides the page well inside this; the push notification
 * is held for at most this long, and only when an attempt was actually made.
 */
export const AUTO_OPEN_CONFIRMATION_MS = 1_500;

export interface ISameDeviceAutoOpenEligibility {
  /** `mobileBridge.autoOpenPairedWallet` — opt-out, default on. */
  enabled: boolean;
  /**
   * A host-supplied `nativeAppOpener` is defined as tap-driven ("must synchronously attempt the
   * link from the originating click") and may route through a frame that never saw the tap, so
   * automatic opening only ever uses the SDK's own opener.
   */
  hostSuppliedOpener: boolean;
  /** Only NEAR account actions: transfers choose and manage their platform in their own popup. */
  actionId: string;
  transferTargetPlatform?: string;
  /** The paired wallet the account is bound to — present only for account-bound requests. */
  pushWalletVerifyPublicKey?: string;
  /** A phone. On desktop the wallet is necessarily another device (push + QR). */
  mobileDevice: boolean;
  /**
   * This browser has opened that wallet's app before and seen it claim — without it, the app may
   * be on a different phone, where an iOS attempt surfaces an "address is invalid" alert.
   */
  knownOnThisDevice: boolean;
}

export function isSameDeviceAutoOpenEligible(input: ISameDeviceAutoOpenEligibility): boolean {
  return (
    input.enabled &&
    !input.hostSuppliedOpener &&
    input.actionId.startsWith("near::") &&
    input.transferTargetPlatform == null &&
    input.pushWalletVerifyPublicKey != null &&
    input.mobileDevice &&
    input.knownOnThisDevice
  );
}

/**
 * Whether the page may open an app right now without a new tap: it is in the foreground and the
 * gesture that started the request is still live. Unknown (no `navigator.userActivation`, as on
 * older browsers) is a no.
 */
export function canOpenAppWithoutNewTap(): boolean {
  if (typeof document === "undefined" || typeof navigator === "undefined") return false;
  return document.visibilityState === "visible" && navigator.userActivation?.isActive === true;
}

/**
 * Resolves true once the page goes to the background (the app came to the foreground), or false
 * after `timeoutMs` — an attempt that was blocked, dismissed, or is still waiting on the
 * browser's own "Open in app?" confirmation.
 *
 * Visibility only, deliberately: `pagehide` also fires when a browser navigates to its own error
 * page for a scheme nothing handles, and reading that as success would skip the push.
 */
export function waitForPageToHide(timeoutMs: number): Promise<boolean> {
  if (typeof document === "undefined") return Promise.resolve(false);
  if (document.visibilityState === "hidden") return Promise.resolve(true);
  return new Promise<boolean>((resolve) => {
    const finish = (hidden: boolean) => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      resolve(hidden);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") finish(true);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    document.addEventListener("visibilitychange", onVisibilityChange);
  });
}
