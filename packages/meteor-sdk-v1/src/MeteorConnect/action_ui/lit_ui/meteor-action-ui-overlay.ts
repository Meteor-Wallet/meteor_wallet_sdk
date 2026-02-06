import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js"; // You MUST import this explicitly
import { MeteorLogger } from "../../logging/MeteorLogger";
import { METEOR_ACTION_UI_POPUP_PARENT_ID } from "../action_ui.static";
import { customElement } from "./custom-element"; // Your new util

@customElement("meteor-action-ui-overlay")
export class MeteorActionUiOverlay extends LitElement {
  private logger = MeteorLogger.createLogger("MeteorConnect:<meteor-action-ui-overlay>");
  @property({ type: Function }) closeAction: (() => void) | null = null;

  static styles = css`
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes scaleInUp {
        from {
          opacity: 0;
          transform: scale(0.92) translateY(10px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      :host {
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        position: fixed;
        z-index: 10000;
        pointer-events: auto;
        animation: fadeIn 300ms ease-out forwards;
        /* filter: blur(20px); */
        /* filter: blur(0.5px) drop-shadow(0 0 2px rgba(0, 0, 0, 0.3)); */
      }

      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(20px);
        animation: fadeIn 300ms ease-out forwards;
      }

      .modal-container {
        z-index: 2;
        height: 556px;
        width: 415px;
        border-radius: 1.2em;
        border: 1px solid #2b2d38;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: scaleInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
        <div class="modal-backdrop"></div>
        <div class="modal-container" @click=${(e: Event) => e.stopPropagation()}>
          <slot></slot>
        </div>
      </div>
    `;
  }
}

// /* @click=${(e: Event) => e.stopPropagation()} */
