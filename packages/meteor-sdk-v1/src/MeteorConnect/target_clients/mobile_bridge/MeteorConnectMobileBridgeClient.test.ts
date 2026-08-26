import { describe, expect, it } from "bun:test";
import { EBridgeLinkType, EMeteorAppId } from "@meteorwallet/connect-shared";
import type { MeteorConnect } from "../../MeteorConnect";
import { MeteorConnectMobileBridgeClient } from "./MeteorConnectMobileBridgeClient";
import type { MobileBridgeSession } from "./MobileBridgeSession";

describe("MeteorConnectMobileBridgeClient session lifecycle", () => {
  it("fences an abandoned current session before asynchronous disposal finishes", async () => {
    const client = new MeteorConnectMobileBridgeClient({} as unknown as MeteorConnect);
    let finishDisposal!: () => void;
    const disposal = new Promise<void>((resolve) => {
      finishDisposal = resolve;
    });
    const session = { dispose: () => disposal };
    (client as unknown as { currentSession?: unknown }).currentSession = session;
    (client as unknown as { currentToken?: string }).currentToken = "abandoned-session";

    const release = client.releaseSession(session as unknown as MobileBridgeSession);

    expect(client.getCurrentSession()).toBeUndefined();
    expect((client as unknown as { currentToken?: string }).currentToken).toBeUndefined();
    finishDisposal();
    await release;
  });
});

/**
 * The open-in-app allowlist. Both link types are gated on the exact backend-issued `linkString`
 * from the SELECTED wallet link — never on `config.meteorAppId`, which names the configured mobile
 * wallet rather than the wallet this particular session actually targets.
 */
describe("MeteorConnectMobileBridgeClient open-in-app allowlist", () => {
  const DEEP_LINK = "meteorwalletdev://bridge_request?linkFormat=s1&bridgeId=b1";
  const WEB_LINK = "https://wallet-dev.meteorwallet.app/bridge_request?linkFormat=s1&bridgeId=b1";

  const prepare = (input: {
    selectedLink: { linkString: string; linkType: EBridgeLinkType };
    presentedLink: string;
    meteorAppId?: EMeteorAppId.meteor_wallet_mobile | EMeteorAppId.meteor_wallet_mobile_dev;
  }) => {
    const client = new MeteorConnectMobileBridgeClient({} as unknown as MeteorConnect);
    const opened: string[] = [];
    const windowOpened: string[] = [];
    const windowFeatures: Array<string | undefined> = [];
    (client as unknown as { config?: unknown }).config = {
      enabled: true,
      meteorAppId: input.meteorAppId ?? EMeteorAppId.meteor_wallet_mobile,
      nativeAppOpener: { open: (link: string) => opened.push(link) },
    };
    (client as unknown as { currentSession?: unknown }).currentSession = {
      getSelectedWalletLink: () => input.selectedLink,
      openInApp: (open: (link: string) => void) => open(input.presentedLink),
    };
    const originalOpen = globalThis.window?.open;
    if (globalThis.window == null) {
      (globalThis as { window?: unknown }).window = {
        open: (link: string, _target?: string, features?: string) => {
          windowOpened.push(link);
          windowFeatures.push(features);
        },
      };
    } else {
      globalThis.window.open = ((link: string, _target?: string, features?: string) => {
        windowOpened.push(link);
        windowFeatures.push(features);
        return null;
      }) as typeof globalThis.window.open;
    }
    const restore = () => {
      if (originalOpen == null) delete (globalThis as { window?: unknown }).window;
      else globalThis.window.open = originalOpen;
    };
    return { client, opened, windowOpened, windowFeatures, restore };
  };

  it("opens a deep link whose scheme comes from the selected link, not the configured app id", () => {
    // The configured app id is the PROD mobile wallet, while this session targets the dev wallet.
    // The old scheme-from-config rule refused this; the link-derived allowlist accepts it.
    const harness = prepare({
      selectedLink: { linkString: DEEP_LINK, linkType: EBridgeLinkType.app_deep_link },
      presentedLink: `${DEEP_LINK}#partnerSecret=abc`,
      meteorAppId: EMeteorAppId.meteor_wallet_mobile,
    });
    try {
      harness.client.openCurrentSessionInApp();
      expect(harness.opened).toEqual([`${DEEP_LINK}#partnerSecret=abc`]);
    } finally {
      harness.restore();
    }
  });

  it("refuses a link that does not extend the backend-issued wallet link", () => {
    const harness = prepare({
      selectedLink: { linkString: DEEP_LINK, linkType: EBridgeLinkType.app_deep_link },
      presentedLink: "meteorwallet://evil?bridgeId=b1#partnerSecret=abc",
    });
    try {
      expect(() => harness.client.openCurrentSessionInApp()).toThrow(
        "mobile_bridge_native_scheme_not_allowed",
      );
      expect(harness.opened).toEqual([]);
    } finally {
      harness.restore();
    }
  });

  it("refuses a non-Meteor scheme even when the selected link agrees with it", () => {
    const hostile = "javascript://bridge_request?bridgeId=b1";
    const harness = prepare({
      selectedLink: { linkString: hostile, linkType: EBridgeLinkType.app_deep_link },
      presentedLink: `${hostile}#partnerSecret=abc`,
    });
    try {
      expect(() => harness.client.openCurrentSessionInApp()).toThrow(
        "mobile_bridge_native_scheme_not_allowed",
      );
      expect(harness.opened).toEqual([]);
    } finally {
      harness.restore();
    }
  });

  it("opens a web wallet link as a sized popup window and refuses a non-http(s) one", () => {
    const web = prepare({
      selectedLink: { linkString: WEB_LINK, linkType: EBridgeLinkType.web_app_url },
      presentedLink: `${WEB_LINK}#partnerSecret=abc`,
    });
    try {
      web.client.openCurrentSessionInApp();
      expect(web.windowOpened).toEqual([`${WEB_LINK}#partnerSecret=abc`]);
      // Same sized wallet popup the regular V1 web actions open (MeteorPostMessenger geometry);
      // centering coordinates are absent here because the test window has no screen metrics.
      expect(web.windowFeatures).toEqual(["popup=1,width=390,height=650,noopener"]);
    } finally {
      web.restore();
    }

    const spoofed = "file:///etc/passwd";
    const hostile = prepare({
      selectedLink: { linkString: spoofed, linkType: EBridgeLinkType.web_app_url },
      presentedLink: `${spoofed}#partnerSecret=abc`,
    });
    try {
      expect(() => hostile.client.openCurrentSessionInApp()).toThrow(
        "mobile_bridge_native_scheme_not_allowed",
      );
      expect(hostile.windowOpened).toEqual([]);
    } finally {
      hostile.restore();
    }
  });
});
