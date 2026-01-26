import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { MeteorLogger } from "../../logging/MeteorLogger.ts";
import { METEOR_ACTION_UI_POPUP_PARENT_ID } from "../action_ui.static.ts";

@customElement("meteor-action-ui-overlay")
export class MeteorActionUiOverlay extends LitElement {
  private logger = MeteorLogger.createLogger("MeteorConnect:MeteorActionUiOverlay");
  @property({ type: Function }) closeAction: (() => void) | null = null;

  /* 
  position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "10000",
  */

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
    `;

  private _handleOverlayClick() {
    this.logger.log("Overlay clicked, removing overlay");
    this.remove();
  }

  // connectedCallback() {
  //   super.connectedCallback();
  //   // this.actionController = new ActionUiController(this, this.action);
  // }

  render() {
    this.logger.log("Rendering MeteorActionUiOverlay");

    return html`
      <div @click=${() => {
        this.logger.log("Overlay clicked");
        this._handleOverlayClick();
      }} id="${METEOR_ACTION_UI_POPUP_PARENT_ID}">
        <div class="modal-container" >
          <slot></slot>
        </div>
      </div>
    `;
  }
}

// /* @click=${(e: Event) => e.stopPropagation()} */
