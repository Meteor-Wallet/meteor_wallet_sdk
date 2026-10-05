import { consume } from "@lit/context";
import type { TMeteorConnectBackendEnvironment } from "@meteorwallet/connect";
import { html, LitElement } from "lit";
import { property, state } from "lit/decorators.js"; // You MUST import this explicitly
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import type { ExecutableAction } from "../../action/ExecutableAction";
import type { IMCActionExecutionState } from "../../action/mc_action.types";
import { MeteorLogger } from "../../logging/MeteorLogger";
import type { TMeteorConnectionExecutionTarget } from "../../MeteorConnect.types";
import { isMobile } from "../utils/isMobile";
import { ActionUiController } from "./ActionUiController";
import "./continue-action-screen";
import { customElement } from "./custom-element"; // Your new util
import "./get-meteor-screen";
import { meteorConnectLayoutStyles } from "./meteor-connect-layout.styles";
import { svg_icons_text } from "./graphical/svg_icons/svg_icons_text";
import { meteorHeaderLogo } from "./graphical/meteor-header-logo";
import "./meteor-action-button";
import { overlayCloseTriggerContext } from "./meteor-action-ui-context";
import "./meteor-action-ui-executing";
import "./meteor-mobile-bridge-panel";
import type { MobileBridgeSession } from "../../target_clients/mobile_bridge/MobileBridgeSession";
import { getVisibleActionTargets } from "../action-ui-targets";

@customElement("meteor-action-ui-container")
export class MeteorActionUiContainer extends LitElement {
  @state() private mobilePreparing = true;
  private unsubscribeMobilePreparation?: () => void;
  private observedMobileSession?: MobileBridgeSession;

  protected updated() {
    if (this.observedMobileSession === this.mobileSession) return;
    this.unsubscribeMobilePreparation?.();
    this.observedMobileSession = this.mobileSession;
    this.unsubscribeMobilePreparation = this.mobileSession?.subscribe(snapshot => {
      this.mobilePreparing = snapshot.deepLink == null && !["failed", "cancelled", "completed"].includes(snapshot.phase);
      if (["wallet_confirmation", "wallet_verification", "wallet_action", "result_ready", "external_work"].includes(snapshot.phase) || (isMobile() && snapshot.phase === "failed")) this.mobileSelected = true;
    });
  }

  @state() private mobileSelected = false;
  @state() private mobileOpenError = "";
  /** Set only while the dev-only mobile wallet switch is offered (dev gate, deployed backend). */
  @state() private devMobileWalletEnvironment?: TMeteorConnectBackendEnvironment;
  @state() private devMobileWalletSwitching = false;

  private async switchDevMobileWallet(environment: TMeteorConnectBackendEnvironment) {
    if (environment === this.devMobileWalletEnvironment || this.devMobileWalletSwitching) return;
    this.devMobileWalletSwitching = true;
    this.mobilePreparing = true;
    this.mobileOpenError = "";
    try {
      this.mobileSession = await this.actionController.switchDevMobileWalletEnvironment(environment);
      this.devMobileWalletEnvironment = environment;
    } catch (error) {
      this.logger.err("Switching the dev mobile wallet failed", error);
      this.mobilePreparing = false;
      this.mobileOpenError = "Could not switch the mobile wallet. Please close and reopen this window.";
    } finally {
      this.devMobileWalletSwitching = false;
    }
  }

  /**
   * `inline`: the bare Dev / Prod control at the end of the "or connect with mobile" divider, which
   * already says what it switches. Otherwise its own labelled row.
   */
  private renderDevMobileWalletSwitch(inline: boolean) {
    const options: [TMeteorConnectBackendEnvironment, string][] = [
      ["development", "Dev"],
      ["production", "Prod"],
    ];
    const control = html`<div class="dev-mobile-wallet-options" role="group" aria-label="Mobile wallet build (local dev only)" title="Mobile wallet build (local dev only)">
      ${options.map(([environment, label]) => html`<button type="button" aria-pressed=${this.devMobileWalletEnvironment === environment ? "true" : "false"} ?disabled=${this.devMobileWalletSwitching || this.mobilePreparing} @click=${() => void this.switchDevMobileWallet(environment)}>${label}</button>`)}
    </div>`;
    if (inline) return control;
    return html`<div class="dev-mobile-wallet-switch"><span>Mobile wallet (dev only)</span>${control}</div>`;
  }

  private async selectMobile() {
    if (this.mobilePreparing || this.mobileSession?.getSnapshot().deepLink == null) return;
    try {
      await this.action.meteorConnect.mobileBridgeClient.openCurrentSessionInApp();
      this.mobileOpenError = "";
    } catch {
      this.mobileOpenError = "Could not open Meteor Mobile. Please try opening it again.";
    }
  }

  private logger = MeteorLogger.createLogger("MeteorConnect:<meteor-action-ui-container>");

  @property({ type: Object }) action!: ExecutableAction<any>;
  @property({ attribute: false }) closeAction: (() => void) | undefined = undefined;
  @property({ type: Boolean })
  showGetMeteor: boolean = false;
  @property({ attribute: false })
  pendingKnownExecutionTarget: TMeteorConnectionExecutionTarget | undefined = undefined;
  @property({ type: Object })
  executionState: IMCActionExecutionState = {
    isExecuting: false,
    targetedPlatform: "unset",
  };

  @consume({ context: overlayCloseTriggerContext })
  @property({ attribute: false })
  public overlayCloseTrigger?: () => void;

  static styles = meteorConnectLayoutStyles;

  private actionController!: ActionUiController;
  private removeExecutionListener?: () => void;
  @property({ attribute: false }) mobileSession?: MobileBridgeSession;

  private _handleActionClose() {
    this.logger.log("Close button clicked, calling closeAction");

    if (this.overlayCloseTrigger) {
      this.logger.log("Using overlayCloseTrigger from context");
      this.overlayCloseTrigger();
      return;
    }
    // Call closeAction which will be the wrapped version from overlay if available
    this.closeAction?.();
  }

  connectedCallback() {
    super.connectedCallback();
    this.toggleAttribute("mobile-device", isMobile());
    this.actionController = new ActionUiController(this, this.action, this.closeAction);
    this.removeExecutionListener = this.action.addExecutionStateListener((executionState) => {
      this.executionState = executionState;
      this.logger.log("Received execution state update in container", executionState);
    });

    this.executionState = this.action.getExecutionState();
    void this.actionController.prepareMobileBridge().then((session) => {
      if (this.isConnected) {
        this.mobileSession = session;
        if (session == null) this.mobilePreparing = false;
      }
    }).catch(() => {
      if (!this.isConnected) return;
      this.mobilePreparing = false;
      this.mobileSelected = isMobile();
      this.mobileOpenError = "Could not prepare the mobile request. Please close and reopen this window.";
    });
    void this.action.meteorConnect.mobileBridgeClient
      .getDevMobileWalletEnvironment()
      .then((environment) => {
        if (this.isConnected) this.devMobileWalletEnvironment = environment;
      })
      .catch(() => {});
  }

  disconnectedCallback(): void {
    this.unsubscribeMobilePreparation?.();
    this.observedMobileSession = undefined;
    this.removeExecutionListener?.();
    super.disconnectedCallback();
  }

  // Opt into Vite HMR so edits to this file do not force a full page reload.
  private registerHmrBoundary() {
    if (import.meta.hot) {
      import.meta.hot.accept();
    }
  }

  render() {
    this.registerHmrBoundary();

    const mobileDevice = isMobile();
    const allPlatformTargets = this.action
      .getAllExecutionTargetConfigs()
      .map((target) => target.executionTarget);
    const contextualExecutionTarget = this.action.getActionKnownContextualTarget();
    const mobileExecuting =
      this.executionState.isExecuting &&
      this.executionState.targetedPlatform === "v2_bridge_mobile";
    const lockedExecutionTarget =
      contextualExecutionTarget ?? (mobileExecuting || this.mobileSelected ? "v2_bridge_mobile" : undefined);
    const availablePlatformTargets = getVisibleActionTargets(
      allPlatformTargets,
      lockedExecutionTarget,
    );
    const isPlatformLocked = lockedExecutionTarget != null;
    const includeWebDevLocalhost = availablePlatformTargets.includes("v1_web_localhost");

    const extensionWalletAvailable = !mobileDevice && availablePlatformTargets.includes("v1_ext");
    const webWalletAvailable = availablePlatformTargets.includes("v1_web");
    const mobileWalletAvailable = availablePlatformTargets.includes("v2_bridge_mobile");
    const showDevMobileWalletSwitch =
      this.devMobileWalletEnvironment != null && mobileWalletAvailable && !isPlatformLocked && !this.mobileSelected;
    const showMobileDivider =
      !mobileDevice && !isPlatformLocked && (extensionWalletAvailable || webWalletAvailable || includeWebDevLocalhost);
    const showingContinueKnownTarget = this.pendingKnownExecutionTarget != null;
    const continueExecutionTarget = this.pendingKnownExecutionTarget ?? "v1_web";

    this.logger.log(
      "Rendering Meteor Action UI Container with [available platforms], [supported platforms]:",
      [availablePlatformTargets, this.action.meteorConnect.supportedPlatforms],
    );

    let renderedScreen: any;

    if (this.executionState.isExecuting && !mobileExecuting) {
      renderedScreen = html`<meteor-action-ui-executing .executingForPlatform=${this.executionState.targetedPlatform}></meteor-action-ui-executing>`;
    } else if (showingContinueKnownTarget) {
      renderedScreen = html`<continue-action-screen
                  .executionTarget=${continueExecutionTarget}
                  .onContinue=${() => {
                    if (this.pendingKnownExecutionTarget) {
                      this.actionController.executeAction(this.pendingKnownExecutionTarget);
                    }
                  }}
                  .onBack=${() => {
                    this.pendingKnownExecutionTarget = undefined;
                  }}
                ></continue-action-screen>`;
    } else {
      if (this.showGetMeteor) {
        renderedScreen = html`<get-meteor-screen .supportedPlatforms=${this.action.meteorConnect.supportedPlatforms}></get-meteor-screen>`;
      } else {
        renderedScreen = html`
          <div class=${`meteor-connect-content${isPlatformLocked ? " contextual" : ""}`}>
            ${
              !isPlatformLocked &&
              (extensionWalletAvailable || webWalletAvailable || includeWebDevLocalhost || (mobileDevice && mobileWalletAvailable))
                ? html`
            <div class="options" aria-label="Platform choices">
              <span class="section-action-title">Choose how you’d like to connect</span>
              <div class="option-buttons-row">
                ${mobileDevice && mobileWalletAvailable ? html`<button class="platform-button primary mobile-option-button" ?disabled=${this.mobilePreparing} aria-busy=${this.mobilePreparing ? "true" : "false"} aria-label=${this.mobilePreparing ? "Meteor Mobile — preparing connection" : "Meteor Mobile"} @click=${() => void this.selectMobile()}>
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm5 16a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/></svg>
                  <span>Meteor Mobile</span>
            ${this.mobilePreparing ? html`<span class="mobile-request-spinner button-spinner" aria-hidden="true"></span>` : ""}
                </button>` : ""}
                  ${webWalletAvailable ? html`<button class=${`platform-button${mobileDevice ? "" : " primary"}`} @click=${() => this.actionController.executeAction("v1_web")}>
                    ${unsafeSVG(svg_icons_text.icon_web_globe)}<span>Meteor Web</span>
                  </button>` : ""}
                ${extensionWalletAvailable ? html`<button class="platform-button" @click=${() => this.actionController.executeAction("v1_ext")}>
                  ${unsafeSVG(svg_icons_text.icon_chrome)}<span>Chrome Extension</span>
                </button>` : ""}
                  ${includeWebDevLocalhost ? html`<button class="platform-button dev" @click=${() => this.actionController.executeAction("v1_web_localhost")}>
                    ${unsafeSVG(svg_icons_text.icon_web_globe)}<span>Dev Web (Localhost)</span>
                  </button>` : ""}
              </div>
            </div>`
                : ""
            }
            ${this.mobileOpenError ? html`<p role="alert">${this.mobileOpenError}</p>` : ""}
            ${
              mobileWalletAvailable && (!mobileDevice || this.mobileSelected || isPlatformLocked)
                ? html`
              ${showMobileDivider ? html`<div class="mobile-divider"><span></span><div>or connect with <strong>mobile</strong></div><span></span>${showDevMobileWalletSwitch ? this.renderDevMobileWalletSwitch(true) : ""}</div>` : ""}
              <meteor-mobile-bridge-panel
                connectDesign
                .continuation=${isPlatformLocked || this.mobileSelected}
                .session=${this.mobileSession}
                .contextual=${isPlatformLocked}
                .openInApp=${() => this.action.meteorConnect.mobileBridgeClient.openCurrentSessionInApp()}
                .refreshCode=${async () => {
                  this.mobileSession = await this.actionController.refreshMobileBridge();
                }}
                .resetIdentity=${async () => {
                  this.mobileSession = await this.actionController.resetMobileIdentityAndRePair();
                }}
              ></meteor-mobile-bridge-panel>
            `
                : ""
            }
            ${showDevMobileWalletSwitch && !showMobileDivider ? this.renderDevMobileWalletSwitch(false) : ""}
            ${
              !isPlatformLocked
                ? html`<div class="no-wallet-bottom-section">
                  <span>Don’t have a wallet?</span>
                  <button class="get-wallet-link" @click=${() => { this.showGetMeteor = true; }}>Get Meteor Wallet <span aria-hidden="true">↗</span></button>
                </div>`
                : ""
            }
          </div>
            `;
      }
    }

    return html`
      <div class="modal">
        <div class="meteor-connect-title-box">
          <div class="meteor-logo-and-title">
            ${
              this.showGetMeteor
                ? html`
            <button
              type="button"
              class="close-circle"
              aria-label="Back to wallet choices"
              @click=${() => {
                this.showGetMeteor = false;
              }}
            >
              ${unsafeSVG(svg_icons_text.icon_arrow_back)}
            </button>
            <div class="title-text-box">
              <span class="subsection-title">
                Get Meteor Wallet
              </span>
            </div>`
                : html`
            <div class="meteor-logo">
              <img src=${meteorHeaderLogo} alt="" />
            </div>
            <div class="title-text-box">
              <span class="title">Meteor Connect</span>
            </div>`
            }
          </div>
          <button type="button" class="close-circle" aria-label="Close Meteor Connect" @click=${() => this._handleActionClose()}>
            ${unsafeSVG(svg_icons_text.icon_close_x)}
          </button>
        </div>
        ${renderedScreen}
      </div>
    `;
  }
}

/* 
<div class="qr-section">
              ${this.actionController.meteorV2RequestIdTask.render({
                initial: () => html`<p>Initializing...</p>`,
                pending: () => html`<div class="spinner">Generating QR Code...</div>`,
                complete: (id) => {
                  this.queueQrRender(id);
                  return html`
                    <div class="qr-container">
                      <div id="qr-code-target" class="qr-code-target" role="img" aria-label="Meteor Wallet QR code"></div>
                      <p class="qr-helper">Scan with your mobile device</p>
                    </div>
                  `;
                },
                error: (e) => html`<p class="error">Failed to load QR: ${e}</p>`,
              })}
            </div>
*/
