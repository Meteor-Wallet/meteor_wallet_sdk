/**
 * Browser entry for the Meteor Connect action-UI preview.
 *
 * Renders the REAL production components (<meteor-action-ui-overlay> +
 * <meteor-action-ui-container>) with mocked ExecutableAction / MobileBridgeSession
 * objects driven by the shared scenario definitions in `scenarios.mjs`.
 *
 * Open `?scenario=<name>` to pick a scenario (see scenarios.mjs for the list).
 */
import { ESessionPhase, type TSessionFacts } from "@meteorwallet/connect-shared";
import type { ExecutableAction } from "../../src/MeteorConnect/action/ExecutableAction";
import type { TMeteorConnectionExecutionTarget } from "../../src/MeteorConnect/MeteorConnect.types";
import type {
  IMobileBridgeSnapshot,
  MobileBridgeSession,
} from "../../src/MeteorConnect/target_clients/mobile_bridge/MobileBridgeSession";
import "../../src/MeteorConnect/action_ui/lit_ui/meteor-action-ui-overlay";
import "../../src/MeteorConnect/action_ui/lit_ui/meteor-action-ui-container";
import "../../src/MeteorConnect/action_ui/lit_ui/meteor-transfer-accounts-container";
import { GILROY_FONT_FAMILY_DATA_URL_STYLESHEET } from "../../src/MeteorConnect/action_ui/lit_ui/font/gilroy-font-kit/gilroy_font.static";
// Plain JS module shared with the node-side tooling (implicitly any-typed).
import { SCENARIOS } from "./scenarios.mjs";

interface ScenarioTransferConfig {
  accounts: Array<{ accountId: string; networkId: string }>;
  screen: "choose" | "connect";
  platform?: "web" | "mobile";
  revealShown?: boolean;
  terminal?: "imported" | "declined" | "expired";
}

interface ScenarioConfig {
  name: string;
  description?: string;
  targets?: TMeteorConnectionExecutionTarget[];
  knownTarget?: TMeteorConnectionExecutionTarget;
  pendingTarget?: TMeteorConnectionExecutionTarget;
  view?: "get-meteor";
  mobileUa?: boolean;
  settleMs?: number;
  snapshot: IMobileBridgeSnapshot;
  element?: string;
  transfer?: ScenarioTransferConfig;
}

const scenarios = SCENARIOS as ScenarioConfig[];

// Inject the Gilroy font the same way ActionUi does for the real popup.
const style = document.createElement("style");
style.textContent = GILROY_FONT_FAMILY_DATA_URL_STYLESHEET;
document.head.appendChild(style);

/**
 * The SDK flow phases that correspond 1:1 to an authenticated session phase. The panel derives its
 * close verb from `describeCloseOptions(facts, "partner")`, so a preview without facts would show
 * no close button at all — these let every live scenario render the real matrix.
 */
const PREVIEW_SESSION_PHASE: Partial<Record<IMobileBridgeSnapshot["phase"], ESessionPhase>> = {
  creating_bridge: ESessionPhase.initializing,
  waiting_for_wallet: ESessionPhase.waiting_for_wallet,
  wallet_verification: ESessionPhase.wallet_verification,
  wallet_action: ESessionPhase.wallet_action,
  result_ready: ESessionPhase.result_ready,
  external_work: ESessionPhase.external_work,
  failed: ESessionPhase.failed,
  cancelled: ESessionPhase.closed,
  completed: ESessionPhase.closed,
};

function previewFacts(snapshot: IMobileBridgeSnapshot): TSessionFacts | undefined {
  if (snapshot.facts != null) return snapshot.facts;
  const phase = PREVIEW_SESSION_PHASE[snapshot.phase];
  if (phase == null) return undefined;
  return {
    phase,
    idleExpiresAt: snapshot.idleExpiresAt ?? Date.now() + 300_000,
    absoluteExpiresAt: snapshot.absoluteExpiresAt ?? Date.now() + 1_800_000,
  } as TSessionFacts;
}

function makeMockSession(input: IMobileBridgeSnapshot): MobileBridgeSession {
  const snapshot: IMobileBridgeSnapshot = { ...input, facts: previewFacts(input) };
  return {
    subscribe(listener: (s: IMobileBridgeSnapshot) => void) {
      listener({ ...snapshot });
      return () => {};
    },
    getSnapshot: () => ({ ...snapshot }),
    submitPin: async (_pin: string) => {},
    reconnectLink: async () => {},
    abandon: async () => {},
    isCommitted: () => false,
  } as unknown as MobileBridgeSession;
}

function makeMockAction(scenario: ScenarioConfig): ExecutableAction<any> {
  const session = makeMockSession(scenario.snapshot);
  const targets = scenario.targets ?? ["v1_web", "v2_bridge_mobile"];
  return {
    id: scenario.transfer != null ? "meteor_wallet_core::transfer_accounts" : "near::sign_in",
    expandedInput:
      scenario.transfer != null
        ? {
            formatVersion: 1,
            allAccountsBasicInfo: scenario.transfer.accounts.map((account) => ({
              blockchainId: "near",
              ...account,
            })),
            encryptedData: { nonce: "preview", ciphertext: "preview" },
          }
        : {},
    meteorConnect: {
      supportedPlatforms: targets,
      mobileBridgeClient: {
        openCurrentSessionInApp() {},
        // Previews always show the dev-gated "Meteor Web (Local Dev)" transfer option.
        isTransferLocalDevWebAvailable: async () => true,
      },
    },
    getAllExecutionTargetConfigs: () => targets.map((executionTarget) => ({ executionTarget })),
    getActionKnownContextualTarget: () => scenario.knownTarget,
    // Transfer previews drive the screen explicitly below, so no platform is pre-locked here.
    getTransferTargetPlatform: () => undefined,
    addExecutionStateListener: (_cb: unknown) => () => {},
    getExecutionState: () => ({ isExecuting: false, targetedPlatform: "unset" }),
    // Previews re-prepare rather than refresh — the mock session is the same either way.
    getPreparedMobileSession: () => undefined,
    prepareMobileBridge: async () => session,
    refreshMobileBridge: async () => session,
    resetMobileIdentityAndRePair: async () => session,
    execute: async (_target: TMeteorConnectionExecutionTarget) => {},
    // Never settles in previews — terminal screens are driven via previewTerminalState.
    waitForExecutionOutput: () => new Promise(() => {}),
  } as unknown as ExecutableAction<any>;
}

/** Display-only fake key for the reveal-shown preview (never a real mck1 secret). */
const PREVIEW_KEY_RAW = `mck1.${"PrevIewKeyPrevIewKeyPrevIewKeyPrevIewKeyPre"}.aBc12x`;
const PREVIEW_REVEAL_SOURCE = {
  getRevealPayload: (session: MobileBridgeSession) =>
    session.getSnapshot().phase === "wallet_action"
      ? {
          raw: PREVIEW_KEY_RAW,
          grouped: PREVIEW_KEY_RAW.match(/.{1,4}/g)?.join(" ") ?? PREVIEW_KEY_RAW,
        }
      : null,
};

const params = new URLSearchParams(location.search);
const scenarioName = params.get("scenario") ?? "main";
const scenario = scenarios.find((s) => s.name === scenarioName) ?? scenarios[0];

const overlay = document.createElement("meteor-action-ui-overlay") as any;
overlay.closeAction = () => {};

const elementTag = scenario.element ?? "meteor-action-ui-container";
const container = document.createElement(elementTag) as any;
container.action = makeMockAction(scenario);
container.closeAction = () => {};
if (scenario.pendingTarget != null) container.pendingKnownExecutionTarget = scenario.pendingTarget;
if (scenario.view === "get-meteor") container.showGetMeteor = true;
if (scenario.transfer != null) {
  container.previewRevealSource = PREVIEW_REVEAL_SOURCE;
  if (scenario.transfer.terminal != null) {
    container.previewTerminalState = scenario.transfer.terminal;
  }
}

overlay.appendChild(container);
document.body.appendChild(overlay);

// Readiness signal for the screenshot tooling (transfer scenarios may advance screens first).
void (async () => {
  await (container as any).updateComplete;
  const transfer = scenario.transfer;
  // "choose" is the container's default screen now — only "connect" needs advancing.
  if (transfer != null && transfer.terminal == null && transfer.screen === "connect") {
    await (container as any).startTransfer?.(transfer.platform ?? "web");
    await (container as any).updateComplete;
    if (transfer.revealShown) {
      const card = (container as any).shadowRoot?.querySelector("meteor-transfer-key-card");
      if (card != null) {
        (card as any).revealed = true;
        await (card as any).updateComplete;
      }
    }
  }
  (window as any).__uiReady = true;
})();
