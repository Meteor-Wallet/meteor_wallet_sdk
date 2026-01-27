import { css, html, LitElement, unsafeCSS } from "lit";
import { property, query } from "lit/decorators.js"; // You MUST import this explicitly
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import QRCodeStyling from "qr-code-styling";
import type { ExecutableAction } from "../../action/ExecutableAction";
import { ActionUiController } from "./ActionUiController";
import { customElement } from "./custom-element"; // Your new util
import animateLogoStyles from "./graphical/animate_meteor_logo.scss?inline";
import meteorLogoSvgOther from "./graphical/logo_svg_animate_grouped.svg?raw";

// color on tip of meteor
// rgb(77, 134, 232)

// color on tail of meteor
// rgb(43, 51, 123)

@customElement("meteor-action-ui-container")
export class MeteorActionUiContainer extends LitElement {
  @property({ type: Object }) action!: ExecutableAction<any>;
  @property({ attribute: false }) cleanupUi?: () => void;

  static styles = [
    unsafeCSS(animateLogoStyles),
    css`
      /* Add your styles here */
      .modal {
        font-family: 'Gilroy';
        font-weight: 500;
        font-style: normal;
        background: linear-gradient(135deg, rgb(28, 28, 69) 0%, rgb(45, 34, 100) 60%, rgb(66, 44, 150) 100%);
        color: white;
        box-sizing: border-box;
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
        background: linear-gradient(140deg, rgba(87, 144, 242, 0.7) 0%, rgba(136, 114, 255, 0.5) 47%, rgba(145, 115, 201, 0.15) 100%);
        border-bottom: 1px solid rgb(25, 25, 60);
        /* border-radius: 0.75rem; */
        align-items: center;
        justify-content: start;
      }

      #meteor_svg_logo {
        filter: drop-shadow(-0.1rem 0.1rem 0.2em rgba(10, 40, 120, 0.15));
        //filter: drop-shadow(0 -0.2em rgba(255, 255, 255, 0.5));
      }

      .meteor-logo {
        width: 3.8em;
        height: 3.8em;
        /* padding: 0em 0.2em 0.7em 0.7rem; */
        border-radius: 100%;
        /* background: rgba(255, 255, 255, 0.5); */
        background: linear-gradient(45deg, rgba(23, 31, 85, 0.85) 0%, rgba(43, 51, 123, 0.65) 15%, rgba(77, 134, 232, 0.05));
      }

      .meteor-logo svg {
        width: 85%;
        height: 85%;
        margin-top: 0rem;
        margin-left: 0.5rem;
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
        color: rgba(255, 255, 255, 0.9);
        filter: drop-shadow(0 0.05rem 0.07rem rgba(0, 0, 0, 0.3));
      }

      .title-text-box .subtitle {
        margin: 0;
        font-size: 0.8rem;
        font-weight: 700;
        line-height: 0.9em;
        letter-spacing: 0.27rem;
        text-transform: uppercase;
        color: rgba(160, 160, 255, 1);
        /* filter: drop-shadow(0 0.05rem 0.07rem rgba(25, 25, 75, 0.3)); */
        /* color: rgba(15, 15, 49, 1); */
        /* filter: drop-shadow(0 0.05rem 0.07rem rgba(220, 200, 255, 0.3)); */
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
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: center;
      }

      .meteor-connect-content {
        padding: 1rem;
      }

      .section-action-title {
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        color: rgba(170, 160, 255, 0.8);
        letter-spacing: 0.08rem;
        margin-bottom: 0.5rem;
        filter: drop-shadow(0 0.05rem 0.07rem rgba(0, 0, 0, 0.4));
      }

      .option-buttons-row {
        display: flex;
        flex-direction: row;
        width: 100%;
        justify-content: center;
        align-items: center;
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
        margin: 0.5rem 0;
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

      .qr-section {
        // width: 100%;
        display: flex;
        align-items: center;
        // flex-gap: 1rem;
        justify-content: center;
        padding: 1rem;
        border-radius: 1rem;
        background: rgba(0, 0, 0, 0.18);
      }

      .qr-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: center;
        justify-content: center;
      }

      .qr-code-target {
        width: 150px;
        height: 150px;
        display: grid;
        place-items: center;
        background: white;
        border-radius: 0.75rem;
        padding: 0.5rem;
        box-sizing: border-box;
      }

      .qr-helper {
        font-size: 0.8rem;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.65);
      }
    `,
  ];

  private actionController!: ActionUiController;
  @query("#qr-code-target") private qrCodeTarget?: HTMLDivElement;
  private qrCode?: QRCodeStyling;
  private lastQrValue?: string;

  connectedCallback() {
    super.connectedCallback();
    this.actionController = new ActionUiController(this, this.action, this.cleanupUi);
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
        width: 130,
        height: 130,
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
    return html`
      <div class="modal">
        <div class="meteor-connect-title-box">
          <div class="meteor-logo">
            ${unsafeSVG(meteorLogoSvgOther)}
          </div>
          <div class="title-text-box">
            <span class="title">Meteor</span>
            <span class="subtitle">Connect</span>
          </div>
        </div>
        <div class="meteor-connect-content">
          <span class="section-action-title">Choose your wallet</span>
          <div class="options">
            <div class="option-buttons-row">
              <button @click=${() => this.actionController.executeAction("v1_ext")}>
                Browser Extension
              </button>
              <button @click=${() => this.actionController.executeAction("v1_web")}>
                Web App
              </button>
            </div>
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
          </div>
          <div class="divider">
            <span class="divider-line"></span>
            <span class="section-action-title">Don't have a wallet?</span>
            <span class="divider-line"></span>
          </div>
          <div class="options">
            <div class="option-buttons-row">
              <button @click=${() => this.actionController.executeAction("v1_web")}>
                Android
              </button>
              <button @click=${() => this.actionController.executeAction("v1_web")}>
                iOS
              </button>
              <button @click=${() => this.actionController.executeAction("v1_web")}>
                Extension
              </button>
              <button @click=${() => this.actionController.executeAction("v1_web")}>
                Web
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
