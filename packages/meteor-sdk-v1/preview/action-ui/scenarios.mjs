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
 * - `clickLabel`  — screenshot.mjs clicks the control with this aria-label (or button text)
 *                   before capturing, for states only reachable through a toggle (e.g. the mobile
 *                   QR reveal, or the PIN stage's collapsed QR).
 * - `settleMs`    — how long screenshot.mjs waits before capturing (default 900).
 * - `snapshot`    — IMobileBridgeSnapshot fields the mock mobile session emits. `facts` is
 *                   derived from `snapshot.phase` by the preview entry unless a scenario sets it.
 * - `element`     — container element tag (default "meteor-action-ui-container"; transfer
 *                   scenarios use "meteor-transfer-accounts-container").
 * - `transfer`    — transfer-container state: { accounts: [{accountId, networkId}],
 *                   screen: "choose" | "connect", revealShown?: true, terminal?:
 *                   "imported" | "declined" | "expired" }.
 */

const ALL_TARGETS = ["v1_ext", "v1_web", "v1_web_localhost", "v2_bridge_mobile"];
// A real-shaped `linkFormat=s2` bridge link (147 chars: 34-char route, `f=s2`, a 71-char lease,
// and the 32-char partner secret in the fragment). The QR density here must match the real app —
// a shorter stand-in produces an unrealistically sparse code and hides regressions.
const DEEP_LINK =
  "https://wallet.meteorwallet.app/b?f=s2&l=" +
  "AaGxs8PU5fYHGKGxs8PU5fYHGKGxs8PU5fYHGGmImYCTq83f8xkpS7dvH1yQ4tBnZeXwK9m" +
  "#s=V1StGXR8_Z5jdHi6B-myT_kR9pQwXzL7";
const EXPIRES_SOON = () => Date.now() + 4 * 60_000 + 48_000;
/** The absolute wall no refresh moves — comfortably beyond the idle deadline in most scenarios. */
const HARD_STOP = () => Date.now() + 25 * 60_000;

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
      idleExpiresAt: EXPIRES_SOON(),
      absoluteExpiresAt: HARD_STOP(),
      pinAttemptsUsed: 0,
      linkPhase: "live",
      linkRedialAttempt: 0,
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
      idleExpiresAt: EXPIRES_SOON(),
      absoluteExpiresAt: HARD_STOP(),
      pinAttemptsUsed: 0,
      linkPhase: "live",
      linkRedialAttempt: 0,
    },
  },
  {
    // The mobile panel hides the QR behind a toggle, so nothing else captures the stacked layout
    // WITH the code open — the one state where the code pays full height for its size.
    name: "mobile-main-qr",
    description: "Mobile stacked layout with the QR revealed (tightest vertical budget)",
    targets: ALL_TARGETS,
    mobileUa: true,
    clickLabel: "Show QR code",
    snapshot: {
      phase: "waiting_for_wallet",
      push: "not_attempted",
      deepLink: DEEP_LINK,
      idleExpiresAt: EXPIRES_SOON(),
      absoluteExpiresAt: HARD_STOP(),
      pinAttemptsUsed: 0,
      linkPhase: "live",
      linkRedialAttempt: 0,
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
      idleExpiresAt: EXPIRES_SOON(),
      absoluteExpiresAt: HARD_STOP(),
      pinAttemptsUsed: 0,
      linkPhase: "live",
      linkRedialAttempt: 0,
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
      idleExpiresAt: EXPIRES_SOON(),
      absoluteExpiresAt: HARD_STOP(),
      pinAttemptsUsed: 0,
      linkPhase: "live",
      linkRedialAttempt: 0,
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
      idleExpiresAt: EXPIRES_SOON(),
      absoluteExpiresAt: HARD_STOP(),
      pinAttemptsUsed: 0,
      linkPhase: "live",
      linkRedialAttempt: 0,
    },
  },
  {
    name: "review-mobile",
    description: "Review & approve stage on a phone — the Open button is the only usable escape",
    targets: ALL_TARGETS,
    knownTarget: "v2_bridge_mobile",
    mobileUa: true,
    snapshot: {
      phase: "wallet_action",
      push: "delivered",
      deepLink: DEEP_LINK,
      idleExpiresAt: EXPIRES_SOON(),
      absoluteExpiresAt: HARD_STOP(),
      pinAttemptsUsed: 0,
      linkPhase: "live",
      linkRedialAttempt: 0,
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
      idleExpiresAt: EXPIRES_SOON(),
      absoluteExpiresAt: HARD_STOP(),
      pinAttemptsUsed: 0,
      linkPhase: "live",
      linkRedialAttempt: 0,
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
      idleExpiresAt: EXPIRES_SOON(),
      absoluteExpiresAt: HARD_STOP(),
      pinAttemptsUsed: 1,
      pinError: "Incorrect PIN",
      linkPhase: "live",
      linkRedialAttempt: 0,
    },
  },
  {
    name: "pin-qr",
    clickLabel: "Show QR",
    description: "PIN stage with its collapsed QR revealed (least vertical room of any stage)",
    targets: ALL_TARGETS,
    knownTarget: "v2_bridge_mobile",
    snapshot: {
      phase: "wallet_verification",
      push: "delivered",
      deepLink: DEEP_LINK,
      idleExpiresAt: EXPIRES_SOON(),
      absoluteExpiresAt: HARD_STOP(),
      pinAttemptsUsed: 0,
      linkPhase: "live",
      linkRedialAttempt: 0,
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
      linkPhase: "live",
      linkRedialAttempt: 0,
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
      linkPhase: "detached",
      linkRedialAttempt: 0,
      // Classified copy the panel renders verbatim; `error` is the untouched original message.
      errorHeadline: "The request was rejected in Meteor Mobile.",
      errorDetail: "Nothing was signed. Start the request again when you are ready.",
      error: "[bridge_session](action_declined) wallet declined the action",
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
      idleExpiresAt: EXPIRES_SOON(),
      absoluteExpiresAt: HARD_STOP(),
      pinAttemptsUsed: 0,
      linkPhase: "live",
      linkRedialAttempt: 0,
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
      idleExpiresAt: EXPIRES_SOON(),
      absoluteExpiresAt: HARD_STOP(),
      pinAttemptsUsed: 0,
      linkPhase: "live",
      linkRedialAttempt: 0,
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
      idleExpiresAt: EXPIRES_SOON(),
      absoluteExpiresAt: HARD_STOP(),
      pinAttemptsUsed: 0,
      linkPhase: "live",
      linkRedialAttempt: 0,
    },
  },
  {
    name: "link-reconnecting",
    description: "Bridge link dropped — the SDK's bounded redial ladder is running",
    targets: ALL_TARGETS,
    knownTarget: "v2_bridge_mobile",
    snapshot: {
      phase: "waiting_for_wallet",
      push: "not_attempted",
      deepLink: DEEP_LINK,
      idleExpiresAt: EXPIRES_SOON(),
      absoluteExpiresAt: HARD_STOP(),
      pinAttemptsUsed: 0,
      linkPhase: "reconnecting",
      linkRedialAttempt: 3,
      linkRetryInMs: 4_000,
    },
  },
  {
    name: "link-offline",
    description: "Redial budget exhausted — user-mediated Reconnect is the only way back",
    targets: ALL_TARGETS,
    knownTarget: "v2_bridge_mobile",
    snapshot: {
      phase: "waiting_for_wallet",
      push: "not_attempted",
      deepLink: DEEP_LINK,
      idleExpiresAt: EXPIRES_SOON(),
      absoluteExpiresAt: HARD_STOP(),
      pinAttemptsUsed: 0,
      linkPhase: "offline",
      linkRedialAttempt: 8,
    },
  },
  {
    name: "result-ready",
    description: "Wallet answered — the only close verb left is the destructive one",
    targets: ALL_TARGETS,
    knownTarget: "v2_bridge_mobile",
    snapshot: {
      phase: "result_ready",
      push: "delivered",
      idleExpiresAt: EXPIRES_SOON(),
      absoluteExpiresAt: HARD_STOP(),
      pinAttemptsUsed: 0,
      linkPhase: "live",
      linkRedialAttempt: 0,
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
      idleExpiresAt: EXPIRES_SOON(),
      absoluteExpiresAt: HARD_STOP(),
      pinAttemptsUsed: 0,
      linkPhase: "live",
      linkRedialAttempt: 0,
    },
    transfer: { accounts: TRANSFER_ACCOUNTS, ...transfer },
    ...extra,
  });
  return [
    base(
      "transfer-choose",
      "Transfer: wallet chooser with the inline Meteor Mobile QR panel",
      "waiting_for_wallet",
      {
        screen: "choose",
      },
    ),
    base(
      "transfer-get-meteor",
      "Transfer: Get Meteor Wallet sub-page (extension excluded)",
      "initializing",
      { screen: "choose" },
      { view: "get-meteor" },
    ),
    base(
      "transfer-connect",
      "Transfer: QR / open-link waiting stage (web target)",
      "waiting_for_wallet",
      {
        screen: "connect",
        platform: "web",
      },
    ),
    base(
      "transfer-connect-mobile",
      "Transfer: QR / open-link waiting stage (mobile target)",
      "waiting_for_wallet",
      {
        screen: "connect",
        platform: "mobile",
      },
    ),
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
