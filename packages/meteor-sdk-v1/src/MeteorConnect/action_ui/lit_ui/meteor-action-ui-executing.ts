import { css, html, LitElement, unsafeCSS } from "lit";
import { property } from "lit/decorators.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import type { TMeteorConnectionExecutionTarget } from "../../MeteorConnect.types";
import { customElement } from "./custom-element";
import { animate_meteor_logo_css } from "./graphical/styles/animate_meteor_logo_css";
import { svg_meteor_logo_text } from "./graphical/svg_meteor_logo_text";
import { getIconSvgTextForTargetedPlatform } from "./utils/getIconSvgTextForTargetedPlatform";

@customElement("meteor-action-ui-executing")
export class MeteorActionUiExecuting extends LitElement {
  @property({ type: String }) executingForPlatform: TMeteorConnectionExecutionTarget | "unset" =
    "unset";

  static styles = [
    unsafeCSS(animate_meteor_logo_css),
    css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: stretch;
      flex-grow: 1;
    }

    .execution-action-container {
      position: relative;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      align-items: center;
      justify-content: space-evenly;
    }

    .meteor-logo {
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.2;
    }

    .meteor-logo svg {
      width: 60%;
      height: 60%;
      margin-bottom: 4rem;
    }

    .execution-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.7rem;
    }

    .execution-action-text {
      color: rgba(255, 255, 255, 1);
    }

    .execution-target-icon {
      width: 3em;
      height: 3em;
      border-radius: 9999px;
      background-color: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .execution-target-icon svg {
      width: 70%;
      height: 70%;
      opacity: 0.5;
      color: black;
      filter: drop-shadow(0 2px 15px rgba(0, 0, 0, 0.8));
    }
  `,
  ];

  render() {
    console.log(
      "Rendering MeteorActionUiExecuting with executingForPlatform:",
      this.executingForPlatform,
    );

    return html`
      <div
        class="execution-action-container"
      >
        <div class="meteor-logo">
          ${unsafeSVG(svg_meteor_logo_text)}
        </div>
        <div class="execution-info">
          <div class="execution-target-icon">${unsafeSVG(getIconSvgTextForTargetedPlatform(this.executingForPlatform))}</div>
          <span class="execution-action-text">Complete your request in Meteor Wallet</span>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "meteor-action-ui-executing": MeteorActionUiExecuting;
  }
}
