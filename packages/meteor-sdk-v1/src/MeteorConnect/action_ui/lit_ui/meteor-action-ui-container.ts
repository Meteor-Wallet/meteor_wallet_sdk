import { css, html, LitElement, unsafeCSS } from "lit";
import { property, query } from "lit/decorators.js"; // You MUST import this explicitly
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import QRCodeStyling from "qr-code-styling";
import type { ExecutableAction } from "../../action/ExecutableAction";
import { MeteorLogger } from "../../logging/MeteorLogger";
import { ActionUiController } from "./ActionUiController";
import { customElement } from "./custom-element"; // Your new util
import { animate_meteor_logo_css } from "./graphical/styles/animate_meteor_logo_css";
import { svg_icons_text } from "./graphical/svg_icons/svg_icons_text";
import { svg_meteor_logo_text } from "./graphical/svg_meteor_logo_text";
import "./meteor-action-button";
import "./get-meteor-screen";
import "./meteor-action-ui-executing";
import { consume } from "@lit/context";
import type { IMCActionExecutionState } from "../../action/mc_action.types";
import { overlayCloseTriggerContext } from "./meteor-action-ui-context";

@customElement("meteor-action-ui-container")
export class MeteorActionUiContainer extends LitElement {
  private logger = MeteorLogger.createLogger("MeteorConnect:<meteor-action-ui-container>");

  @property({ type: Object }) action!: ExecutableAction<any>;
  @property({ type: Function }) closeAction: (() => void) | undefined = undefined;
  @property({ type: Boolean })
  showGetMeteor: boolean = false;
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
        --meteor-text-on-dark-dark: 100, 100, 140;
      }

      /* Add your styles here */
      .modal {
        font-family: 'Gilroy', Inter, sans-serif;
        font-weight: 500;
        font-style: normal;
        background: linear-gradient(135deg, rgb(var(--meteor-dark-gray-darkest)) 0%, rgb(var(--meteor-dark-gray-standard)) 150%);
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
        gap: 0.7rem;
        padding: 0.7rem;
        /* background: rgba(255, 255, 255, 0.3); */
        /* background: linear-gradient(140deg, rgba(var(--meteor-topbar-blue-lightest), 0.8) 0%, rgba(var(--meteor-topbar-blue-standard), 0.5) 100%); */
        border-bottom: 1px solid rgb(var(--meteor-dark-gray-lightest));
        /* border-radius: 0.75rem; */
        align-items: center;
        justify-content: space-between
      }

      .meteor-logo-and-title {
        display: flex;
        flex-direction: row;
        gap: 0.85rem;
      }

      #meteor_svg_logo {
        filter: drop-shadow(-0.1rem 0.1rem 0.2em rgba(0, 0, 20, 0.15));
        //filter: drop-shadow(0 -0.2em rgba(255, 255, 255, 0.5));
      }

      .meteor-logo {
        width: 3.6em;
        height: 3.6em;
        margin: -0.2em;
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
        width: 3.6em;
        height: 3.6em;
        margin: -0.2em;
        display: flex;
        flex-direction: column;
        align-items: center;  
        justify-content: center;
        border-radius: 100%;
        background: rgba(255, 255, 255, 0);
        filter: drop-shadow(0 0.05rem 0.07rem rgba(0, 0, 0, 0.5));
        cursor: pointer;
        transition: background 150ms ease;
      }

      .close-circle:hover {
        background: rgba(255, 255, 255, 0.03);
      }

      .close-circle svg {
        width: 30%;
        height: 30%;
        color: rgba(var(--meteor-text-on-dark-light), 1);
        /* color: rgba(0, 0, 0, 0.2); */
        /* box-shadow: 0 0 15px 6px inset rgba(0,0,0, 1); */
        /* filter: drop-shadow(0 -1px 0 rgba(255, 255, 255, 0.2)); */
      }

      .title-text-box {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        justify-content: center;
        align-items: flex-start;
      }

      .title-text-box .title {
        font-family: 'Gilroy';
        margin: 0;
        font-size: 1.65rem;
        font-weight: 700;
        line-height: 0.9em;
        letter-spacing: 0.03rem;
        color: rgba(255, 255, 255, 0.9);
        filter: drop-shadow(0 0.05rem 0.07rem rgba(0, 0, 0, 0.3));
      }

      .title-text-box .subtitle {
        margin: 0;
        font-size: 0.8rem;
        font-weight: 700;
        line-height: 0.9em;
        letter-spacing: 0.3rem;
        text-transform: uppercase;
        color: rgba(180, 180, 255, 1);
      }

      .title-text-box .subsection-title {
        font-family: 'Gilroy';
        margin: 0;
        font-size: 1.2rem;
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
        flex-grow: 1;
        padding: 0.5rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 1.3rem;
        align-items: center;
        /* justify-content: space-between; */
        /* justify-content: space-evenly; */
      }

      .meteor-connect-content {
        position: relative;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        /* justify-content: space-evenly; */
        justify-content: space-between;
        flex-grow: 1;
        gap: 1rem;
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
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        color: rgba(var(--meteor-text-on-dark-dark), 1);
        letter-spacing: 0.08rem;
        filter: drop-shadow(0 0.05rem 0.07rem rgba(0, 0, 0, 0.4));
      }

      .option-buttons-row {
        display: flex;
        flex-direction: row;
        width: 100%;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .option-buttons-row button {
        /* width: 100%;
        max-width: 260px; */
        display: flex;
        padding: 0.75rem 1rem;
        border-radius: 0.75rem;
        border: none;
        background: rgba(255, 255, 255, 0.12);
        color: white;
        font-weight: 700;
        letter-spacing: 0.02rem;
        cursor: pointer;
        transition: transform 120ms ease, background 120ms ease;
      }

      .option-buttons-row button:hover {
        background: rgba(255, 255, 255, 0.16);
        transform: translateY(-1px);
      }

      .divider {
        display: flex;
        align-items: center;
        justify-content: center;
        /* margin: 0.5rem 0; */
      }

      .divider .section-action-title {
        flex-shrink: 0;
        margin: 0 1rem;
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
        gap: 1.3rem;
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

      .meteor-connect-title-box {
        animation: fadeInContent 280ms ease-out forwards;
        animation-delay: 40ms;
      }

      /* Apply fade out to content when parent overlay is closing */
      :host-context(meteor-action-ui-overlay[closing]) .meteor-connect-content,
      :host-context(meteor-action-ui-overlay[closing]) meteor-action-ui-executing,
      :host-context(meteor-action-ui-overlay[closing]) get-meteor-screen,
      :host-context(meteor-action-ui-overlay[closing]) .meteor-connect-title-box {
        animation: contentFadeOut 200ms ease-in forwards;
      }
    `,
  ];

  private actionController!: ActionUiController;
  @query("#qr-code-target") private qrCodeTarget?: HTMLDivElement;
  private qrCode?: QRCodeStyling;
  private lastQrValue?: string;

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
    this.action.addExecutionStateListener((executionState) => {
      this.executionState = executionState;
      this.logger.log("Received execution state update in container", executionState);
    });

    this.executionState = this.action.getExecutionState();
  }

  disconnectedCallback(): void {
    this.qrCode = undefined;
    this.lastQrValue = undefined;
    super.disconnectedCallback();
  }

  // Opt into Vite HMR so edits to this file do not force a full page reload.
  private registerHmrBoundary() {
    if (import.meta.hot) {
      import.meta.hot.accept();
    }
  }

  private queueQrRender(value: string) {
    void this.updateComplete.then(() => this.drawQrCode(value));
  }

  private drawQrCode(value: string) {
    if (!this.qrCodeTarget) return;

    if (!this.qrCode) {
      this.qrCode = new QRCodeStyling({
        width: 120,
        height: 120,
        type: "svg",
        data: value,
        dotsOptions: {
          color: "#22105f",
          type: "rounded",
        },
        backgroundOptions: {
          color: "#ffffff",
        },
      });
    } else if (this.lastQrValue !== value) {
      this.qrCode.update({ data: value });
    }

    this.lastQrValue = value;
    this.qrCodeTarget.innerHTML = "";
    this.qrCode.append(this.qrCodeTarget);
  }

  render() {
    this.registerHmrBoundary();

    const includeWebDevLocalhost =
      this.action
        .getAllExecutionTargetConfigs()
        .find((t) => t.executionTarget === "v1_web_localhost") != null;

    const supportedPlatforms = this.action
      .getAllExecutionTargetConfigs()
      .map((t) => t.executionTarget);

    return html`
      <div class="modal">
        <div class="meteor-connect-title-box">
          <div class="meteor-logo-and-title">
            ${
              this.showGetMeteor
                ? html`
            <div class="close-circle" @click=${() => (this.showGetMeteor = false)}>
              ${unsafeSVG(svg_icons_text.icon_arrow_back)}
            </div>
            <div class="title-text-box">
              <span class="subsection-title">Get Meteor Wallet</span>
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
          <div class="close-circle" @click=${() => this._handleActionClose()}>
            ${unsafeSVG(svg_icons_text.icon_close_x)}
          </div>
        </div>
        ${
          this.executionState.isExecuting
            ? html`<meteor-action-ui-executing .executingForPlatform=${this.executionState.targetedPlatform}></meteor-action-ui-executing>`
            : this.showGetMeteor
              ? html`<get-meteor-screen .supportedPlatforms=${supportedPlatforms}></get-meteor-screen>`
              : html`
          <div class="meteor-connect-content">
            <div class="background-graphics-box">
              <img src="https://storage.googleapis.com/meteor-apps-v2/graphics/meteor_connect_ui/star.gif" alt="Meteor Background Stars" class="star-gif" />
            </div>
            <div class="options">
              <span class="section-action-title">Choose your wallet</span>
              <div class="option-buttons-row">
                <meteor-action-button
                  label="Chrome Extension"
                  .icon=${svg_icons_text.icon_chrome}
                  @meteor-button-click=${() => this.actionController.executeAction("v1_ext")}
                ></meteor-action-button>
                <meteor-action-button
                  label="Web App"
                  .icon=${svg_icons_text.icon_web_globe}
                  @meteor-button-click=${() => this.actionController.executeAction("v1_web")}
                ></meteor-action-button>
                ${
                  includeWebDevLocalhost
                    ? html`
                      <meteor-action-button
                        label="Dev Web (Localhost)"
                        .icon=${svg_icons_text.icon_web_globe}
                        @meteor-button-click=${() => this.actionController.executeAction("v1_web_localhost")}
                      ></meteor-action-button>
                    `
                    : ""
                }
              </div>
            </div>
            <div class="no-wallet-bottom-section">
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
            </div>
          </div>
            `
        }
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
