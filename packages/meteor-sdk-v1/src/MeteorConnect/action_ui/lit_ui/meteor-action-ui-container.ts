import { consume } from "@lit/context";
import { css, html, LitElement, unsafeCSS } from "lit";
import { property } from "lit/decorators.js"; // You MUST import this explicitly
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import type { ExecutableAction } from "../../action/ExecutableAction";
import type { IMCActionExecutionState } from "../../action/mc_action.types";
import { MeteorLogger } from "../../logging/MeteorLogger";
import type { TMeteorConnectionExecutionTarget } from "../../MeteorConnect.types";
import { ActionUiController } from "./ActionUiController";
import "./continue-action-screen";
import { customElement } from "./custom-element"; // Your new util
import "./get-meteor-screen";
import { animate_meteor_logo_css } from "./graphical/styles/animate_meteor_logo_css";
import { svg_icons_text } from "./graphical/svg_icons/svg_icons_text";
import { svg_meteor_logo_text } from "./graphical/svg_meteor_logo_text";
import "./meteor-action-button";
import { overlayCloseTriggerContext } from "./meteor-action-ui-context";
import "./meteor-action-ui-executing";
import "./meteor-mobile-bridge-panel";
import type { MobileBridgeSession } from "../../target_clients/mobile_bridge/MobileBridgeSession";
import { getVisibleActionTargets } from "../action-ui-targets";

@customElement("meteor-action-ui-container")
export class MeteorActionUiContainer extends LitElement {
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

  static styles = [
    unsafeCSS(animate_meteor_logo_css),
    css`
      :host {
        --meteor-dark-gray-lightest: 34, 34, 41;
        --meteor-dark-gray-standard: 27, 27, 38;
        --meteor-dark-gray-darkest: 14, 14, 23;

        --meteor-text-on-dark-light: 220, 220, 255;
        --meteor-text-on-dark-standard: 190, 190, 230;
        --meteor-text-on-dark-dark: 154, 151, 190;
        display: block;
        width: 100%;
        height: 100%;
      }

      /* Add your styles here */
      .modal {
        font-family: 'Gilroy', Inter, sans-serif;
        font-weight: 500;
        font-style: normal;
        background:
          radial-gradient(130% 55% at 50% -12%, rgba(98, 63, 220, 0.22), rgba(98, 63, 220, 0) 62%),
          linear-gradient(135deg, rgb(var(--meteor-dark-gray-darkest)) 0%, rgb(var(--meteor-dark-gray-standard)) 150%);
        color: rgb(var(--meteor-text-on-dark-light));
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
        width: 100%;
        height: 100%;
        margin: auto;
        text-align: center;
        z-index: 10001;
      }

      h2 {
        font-size: 1rem;
      }

      p {
        margin: 0;
      }

      .meteor-connect-title-box {
        display: flex;
        flex-direction: row;
        gap: 0.65rem;
        min-height: 3.7rem;
        padding: 0.45rem 0.75rem;
        box-sizing: border-box;
        /* background: rgba(255, 255, 255, 0.3); */
        /* background: linear-gradient(140deg, rgba(var(--meteor-topbar-blue-lightest), 0.8) 0%, rgba(var(--meteor-topbar-blue-standard), 0.5) 100%); */
        border-bottom: 1px solid rgb(var(--meteor-dark-gray-lightest));
        /* border-radius: 0.75rem; */
        align-items: center;
        justify-content: space-between;
      }

      .meteor-logo-and-title {
        display: flex;
        flex-direction: row;
        gap: 0.7rem;
        align-items: center;
      }

      #meteor_svg_logo {
        filter: drop-shadow(-0.1rem 0.1rem 0.2em rgba(0, 0, 20, 0.15));
        //filter: drop-shadow(0 -0.2em rgba(255, 255, 255, 0.5));
      }

      .meteor-logo {
        width: 2.85rem;
        height: 2.85rem;
        margin: -0.1rem;
        /* padding: 0em 0.2em 0.7em 0.7rem; */
        border-radius: 100%;
        /* background: rgba(255, 255, 255, 0.5); */
        background: linear-gradient(45deg, rgba(var(--meteor-topbar-blue-standard), 0.85) 0%, rgba(43, 51, 123, 0.65) 15%, rgba(var(--meteor-topbar-blue-lightest), 0.05));
      }

      .meteor-logo svg {
        width: 85%;
        height: 85%;
        margin-top: 0rem;
        margin-left: 0.5rem;
      }

      .close-circle {
        width: 2.75rem;
        height: 2.75rem;
        margin: 0;
        display: flex;
        flex-direction: column;
        align-items: center;  
        justify-content: center;
        border-radius: 100%;
        background: rgba(255, 255, 255, 0);
        filter: drop-shadow(0 0.05rem 0.07rem rgba(0, 0, 0, 0.5));
        cursor: pointer;
        transition: background 150ms ease;
        border: 0;
        padding: 0;
        color: inherit;
        font: inherit;
      }

      .close-circle:hover {
        background: rgba(255, 255, 255, 0.07);
      }

      .close-circle:focus-visible {
        outline: 2px solid rgba(155, 140, 255, 0.9);
        outline-offset: 1px;
      }

      .close-circle svg {
        width: 34%;
        height: 34%;
        color: rgba(var(--meteor-text-on-dark-light), 1);
        /* color: rgba(0, 0, 0, 0.2); */
        /* box-shadow: 0 0 15px 6px inset rgba(0,0,0, 1); */
        /* filter: drop-shadow(0 -1px 0 rgba(255, 255, 255, 0.2)); */
      }

      .title-text-box {
        display: flex;
        flex-direction: column;
        gap: 0.22rem;
        justify-content: center;
        align-items: flex-start;
      }

      .title-text-box .title {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 700;
        line-height: 0.9em;
        letter-spacing: 0.03rem;
        color: rgba(255, 255, 255, 0.9);
        filter: drop-shadow(0 0.05rem 0.07rem rgba(0, 0, 0, 0.3));
      }

      .title-text-box .subtitle {
        margin: 0;
        font-size: 0.68rem;
        font-weight: 700;
        line-height: 0.9em;
        letter-spacing: 0.24rem;
        text-transform: uppercase;
        color: rgba(180, 180, 255, 1);
      }

      .title-text-box .subsection-title {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 500;
        letter-spacing: 0.02rem;
        color: rgba(255, 255, 255, 0.9);
        filter: drop-shadow(0 0.05rem 0.07rem rgba(0, 0, 0, 0.3));
      }

      .connect-link-gif-box {
        flex-grow: 1;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .link-gif {
        max-width: 10rem;
        object-fit: contain;
        opacity: 0.35;
      }

      .options {
        padding: 0;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 0.4rem;
        align-items: center;
      }

      .meteor-connect-content {
        position: relative;
        padding: 0.5rem 0.9rem 0.6rem;
        display: flex;
        flex-direction: column;
        /* justify-content: space-evenly; */
        justify-content: flex-start;
        flex-grow: 1;
        gap: 0.45rem;
        overflow-y: auto;
        min-height: 0;
      }

      .meteor-connect-content.contextual {
        justify-content: center;
      }

      .meteor-connect-content::-webkit-scrollbar {
        width: 0.35rem;
      }

      .meteor-connect-content::-webkit-scrollbar-thumb {
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.14);
      }

      .background-graphics-box {
        position: absolute;
        top: 5%;
        left: 10%;
        right: 10%;
        bottom: 25%;
        z-index: -1;
        background: radial-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0) 70%);
      }

      .background-graphics-box img {
        filter: blur(0.5px) brightness(1.5);
        opacity: 0.2;
        width: 100%;
        height: 100%;
        object-fit: cover;
        pointer-events: none;
        user-select: none;
      }

      .section-action-title {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        color: rgba(var(--meteor-text-on-dark-dark), 1);
        letter-spacing: 0.08rem;
        filter: drop-shadow(0 0.05rem 0.07rem rgba(0, 0, 0, 0.4));
      }

      .option-buttons-row {
        display: flex;
        flex-direction: column;
        width: 100%;
        justify-content: center;
        align-items: stretch;
        gap: 0.4rem;
      }

      .divider {
        display: flex;
        align-items: center;
        justify-content: center;
        /* margin: 0.5rem 0; */
      }

      .divider .section-action-title {
        flex-shrink: 0;
        margin: 0 0.7rem;
      }

      .divider .divider-line {
        flex-grow: 1;
        height: 1px;
        background: rgba(255, 255, 255, 0.2);
      }

      .no-wallet-bottom-section {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 0.45rem;
        margin-top: auto;
      }

      .qr-section {
        height: 190px;
        box-sizing: border-box;
        // width: 100%;
        display: flex;
        align-items: center;
        // flex-gap: 1rem;
        justify-content: center;
        padding: 1rem;
        border-radius: 1rem;
        background: rgba(var(--meteor-dark-gray-darkest), 1);
        box-shadow: inset 0 4px 20px rgba(0, 0, 0, 0.3);
      }

      .qr-container {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        align-items: center;
        justify-content: center;
      }

      .qr-code-target {
        width: 130px;
        height: 130px;
        display: grid;
        place-items: center;
        background: white;
        border-radius: 0.75rem;
        padding: 0.25rem;
        box-sizing: border-box;
      }

      .qr-helper {
        font-size: 0.8rem;
        line-height: 1rem;
        font-weight: 500;
        color: rgba(var(--meteor-text-on-dark-dark), 1);
      }

      /* Content transition animations */
      @keyframes fadeInContent {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fadeOutContent {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(-8px);
        }
      }

      @keyframes contentFadeOut {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }

      .meteor-connect-content {
        animation: fadeInContent 300ms ease-out forwards;
      }

      meteor-action-ui-executing {
        animation: fadeInContent 300ms ease-out forwards;
      }

      get-meteor-screen {
        animation: fadeInContent 300ms ease-out forwards;
      }

      continue-action-screen {
        animation: fadeInContent 300ms ease-out forwards;
      }

      .meteor-connect-title-box {
        animation: fadeInContent 280ms ease-out forwards;
        animation-delay: 40ms;
      }

      /* Apply fade out to content when parent overlay is closing */
      :host-context(meteor-action-ui-overlay[closing]) .meteor-connect-content,
      :host-context(meteor-action-ui-overlay[closing]) meteor-action-ui-executing,
      :host-context(meteor-action-ui-overlay[closing]) get-meteor-screen,
      :host-context(meteor-action-ui-overlay[closing]) continue-action-screen,
      :host-context(meteor-action-ui-overlay[closing]) .meteor-connect-title-box {
        animation: contentFadeOut 200ms ease-in forwards;
      }
    `,
  ];

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
    this.actionController = new ActionUiController(this, this.action, this.closeAction);
    this.removeExecutionListener = this.action.addExecutionStateListener((executionState) => {
      this.executionState = executionState;
      this.logger.log("Received execution state update in container", executionState);
    });

    this.executionState = this.action.getExecutionState();
    void this.actionController.prepareMobileBridge().then((session) => {
      this.mobileSession = session;
    });
  }

  disconnectedCallback(): void {
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

    const allPlatformTargets = this.action
      .getAllExecutionTargetConfigs()
      .map((target) => target.executionTarget);
    const contextualExecutionTarget = this.action.getActionKnownContextualTarget();
    const mobileExecuting =
      this.executionState.isExecuting &&
      this.executionState.targetedPlatform === "v2_bridge_mobile";
    const lockedExecutionTarget =
      contextualExecutionTarget ?? (mobileExecuting ? "v2_bridge_mobile" : undefined);
    const availablePlatformTargets = getVisibleActionTargets(
      allPlatformTargets,
      lockedExecutionTarget,
    );
    const isPlatformLocked = lockedExecutionTarget != null;
    const includeWebDevLocalhost = availablePlatformTargets.includes("v1_web_localhost");

    const extensionWalletAvailable = availablePlatformTargets.includes("v1_ext");
    const webWalletAvailable = availablePlatformTargets.includes("v1_web");
    const mobileWalletAvailable = availablePlatformTargets.includes("v2_bridge_mobile");
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
            <div class="background-graphics-box">
              <img src="https://storage.googleapis.com/meteor-apps-v2/graphics/meteor_connect_ui/star.gif" alt="Meteor Background Stars" class="star-gif" />
            </div>
            ${
              !isPlatformLocked &&
              (extensionWalletAvailable || webWalletAvailable || includeWebDevLocalhost)
                ? html`
            <div class="options" aria-label="Platform choices">
              <span class="section-action-title">Choose your platform</span>
              <div class="option-buttons-row">
              ${
                extensionWalletAvailable
                  ? html`<meteor-action-button
                  variant="option"
                  label="Chrome Extension"
                  .icon=${svg_icons_text.icon_chrome}
                  @meteor-button-click=${() => this.actionController.executeAction("v1_ext")}
                ></meteor-action-button>`
                  : ""
              }
              ${
                webWalletAvailable
                  ? html`<meteor-action-button
                  variant="option"
                  label="Web App"
                  .icon=${svg_icons_text.icon_web_globe}
                  @meteor-button-click=${() => this.actionController.executeAction("v1_web")}
                ></meteor-action-button>`
                  : ""
              }
                ${
                  includeWebDevLocalhost
                    ? html`
                      <meteor-action-button
                        variant="option"
                        label="Dev Web (Localhost)"
                        .icon=${svg_icons_text.icon_web_globe}
                        @meteor-button-click=${() => this.actionController.executeAction("v1_web_localhost")}
                      ></meteor-action-button>
                    `
                    : ""
                }
              </div>
            </div>`
                : ""
            }
            ${
              mobileWalletAvailable
                ? html`
              <meteor-mobile-bridge-panel
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
            ${
              !isPlatformLocked
                ? html`<div class="no-wallet-bottom-section">
              <div class="divider">
                <span class="divider-line"></span>
                <span class="section-action-title">Don't have a wallet?</span>
                <span class="divider-line"></span>
              </div>
              <div class="options">
                <meteor-action-button variant="primary"
                  label="Get Meteor Wallet"
                  @meteor-button-click=${() => {
                    console.log("Get Meteor Wallet clicked");
                    this.showGetMeteor = true;
                    // window.open("https://meteorwallet.app", "_blank", "noopener");
                  }}
                ></meteor-action-button>
              </div>
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
              ${unsafeSVG(svg_meteor_logo_text)}
            </div>
            <div class="title-text-box">
              <span class="title">Meteor</span>
              <span class="subtitle">Connect</span>
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
