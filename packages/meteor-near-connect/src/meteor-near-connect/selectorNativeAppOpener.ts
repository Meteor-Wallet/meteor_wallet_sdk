import type { IMeteorConnectNativeAppOpener } from "@meteorwallet/sdk";

/**
 * The slice of NEAR Connect's sandbox `window.selector` the opener needs. `open` is the sandbox's
 * proxy for `window.open`: it asks the HOST page to open the URL and returns a proxy window whose
 * `windowIdPromise` settles when the host has answered (a window id, `null` when the host's
 * `window.open` returned nothing, or a rejection such as "Permission denied").
 */
export interface ISelectorOpenHost {
  open?: (
    url: string,
    target?: boolean | string,
    features?: string,
  ) => { windowIdPromise: Promise<string | null> };
}

export const SELECTOR_NATIVE_OPENER_UNAVAILABLE = "mobile_bridge_native_opener_unavailable";
export const SELECTOR_NATIVE_OPENER_REFUSED = "mobile_bridge_native_opener_refused";

/**
 * Opens the Meteor Mobile deep link from inside the NEAR Connect sandbox.
 *
 * The executor runs in an iframe sandboxed to `allow-scripts`: it can neither navigate the top frame
 * nor open windows itself, so the host page has to open the link. NEAR Connect offers two routes:
 *
 * - `openNativeApp` loads the link in a hidden iframe. iOS Safari (since 9.2) and Chrome for Android
 *   (since 25) refuse to launch an app from an iframe load, so on a phone it silently does nothing.
 * - `open` runs `window.open` in the top-level frame. The tap that reached this sandbox also
 *   activated every ancestor frame (HTML "activation notification"), so the host still holds the
 *   user activation the browser requires to launch an app — the same way a tapped link does.
 *
 * This opener takes the second route, and it calls `open` synchronously from the tap so the request
 * leaves this frame inside the activation window. The host checks the URL against the manifest's
 * `allowsOpen` list; a refusal arrives as a rejection and is surfaced to the SDK as an error rather
 * than being treated as an attempt, so the UI can say the wallet could not be opened instead of
 * waiting for a wallet that was never reached.
 *
 * A `null` window id (the host's `window.open` returned nothing) is deliberately NOT a failure:
 * mobile browsers hand a custom-scheme open straight to the OS and may return no window even when
 * the app launched. It is logged for diagnosis only.
 */
export function createSelectorNativeAppOpener(
  getSelector: () => ISelectorOpenHost | undefined,
): IMeteorConnectNativeAppOpener {
  return {
    open: (fullLink: string): Promise<void> => {
      const selector = getSelector();
      if (selector == null || typeof selector.open !== "function") {
        throw new Error(SELECTOR_NATIVE_OPENER_UNAVAILABLE);
      }
      const proxyWindow = selector.open(fullLink, "_blank");
      return proxyWindow.windowIdPromise.then(
        (windowId) => {
          if (windowId == null) {
            console.warn(
              "[MeteorWallet NEAR Connect] The host opened the Meteor Mobile link without returning a window; if the app did not open, use the QR code.",
            );
          }
        },
        (reason: unknown) => {
          throw new Error(`${SELECTOR_NATIVE_OPENER_REFUSED}: ${describeHostReason(reason)}`);
        },
      );
    },
  };
}

function describeHostReason(reason: unknown): string {
  if (typeof reason === "string") return reason;
  if (reason instanceof Error) return reason.message;
  try {
    return JSON.stringify(reason) ?? String(reason);
  } catch {
    return String(reason);
  }
}
