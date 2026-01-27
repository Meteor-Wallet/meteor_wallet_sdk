import { css, html, LitElement } from "lit";
import { property, query } from "lit/decorators.js"; // You MUST import this explicitly
import QRCodeStyling from "qr-code-styling";
import type { ExecutableAction } from "../../action/ExecutableAction.ts";
import { ActionUiController } from "./ActionUiController.ts";
import { customElement } from "./custom-element"; // Your new util

@customElement("meteor-action-ui-container")
export class MeteorActionUiContainer extends LitElement {
  @property({ type: Object }) action!: ExecutableAction<any>;
  @property({ attribute: false }) cleanupUi?: () => void;

  static styles = css`
    /* Add your styles here */
    .modal {
      background: linear-gradient(135deg, rgb(66, 44, 255) 0%, rgb(75, 45, 131) 100%);
      color: white;
      box-sizing: border-box;
      padding: 1.5em;
      position: relative;
      overflow: hidden;
      width: 100%;
      height: 100%;
      margin: auto;
      text-align: center;
      z-index: 10001;
    }

    .options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: center;
    }

    .options button {
      width: 100%;
      max-width: 260px;
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      border: none;
      background: rgba(255, 255, 255, 0.12);
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: transform 120ms ease, background 120ms ease;
    }

    .options button:hover {
      background: rgba(255, 255, 255, 0.16);
      transform: translateY(-1px);
    }

    .qr-section {
      width: 100%;
      max-width: 320px;
      margin-top: 1.5rem;
      padding: 1rem;
      border-radius: 1rem;
      background: rgba(0, 0, 0, 0.18);
    }

    .qr-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: center;
      justify-content: center;
    }

    .qr-code-target {
      width: 170px;
      height: 170px;
      display: grid;
      place-items: center;
      background: white;
      border-radius: 0.75rem;
      padding: 0.5rem;
      box-sizing: border-box;
    }

    .qr-helper {
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.9);
    }
  `;

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
        width: 150,
        height: 150,
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
        <div class="meteor-logo-animated">
          
        </div>
        <h2>Choose a Platform</h2>
        
        <div class="options">
          <button @click=${() => this.actionController.executeAction("v1_ext")}>
              Continue with Browser Extension
          </button>
          <button @click=${() => this.actionController.executeAction("v1_web")}>
            Continue with Web App
          </button>

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
      </div>
    `;
  }
}
