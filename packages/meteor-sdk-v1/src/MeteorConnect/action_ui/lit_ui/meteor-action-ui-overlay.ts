import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js"; // You MUST import this explicitly
import { MeteorLogger } from "../../logging/MeteorLogger.ts";
import { METEOR_ACTION_UI_POPUP_PARENT_ID } from "../action_ui.static.ts";
import { customElement } from "./custom-element"; // Your new util

@customElement("meteor-action-ui-overlay")
export class MeteorActionUiOverlay extends LitElement {
  private logger = MeteorLogger.createLogger("MeteorConnect:MeteorActionUiOverlay");
  @property({ type: Function }) closeAction: (() => void) | null = null;

  static styles = css`
      :host {
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        position: fixed;
        z-index: 10000;
        pointer-events: auto;
      }

      .modal-container {
        height: 556px;
        width: 415px;
        border-radius: 1.2em;
        border: 1px solid #2b2d38;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
    `;

  private _handleOverlayClick() {
    this.logger.log("Overlay clicked, closing overlay");
    // Prefer invoking provided cleanup to reset ActionUi state
    if (this.closeAction) {
      try {
        this.closeAction();
      } catch (e) {
        this.logger.log("Error during closeAction", e);
      }
    } else {
      this.remove();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    // Ensure cleanup recognizes this as the popup overlay container
    this.id = METEOR_ACTION_UI_POPUP_PARENT_ID;
    // Register click on the host so backdrop clicks are captured
    this.addEventListener("click", this._handleOverlayClick);
  }

  disconnectedCallback(): void {
    // Clean up the listener to avoid leaks
    this.removeEventListener("click", this._handleOverlayClick);
    super.disconnectedCallback();
  }

  render() {
    if (import.meta.hot) {
      import.meta.hot.accept();
    }
    this.logger.log("Rendering MeteorActionUiOverlay");

    return html`
      <div>
        <div class="modal-container" @click=${(e: Event) => e.stopPropagation()}>
          <slot></slot>
        </div>
      </div>
    `;
  }
}

// /* @click=${(e: Event) => e.stopPropagation()} */
