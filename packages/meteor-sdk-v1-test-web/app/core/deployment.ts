import {
  EMeteorAppId,
  METEOR_CONNECT_BACKENDS,
  WALLET_URL_DEV_BASE,
  WALLET_URL_PRODUCTION_BASE,
} from "@meteorwallet/sdk";

/**
 * Which Meteor stack this build of the harness talks to, fixed at build time by
 * `VITE_DEPLOYMENT_KIND` (`bun run build:dev` / `bun run build:production`). Unset means `dev`, so
 * nothing reaches production — where real user sessions live — unless a build asks for it.
 *
 * The kind sets the defaults only; `?backend=` still overrides the bridge backend per page load
 * (see `MeteorConnectTest`).
 */
export type TDeploymentKind = "dev" | "production";

interface IDeploymentConfig {
  kind: TDeploymentKind;
  /** The Meteor Connect bridge backend used when the page has no `?backend=` override. */
  bridgeBackend: keyof typeof METEOR_CONNECT_BACKENDS;
  /**
   * The mobile wallet the bridge pairs with. New-key transfers to "web" follow it in the SDK
   * (`meteor_wallet_mobile_dev` → `meteor_wallet_web_dev`), and the backend issues each app's link.
   */
  mobileAppId: EMeteorAppId.meteor_wallet_mobile | EMeteorAppId.meteor_wallet_mobile_dev;
  /** The link the backend issues for `mobileAppId` (display only). */
  mobileDeepLink: string;
  /** The V1 web wallet that `v1_web` popups open. */
  webWalletUrl: string;
}

const DEPLOYMENT_CONFIGS: Record<TDeploymentKind, IDeploymentConfig> = {
  dev: {
    kind: "dev",
    bridgeBackend: "development",
    mobileAppId: EMeteorAppId.meteor_wallet_mobile_dev,
    mobileDeepLink: "meteorwalletdev://b",
    webWalletUrl: WALLET_URL_DEV_BASE,
  },
  production: {
    kind: "production",
    bridgeBackend: "production",
    mobileAppId: EMeteorAppId.meteor_wallet_mobile,
    mobileDeepLink: "meteorwallet://b",
    webWalletUrl: WALLET_URL_PRODUCTION_BASE,
  },
};

const resolveDeploymentKind = (): TDeploymentKind => {
  const requested: string = import.meta.env.VITE_DEPLOYMENT_KIND || "dev";
  if (requested === "dev" || requested === "production") return requested;
  // Thrown while the SPA shell prerenders, so a mistyped kind fails the build instead of deploying.
  throw new Error(`Unknown VITE_DEPLOYMENT_KIND "${requested}" (expected "dev" or "production")`);
};

export const DEPLOYMENT: IDeploymentConfig = DEPLOYMENT_CONFIGS[resolveDeploymentKind()];
