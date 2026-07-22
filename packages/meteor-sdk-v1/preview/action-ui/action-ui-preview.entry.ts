/**
 * Browser entry for the Meteor Connect action-UI preview.
 *
 * Renders the REAL production components (<meteor-action-ui-overlay> +
 * <meteor-action-ui-container>) with mocked ExecutableAction / MobileBridgeSession
 * objects driven by the shared scenario definitions in `scenarios.mjs`.
 *
 * Open `?scenario=<name>` to pick a scenario (see scenarios.mjs for the list).
 */
import type { ExecutableAction } from "../../src/MeteorConnect/action/ExecutableAction";
import type {
  IMobileBridgeSnapshot,
  MobileBridgeSession,
} from "../../src/MeteorConnect/target_clients/mobile_bridge/MobileBridgeSession";
import type { TMeteorConnectionExecutionTarget } from "../../src/MeteorConnect/MeteorConnect.types";
import "../../src/MeteorConnect/action_ui/lit_ui/meteor-action-ui-overlay";
import "../../src/MeteorConnect/action_ui/lit_ui/meteor-action-ui-container";
import { GILROY_FONT_FAMILY_DATA_URL_STYLESHEET } from "../../src/MeteorConnect/action_ui/lit_ui/font/gilroy-font-kit/gilroy_font.static";
// Plain JS module shared with the node-side tooling (implicitly any-typed).
import { SCENARIOS } from "./scenarios.mjs";

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
}

const scenarios = SCENARIOS as ScenarioConfig[];

// Inject the Gilroy font the same way ActionUi does for the real popup.
const style = document.createElement("style");
style.textContent = GILROY_FONT_FAMILY_DATA_URL_STYLESHEET;
document.head.appendChild(style);

function makeMockSession(snapshot: IMobileBridgeSnapshot): MobileBridgeSession {
  return {
    subscribe(listener: (s: IMobileBridgeSnapshot) => void) {
      listener({ ...snapshot });
      return () => {};
    },
    getSnapshot: () => ({ ...snapshot }),
    submitPin: async (_pin: string) => {},
    isCommitted: () => false,
  } as unknown as MobileBridgeSession;
}

function makeMockAction(scenario: ScenarioConfig): ExecutableAction<any> {
  const session = makeMockSession(scenario.snapshot);
  const targets = scenario.targets ?? ["v1_web", "v2_bridge_mobile"];
  return {
    meteorConnect: {
      supportedPlatforms: targets,
      mobileBridgeClient: {
        openCurrentSessionInApp() {},
      },
    },
    getAllExecutionTargetConfigs: () => targets.map((executionTarget) => ({ executionTarget })),
    getActionKnownContextualTarget: () => scenario.knownTarget,
    addExecutionStateListener: (_cb: unknown) => () => {},
    getExecutionState: () => ({ isExecuting: false, targetedPlatform: "unset" }),
    prepareMobileBridge: async () => session,
    refreshMobileBridge: async () => session,
    resetMobileIdentityAndRePair: async () => session,
    execute: async (_target: TMeteorConnectionExecutionTarget) => {},
  } as unknown as ExecutableAction<any>;
}

const params = new URLSearchParams(location.search);
const scenarioName = params.get("scenario") ?? "main";
const scenario = scenarios.find((s) => s.name === scenarioName) ?? scenarios[0];

const overlay = document.createElement("meteor-action-ui-overlay") as any;
overlay.closeAction = () => {};

const container = document.createElement("meteor-action-ui-container") as any;
container.action = makeMockAction(scenario);
container.closeAction = () => {};
if (scenario.pendingTarget != null) container.pendingKnownExecutionTarget = scenario.pendingTarget;
if (scenario.view === "get-meteor") container.showGetMeteor = true;

overlay.appendChild(container);
document.body.appendChild(overlay);

// Readiness signal for the screenshot tooling.
(container as any).updateComplete?.then(() => {
  (window as any).__uiReady = true;
});
