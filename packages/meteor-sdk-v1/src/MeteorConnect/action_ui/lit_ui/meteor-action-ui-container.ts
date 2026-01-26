import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { ExecutableAction } from "../../action/ExecutableAction.ts";
import { ActionUiController } from "./ActionUiController.ts";

@customElement("meteor-action-ui-container")
export class MeteorActionUiContainer extends LitElement {
  @property({ type: Object }) action!: ExecutableAction<any>;

  static styles = css`
    /* Add your styles here */
    .modal {
      background: black;
      color: white;
      padding: 20px;
      border-radius: 8px;
      border: 2px solid #444;
      position: relative;
      width: 100%;
      height: 100%;
      margin: auto;
      text-align: center;
      z-index: 10001;
    }
  `;

  private actionController!: ActionUiController;

  connectedCallback() {
    super.connectedCallback();
    this.actionController = new ActionUiController(this, this.action);
  }

  render() {
    return html`
      <div class="modal">
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
              complete: (id) => html`
                <div class="qr-container">
                  <qr-code-generator .value=${id}></qr-code-generator>
                  <p>Scan with your mobile device</p>
                </div>
              `,
              error: (e) => html`<p class="error">Failed to load QR: ${e}</p>`,
            })}
          </div>
        </div>
      </div>
    `;
  }
}

/*
<button @click=${this._submit}>Confirm</button>

* <input
        type="text"
        placeholder="Enter value..."
        .value=${this.userInput}
        @input=${(e: any) => (this.userInput = e.target.value)}
      />
* */
