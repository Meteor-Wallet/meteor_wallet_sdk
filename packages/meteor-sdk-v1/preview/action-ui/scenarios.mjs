/**
 * Shared scenario definitions for the Meteor Connect action-UI preview.
 *
 * Each scenario is plain data so it can be consumed from both sides:
 * - `action-ui-preview.entry.ts` (browser) builds mock action/session objects from it.
 * - `screenshot.mjs` (node) iterates the same list to capture every state.
 *
 * Scenario fields:
 * - `name`        — used as `?scenario=<name>` and as the screenshot filename prefix.
 * - `description` — shown in the CLI link list.
 * - `targets`     — execution targets offered by the mock action (default: all).
 * - `knownTarget` — when set, simulates a contextual (locked) execution target.
 * - `pendingTarget` — when set, shows the "continue on your platform" screen.
 * - `view`        — set to "get-meteor" to open on the Get Meteor Wallet screen.
 * - `mobileUa`    — screenshot.mjs uses a mobile user agent for this scenario.
 * - `settleMs`    — how long screenshot.mjs waits before capturing (default 900).
 * - `snapshot`    — IMobileBridgeSnapshot fields the mock mobile session emits.
 * - `element`     — container element tag (default "meteor-action-ui-container"; transfer
 *                   scenarios use "meteor-transfer-accounts-container").
 * - `transfer`    — transfer-container state: { accounts: [{accountId, networkId}],
 *                   screen: "review" | "connect", revealShown?: true, terminal?:
 *                   "imported" | "declined" | "expired" }.
 */

const ALL_TARGETS = ["v1_ext", "v1_web", "v1_web_localhost", "v2_bridge_mobile"];
// Realistic-length bridge link so the QR density matches the real app
// (short links produce unrealistically sparse QR codes).
const DEEP_LINK =
  "https://link.meteorwallet.app/bridge?requestId=8f3a9c2e-1b4d-4e7a-9c5f-2d6e8a0b1c3d" +
  "&version=2&origin=https%3A%2F%2Fdemo-dapp.example.com";
const EXPIRES_SOON = () => Date.now() + 4 * 60_000 + 48_000;

/** @type {Array<Record<string, any>>} */
export const SCENARIOS = [
  {
    name: "main",
    description: "Wallet picker + Meteor Mobile panel with QR (most common state)",
    targets: ALL_TARGETS,
    snapshot: {
      phase: "waiting_for_wallet",
      push: "not_attempted",
      deepLink: DEEP_LINK,
      expiresAt: EXPIRES_SOON(),
      pinAttemptsUsed: 0,
      reconnecting: false,
    },
  },
  {
    name: "mobile-main",
    description: "Same as main, but with a mobile user agent (stacked layout)",
    targets: ALL_TARGETS,
    mobileUa: true,
    snapshot: {
      phase: "waiting_for_wallet",
      push: "not_attempted",
      deepLink: DEEP_LINK,
      expiresAt: EXPIRES_SOON(),
      pinAttemptsUsed: 0,
      reconnecting: false,
    },
  },
  {
    name: "push",
    description: "Contextual (logged-in) push notification stage",
    targets: ALL_TARGETS,
    knownTarget: "v2_bridge_mobile",
    settleMs: 1400,
    snapshot: {
      phase: "waiting_for_wallet",
      push: "delivered",
      deepLink: DEEP_LINK,
      expiresAt: EXPIRES_SOON(),
      pinAttemptsUsed: 0,
      reconnecting: false,
    },
  },
  {
    name: "push-unavailable",
    description: "Push notification unavailable, QR fallback",
    targets: ALL_TARGETS,
    knownTarget: "v2_bridge_mobile",
    snapshot: {
      phase: "waiting_for_wallet",
      push: "not_delivered",
      deepLink: DEEP_LINK,
      expiresAt: EXPIRES_SOON(),
      pinAttemptsUsed: 0,
      reconnecting: false,
    },
  },
  {
    name: "review",
    description: "Review & approve stage (wallet received the request)",
    targets: ALL_TARGETS,
    knownTarget: "v2_bridge_mobile",
    snapshot: {
      phase: "wallet_action",
      push: "delivered",
      deepLink: DEEP_LINK,
      expiresAt: EXPIRES_SOON(),
      pinAttemptsUsed: 0,
      reconnecting: false,
    },
  },
  {
    name: "pin",
    description: "First-pairing PIN entry stage",
    targets: ALL_TARGETS,
    knownTarget: "v2_bridge_mobile",
    snapshot: {
      phase: "wallet_verification",
      push: "delivered",
      deepLink: DEEP_LINK,
      expiresAt: EXPIRES_SOON(),
      pinAttemptsUsed: 0,
      reconnecting: false,
    },
  },
  {
    name: "pin-error",
    description: "PIN entry with an error and 1 attempt used",
    targets: ALL_TARGETS,
    knownTarget: "v2_bridge_mobile",
    snapshot: {
      phase: "wallet_verification",
      push: "delivered",
      deepLink: DEEP_LINK,
      expiresAt: EXPIRES_SOON(),
      pinAttemptsUsed: 1,
      pinError: "Incorrect PIN",
      reconnecting: false,
    },
  },
  {
    name: "completed",
    description: "Request completed in Meteor Mobile",
    targets: ALL_TARGETS,
    knownTarget: "v2_bridge_mobile",
    snapshot: {
      phase: "completed",
      push: "delivered",
      pinAttemptsUsed: 0,
      reconnecting: false,
    },
  },
  {
    name: "failed",
    description: "Request failed / rejected",
    targets: ALL_TARGETS,
    knownTarget: "v2_bridge_mobile",
    snapshot: {
      phase: "failed",
      push: "delivered",
      pinAttemptsUsed: 0,
      reconnecting: false,
      error: "The request was rejected in Meteor Mobile.",
    },
  },
  {
    name: "reset",
    description: "Identity reset required (stale pairing)",
    targets: ALL_TARGETS,
    knownTarget: "v2_bridge_mobile",
    snapshot: {
      phase: "waiting_for_wallet",
      push: "not_attempted",
      deepLink: DEEP_LINK,
      expiresAt: EXPIRES_SOON(),
      pinAttemptsUsed: 0,
      reconnecting: false,
      identityResetRequired: true,
    },
  },
  {
    name: "continue-web",
    description: "Continue-on-your-platform screen (returning user)",
    targets: ALL_TARGETS,
    pendingTarget: "v1_web",
    snapshot: {
      phase: "waiting_for_wallet",
      push: "not_attempted",
      deepLink: DEEP_LINK,
      expiresAt: EXPIRES_SOON(),
      pinAttemptsUsed: 0,
      reconnecting: false,
    },
  },
  {
    name: "get-meteor",
    description: "Get Meteor Wallet screen",
    targets: ALL_TARGETS,
    view: "get-meteor",
    snapshot: {
      phase: "waiting_for_wallet",
      push: "not_attempted",
      deepLink: DEEP_LINK,
      expiresAt: EXPIRES_SOON(),
      pinAttemptsUsed: 0,
      reconnecting: false,
    },
  },
  ...makeTransferScenarios(),
];

/** Transfer-accounts popup states (element: meteor-transfer-accounts-container). */
function makeTransferScenarios() {
  const TRANSFER_ACCOUNTS = [
    { accountId: "alice.near", networkId: "mainnet" },
    { accountId: "savings-vault.near", networkId: "mainnet" },
    { accountId: "alice-testing.testnet", networkId: "testnet" },
  ];
  const base = (name, description, snapshotPhase, transfer, extra = {}) => ({
    name,
    description,
    element: "meteor-transfer-accounts-container",
    targets: ["v2_bridge_mobile"],
    snapshot: {
      phase: snapshotPhase,
      push: "not_attempted",
      deepLink: DEEP_LINK,
      expiresAt: EXPIRES_SOON(),
      pinAttemptsUsed: 0,
      reconnecting: false,
    },
    transfer: { accounts: TRANSFER_ACCOUNTS, ...transfer },
    ...extra,
  });
  return [
    base("transfer-review", "Transfer: staged-account review before bridge creation", "initializing", {
      screen: "review",
    }),
    base("transfer-choose", "Transfer: wallet-platform choice (Meteor Web vs Mobile)", "initializing", {
      screen: "choose",
    }),
    base("transfer-connect", "Transfer: QR / open-link waiting stage (web target)", "waiting_for_wallet", {
      screen: "connect",
      platform: "web",
    }),
    base("transfer-connect-mobile", "Transfer: QR / open-link waiting stage (mobile target)", "waiting_for_wallet", {
      screen: "connect",
      platform: "mobile",
    }),
    base("transfer-pin", "Transfer: PIN verification stage", "wallet_verification", {
      screen: "connect",
    }),
    base("transfer-reveal-hidden", "Transfer: verified, key still hidden", "wallet_action", {
      screen: "connect",
    }),
    base("transfer-reveal-shown", "Transfer: key revealed (text + QR)", "wallet_action", {
      screen: "connect",
      revealShown: true,
    }),
    base("transfer-imported", "Transfer: terminal — accounts transferred", "completed", {
      screen: "connect",
      terminal: "imported",
    }),
    base("transfer-declined", "Transfer: terminal — declined on device", "completed", {
      screen: "connect",
      terminal: "declined",
    }),
    base("transfer-expired", "Transfer: terminal — bridge expired", "failed", {
      screen: "connect",
      terminal: "expired",
    }),
  ];
}

export const SCENARIO_NAMES = SCENARIOS.map((s) => s.name);
