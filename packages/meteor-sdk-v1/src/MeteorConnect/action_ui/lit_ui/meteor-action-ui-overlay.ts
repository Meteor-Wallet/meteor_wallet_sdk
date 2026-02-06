import { provide } from "@lit/context";
import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js"; // You MUST import this explicitly
import { MeteorLogger } from "../../logging/MeteorLogger";
import { METEOR_ACTION_UI_POPUP_PARENT_ID } from "../action_ui.static";
import { customElement } from "./custom-element"; // Your new util
import { overlayCloseTriggerContext } from "./meteor-action-ui-context";

@customElement("meteor-action-ui-overlay")
export class MeteorActionUiOverlay extends LitElement {
  private logger = MeteorLogger.createLogger("MeteorConnect:<meteor-action-ui-overlay>");

  private _originalCloseAction: (() => void) | null = null;
  private _wrappedCloseAction: (() => void) | null = null;

  // Wrap closeAction to always use animated close
  @property({ type: Function })
  set closeAction(value: (() => void) | null) {
    this._originalCloseAction = value;
    // Create wrapped version that triggers animation
    this._wrappedCloseAction = value ? () => this._animateClose() : null;
  }
  get closeAction(): (() => void) | null {
    return this._wrappedCloseAction;
  }

  @property({ type: Boolean }) private closing: boolean = false;

  @provide({ context: overlayCloseTriggerContext })
  @property({ attribute: false })
  private overlayCloseTrigger = () => this._animateClose();

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

      @keyframes fadeOut {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }

      @keyframes scaleOutDown {
        from {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
        to {
          opacity: 0;
          transform: scale(0.95) translateY(8px);
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
        /* filter: blur(20px); */
        /* filter: blur(0.5px) drop-shadow(0 0 2px rgba(0, 0, 0, 0.3)); */
      }

      :host(:not([closing])) {
        animation: fadeIn 300ms ease-out forwards;
      }

      :host([closing]) {
        animation: fadeOut 250ms ease-in forwards;
      }

      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(20px);
      }

      :host(:not([closing])) .modal-backdrop {
        animation: fadeIn 300ms ease-out forwards;
      }

      :host([closing]) .modal-backdrop {
        animation: fadeOut 250ms ease-in forwards;
      }

      .modal-container {
        z-index: 2;
        height: 556px;
        width: 415px;
        border-radius: 1.2em;
        border: 1px solid #2b2d38;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      :host(:not([closing])) .modal-container {
        animation: scaleInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      :host([closing]) .modal-container {
        animation: scaleOutDown 250ms ease-in forwards;
      }
    `;

  private _handleOverlayClick() {
    if (this.closing) return; // Prevent multiple close triggers
    this.logger.log("Overlay backdrop clicked, closing with animation");
    this._animateClose();
  }

  private _animateClose() {
    if (this.closing) return;
    this.logger.log("Starting close animation");
    this.closing = true;

    // Wait for animation to complete before actually closing
    setTimeout(() => {
      // Call the original closeAction to perform actual cleanup
      if (this._originalCloseAction) {
        try {
          this._originalCloseAction();
        } catch (e) {
          this.logger.log("Error during closeAction", e);
        }
      } else {
        this.remove();
      }
    }, 250); // Match the fadeOut animation duration
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
    this.logger.log("Rendering MeteorActionUiOverlay", { closing: this.closing });

    // Update the closing attribute for CSS selector
    if (this.closing) {
      this.setAttribute("closing", "");
    } else {
      this.removeAttribute("closing");
    }

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
