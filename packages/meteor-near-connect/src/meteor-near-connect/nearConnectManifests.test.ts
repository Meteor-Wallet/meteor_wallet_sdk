import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import SandboxExecutor from "@hot-labs/near-connect/build/SandboxedWallet/executor";
import { devManifest } from "../../../meteor-sdk-v1-test-web/app/pages/near-connect/dev-manifest";

/**
 * The host decides whether the executor may open a URL by matching it against the manifest's
 * `allowsOpen` with NEAR Connect's own matcher (protocol, then hostname and pathname when the entry
 * names them). These tests run that exact matcher, from the pinned near-connect version, against
 * the links the bridge backend actually issues — so a manifest entry can never again name a path
 * the backend has moved away from (`meteorwallet://bridge_request` stopped matching the moment the
 * link became `meteorwallet://b?…`).
 */

const REPO_ROOT = resolve(import.meta.dir, "../../../..");

/** The shape `createMeteorSessionAppLink` (meteor-connect-backend) issues, plus the SDK's fragment. */
const LIVE_LINKS = {
  production: "meteorwallet://b?f=s2&l=eyJhbGciOiJFZERTQSJ9.abc.def#s=5f2a9c",
  development: "meteorwalletdev://b?f=s2&l=eyJhbGciOiJFZERTQSJ9.abc.def#s=5f2a9c",
};

const REFUSED_LINKS = [
  "javascript://b?f=s2",
  "https://evil.example/b?f=s2",
  "intent://b?f=s2#Intent;scheme=meteorwallet;end",
  "data:text/html,hi",
];

interface IWalletManifest {
  id: string;
  permissions: { allowsOpen?: string[] };
}

function readJsonManifest(relativePath: string): IWalletManifest {
  const parsed = JSON.parse(readFileSync(resolve(REPO_ROOT, relativePath), "utf8"));
  return parsed.wallets[0];
}

const MANIFESTS: Array<{ label: string; wallet: IWalletManifest }> = [
  {
    label: "near-connect/manifest.json (upstream repository entry)",
    wallet: readJsonManifest("near-connect/manifest.json"),
  },
  {
    label: "packages/meteor-sdk-v1-test-web/public/manifest.json",
    wallet: readJsonManifest("packages/meteor-sdk-v1-test-web/public/manifest.json"),
  },
  { label: "dev-manifest.ts (demo app)", wallet: devManifest("published").wallets[0] },
];

const allowsOpen = (wallet: IWalletManifest, url: string): boolean => {
  const executor = new SandboxExecutor({} as any, wallet as any);
  return executor.checkPermissions("allowsOpen", { url });
};

describe("NEAR Connect manifest allowsOpen vs the live Meteor Mobile deep links", () => {
  for (const { label, wallet } of MANIFESTS) {
    describe(label, () => {
      it("admits the production and development mobile wallet links the backend issues", () => {
        expect(allowsOpen(wallet, LIVE_LINKS.production)).toBe(true);
        expect(allowsOpen(wallet, LIVE_LINKS.development)).toBe(true);
      });

      it("still refuses every other scheme", () => {
        for (const url of REFUSED_LINKS) expect(allowsOpen(wallet, url)).toBe(false);
      });

      it("declares both schemes bare, so a backend route rename cannot silently break the open", () => {
        expect(wallet.permissions.allowsOpen).toEqual(
          expect.arrayContaining(["meteorwallet://", "meteorwalletdev://"]),
        );
        for (const entry of wallet.permissions.allowsOpen ?? []) {
          if (!entry.startsWith("meteorwallet")) continue;
          expect(new URL(entry).hostname).toBe("");
        }
      });
    });
  }

  it("documents the old failure: a path-qualified entry never matches the live link", () => {
    const legacy: IWalletManifest = {
      id: "meteor-wallet",
      permissions: {
        allowsOpen: ["meteorwallet://bridge_request", "meteorwalletdev://bridge_request"],
      },
    };
    expect(allowsOpen(legacy, LIVE_LINKS.production)).toBe(false);
    expect(allowsOpen(legacy, LIVE_LINKS.development)).toBe(false);
  });
});
