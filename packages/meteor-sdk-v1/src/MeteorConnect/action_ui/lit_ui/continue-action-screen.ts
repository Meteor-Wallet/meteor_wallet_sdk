import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import type { TMeteorConnectionExecutionTarget } from "../../MeteorConnect.types";
import { customElement } from "./custom-element";
import { svg_graphics_text } from "./graphical/svg_graphics/svg_graphics_text";
import { svg_icons_text } from "./graphical/svg_icons/svg_icons_text";
import "./meteor-action-button";

// Helper function to get platform display name and icon
function getPlatformInfo(target: TMeteorConnectionExecutionTarget) {
  switch (target) {
    case "v1_ext":
      return {
        displayName: "Chrome Extension",
        icon: svg_icons_text.icon_chrome,
        description: "Use Meteor Wallet in your browser extension",
      };
    case "v1_web":
    case "v1_web_localhost":
      return {
        displayName: "Web App",
        icon: svg_icons_text.icon_web_globe,
        description: "Use Meteor Wallet on the web",
      };
    case "v2_rid_mobile_deep_link":
      return {
        displayName: "Mobile App",
        icon: svg_icons_text.icon_android,
        description: "Open Meteor Wallet on your mobile device",
      };
    case "v2_rid_qr_code":
      return {
        displayName: "Scan QR Code",
        icon: svg_icons_text.icon_extension_puzzle,
        description: "Scan with your mobile device",
      };
    case "test":
    case "test_rid_deep_link":
    case "test_rid_qr_code":
      return {
        displayName: "Test Platform",
        icon: svg_icons_text.icon_web_globe,
        description: "Test execution target",
      };
    default:
      return {
        displayName: "Meteor Wallet",
        icon: svg_icons_text.icon_web_globe,
        description: "Continue with Meteor Wallet",
      };
  }
}

@customElement("continue-action-screen")
export class ContinueActionScreen extends LitElement {
  @property({ type: String }) executionTarget: TMeteorConnectionExecutionTarget = "v1_web";
  @property() onContinue?: () => void;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: stretch;
      flex-grow: 1;
    }

    .continue-action-container {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      align-items: center;
      justify-content: space-evenly;
    }

    .image-and-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .continue-action-svg {
      width: 80%;
    }

    .continue-action-svg svg {
      width: 100%;
      height: 100%;
    }

    .continue-action-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.3rem;
      text-align: center;
    }

    .continue-action-title {
      font-size: 1.2em;
      font-weight: 700;
      color: rgba(255, 255, 255, 1);
    }

    .app-buttons {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 1.2rem;
      flex-wrap: wrap;
    }
  `;

  render() {
    const platformInfo = getPlatformInfo(this.executionTarget);

    return html`
      <div class="continue-action-container">
        <div class="image-and-text">
          <div class="continue-action-svg">
            ${unsafeSVG(svg_graphics_text.smiling_meteor)}
          </div>

          <div class="continue-action-text">
            <span class="continue-action-title">Continue on your chosen platform</span>
          </div>
        </div>

        <div class="app-buttons">
          <meteor-action-button
            variant="primary"
            label=${`Open ${platformInfo.displayName}`}
            .icon=${platformInfo.icon}
            @meteor-button-click=${this._handleContinue}
          ></meteor-action-button>
        </div>
      </div>
    `;
  }

  private _handleContinue() {
    if (this.onContinue) {
      this.onContinue();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "continue-action-screen": ContinueActionScreen;
  }
}
