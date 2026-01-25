import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { ExecutableAction } from "../../action/ExecutableAction.ts";
import { METEOR_ACTION_UI_POPUP_PARENT_ID } from "../action_ui.static.ts";
import { ActionUiController } from "./ActionUiController.ts";

@customElement("meteor-action-ui-overlay")
export class MeteorActionUiOverlay extends LitElement {
  @property({ type: Object }) action!: ExecutableAction<any>;

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
      /* Add your styles here */
      .meteor-popup-overlay {
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
      }
    `;

  private actionController!: ActionUiController;

  connectedCallback() {
    super.connectedCallback();
    this.actionController = new ActionUiController(this, this.action);
  }

  render() {
    return html`
      <div @click=${(e: Event) => {
        if (e.target === e.currentTarget) {
          this.remove();
        }
      }} id="${METEOR_ACTION_UI_POPUP_PARENT_ID}" class="meteor-popup-overlay">
      </div>
    `;
  }
}
