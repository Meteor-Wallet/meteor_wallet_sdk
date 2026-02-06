import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import type { TMeteorConnectionExecutionTarget } from "../../MeteorConnect.types";
import { customElement } from "./custom-element";
import { svg_graphics_text } from "./graphical/svg_graphics/svg_graphics_text";
import { svg_icons_text } from "./graphical/svg_icons/svg_icons_text";

@customElement("get-meteor-screen")
export class GetMeteorScreen extends LitElement {
  @property({ type: Array }) supportedPlatforms: TMeteorConnectionExecutionTarget[] = ["v1_web"];

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: stretch;
      flex-grow: 1;
    }

    .get-meteor-container {
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

    .get-meteor-svg {
      width: 80%;
    }

    .get-meteor-svg svg {
      width: 100%;
      height: 100%;
    }

    .get-meteor-text {
      margin-top: -3rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.3rem;
    }

    .get-meteor-text .get-meteor-title {
      font-size: 2rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 1);
    }

    .get-meteor-text .get-meteor-subtitle {
      font-size: 1em;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.5);
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
    console.log(this.supportedPlatforms);
    const supportsWeb = this.supportedPlatforms.includes("v1_web");
    const supportsExtension = this.supportedPlatforms.includes("v1_ext");
    const supportsMobile =
      this.supportedPlatforms.includes("v2_rid_mobile_deep_link") ||
      this.supportedPlatforms.includes("v2_rid_qr_code");

    return html`
      <div
        class="get-meteor-container"
      >
        <div class="image-and-text">
          <div class="get-meteor-svg">
              ${unsafeSVG(svg_graphics_text.smiling_meteor)}
          </div>
          <div class="get-meteor-text">
            <span class="get-meteor-title">Get Meteor Now!</span>
            <span class="get-meteor-subtitle">Get the most out of your Web3 journey on NEAR</span>
          </div>
        </div>
        <div class="app-buttons">
          ${
            supportsExtension
              ? html`
            <meteor-action-button
              label="Chrome Extension"
              .icon=${svg_icons_text.icon_chrome}
              @meteor-button-click=${() => {
                console.log("Chrome Extension button clicked");
                window.open(
                  "https://chromewebstore.google.com/detail/meteor-wallet/pcndjhkinnkaohffealmlmhaepkpmgkb",
                  "_blank",
                );
              }}
            ></meteor-action-button>`
              : ""
          }
          ${
            supportsWeb
              ? html`
            <meteor-action-button
              label="Web App"
              .icon=${svg_icons_text.icon_web_globe}
              @meteor-button-click=${() => {
                console.log("Web App button clicked");
                window.open("https://wallet.meteorwallet.app", "_blank");
              }}
            ></meteor-action-button>`
              : ""
          }
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "get-meteor-screen": GetMeteorScreen;
  }
}
