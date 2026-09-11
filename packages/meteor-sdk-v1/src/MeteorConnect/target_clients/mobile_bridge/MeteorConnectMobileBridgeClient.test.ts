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
    extension?: boolean;
    backendUrl?: string;
    meteorAppId?: EMeteorAppId.meteor_wallet_mobile | EMeteorAppId.meteor_wallet_mobile_dev;
  }) => {
    const client = new MeteorConnectMobileBridgeClient({} as unknown as MeteorConnect);
    if (input.extension) {
      (client as any).currentTransferTargetPlatform = "extension";
    }
    const opened: string[] = [];
    const windowOpened: string[] = [];
    const windowFeatures: Array<string | undefined> = [];
    (client as unknown as { config?: unknown }).config = {
      enabled: true,
      backendUrl: input.backendUrl ?? "https://mc.meteorwallet.app",
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

  it("opens extension transfers through the injected transport, never a browser popup", async () => {
    const harness = prepare({
      selectedLink: { linkString: WEB_LINK, linkType: EBridgeLinkType.web_app_url },
      presentedLink: `${WEB_LINK}#partnerSecret=abc`,
      extension: true,
      backendUrl: "https://meteor-connect-backend-development.meteorwallet.workers.dev",
    });
    const requests: any[] = [];
    try {
      (window as any).meteorCom = {
        features: ["new_key_transfer"],
        directAction: async (data: unknown) => {
          requests.push(data);
          return { opened: true };
        },
      };
      await harness.client.openCurrentSessionInApp();
      expect(requests).toEqual([
        { actionType: "open_meteor_connect", inputs: { link: `${WEB_LINK}#partnerSecret=abc&backendUrl=https%3A%2F%2Fmeteor-connect-backend-development.meteorwallet.workers.dev` } },
      ]);
      expect(harness.windowOpened).toEqual([]);
      expect(harness.opened).toEqual([]);
    } finally {
      delete (window as any).meteorCom;
      harness.restore();
    }
  });

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

describe("extension new-key transfer handoff", () => {
  it("detects capability support and fails closed on old extensions or refused popups", async () => {
    const { isExtensionNewKeyTransferAvailable, openExtensionNewKeyTransfer } = await import(
      "../../utils/extensionNewKeyTransfer"
    );
    const previous = globalThis.window;
    try {
      (globalThis as any).window = {
        meteorCom: { directAction: async () => ({ opened: true }), features: ["open_page"] },
      };
      expect(isExtensionNewKeyTransferAvailable()).toBe(false);
      await expect(openExtensionNewKeyTransfer("unused", "https://mc.meteorwallet.app")).rejects.toThrow(
        "extension_update_required",
      );
      const calls: unknown[] = [];
      (window as any).meteorCom = {
        features: ["new_key_transfer"],
        directAction: async (data: unknown) => {
          calls.push(data);
          return { opened: false };
        },
      };
      expect(isExtensionNewKeyTransferAvailable()).toBe(true);
      const link = "https://wallet.meteorwallet.app/b?f=s2&l=lease#s=secret";
      await expect(openExtensionNewKeyTransfer(link, "https://mc.meteorwallet.app")).rejects.toThrow("extension_popup_failed");
      expect(calls).toEqual([{ actionType: "open_meteor_connect", inputs: { link: `${link}&backendUrl=https%3A%2F%2Fmc.meteorwallet.app` } }]);
    } finally {
      if (previous == null) delete (globalThis as any).window;
      else (globalThis as any).window = previous;
    }
  });
});

describe("extension legacy NEAR compatibility", () => {
  it("keeps legacy NEAR targets available without requiring the new transfer capability", async () => {
    const { MeteorConnectV1Client } = await import("../v1_client/MeteorConnectV1Client");
    const previous = globalThis.window;
    try {
      (globalThis as any).window = {
        meteorComV2: { featureFlags: ["near::sign_in_and_sign_message"] },
      };
      const client = new MeteorConnectV1Client({
        storage: { getJsonOrDef: async (_key: string, fallback: unknown) => fallback },
      } as unknown as MeteorConnect);
      for (const id of [
        "near::sign_in",
        "near::sign_in_and_sign_message",
        "near::sign_message",
        "near::sign_transactions",
        "near::sign_delegate_actions",
        "near::verify_owner",
        "near::sign_out",
      ]) {
        const targets = await client.getExecutionTargetConfigs({ id } as any);
        expect(targets.map((target) => target.executionTarget)).toContain("v1_ext");
      }
      expect(
        await client.getExecutionTargetConfigs({
          id: "meteor_wallet_core::new_key_account_transfer_start",
        } as any),
      ).toEqual([]);
    } finally {
      if (previous == null) delete (globalThis as any).window;
      else (globalThis as any).window = previous;
    }
  });

  it("refuses NEAR and secret-key transfers through the extension bridge destination", async () => {
    const client = new MeteorConnectMobileBridgeClient({} as unknown as MeteorConnect);
    for (const id of [
      "near::sign_in",
      "near::sign_transactions",
      "meteor_wallet_core::transfer_accounts",
    ]) {
      await expect(
        client.prepareRequest({ id } as any, undefined, {
          transferTargetPlatform: "extension",
        }),
      ).rejects.toThrow("extension_transfer_action_unsupported");
    }
  });
});
