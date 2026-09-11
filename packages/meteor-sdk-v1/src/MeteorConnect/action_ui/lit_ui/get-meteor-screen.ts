import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import type { TMeteorConnectionExecutionTarget } from "../../MeteorConnect.types";
import { meteorConnectLayoutStyles } from "./meteor-connect-layout.styles";
import { isMobile } from "../utils/isMobile";
import { customElement } from "./custom-element";
import { svg_graphics_text } from "./graphical/svg_graphics/svg_graphics_text";
import { svg_icons_text } from "./graphical/svg_icons/svg_icons_text";

const INSTALL_OPTIONS = [
  { label: "Extension", icon: svg_icons_text.icon_chrome, url: "https://chromewebstore.google.com/detail/meteor-wallet/pcndjhkinnkaohffealmlmhaepkpmgkb" },
  { label: "Web", icon: svg_icons_text.icon_web_globe, url: "https://wallet.meteorwallet.app/" },
  { label: "Android", icon: svg_icons_text.icon_google_play, url: "https://play.google.com/store/apps/details?id=app.meteorwallet.v2&hl=en" },
  { label: "iOS", icon: svg_icons_text.icon_ios_apple, url: "https://apps.apple.com/us/app/meteor-wallet/id6739558223" },
];

@customElement("get-meteor-screen")
export class GetMeteorScreen extends LitElement {
  // Kept for caller compatibility: installation choices are independent of action capabilities.
  @property({ type: Array }) supportedPlatforms: TMeteorConnectionExecutionTarget[] = ["v1_web"];

  static styles = [meteorConnectLayoutStyles, css`
    :host { display: flex; height: auto; flex: 1; min-height: 0; overflow-y: auto; font-family: 'Gilroy', sans-serif; }
    .get-meteor-container { display: flex; flex-direction: column; align-items: center; justify-content: safe center; gap: 1.5rem; width: 100%; padding: 1.5rem 1rem 2rem; box-sizing: border-box; }
    .hero { position: relative; width: 230px; height: 230px; flex-shrink: 0; display: grid; place-items: center; }
    .meteor { position: absolute; left: 50%; top: 50%; width: 280px; transform: translate(-50%, -50%); }
    .meteor svg { display: block; width: 100%; height: auto; }
    .copy { text-align: center; display: flex; flex-direction: column; gap: .35rem; }
    h1 { margin: 0; color: #fff; }
    p { margin: 0; font-size: 18px; font-weight: 400; line-height: normal; color: #999; }
    .install-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem; width: 100%; }
    a.platform-button { text-decoration: none; box-sizing: border-box; }
    a.platform-button:focus-visible { outline: 2px solid #a991ff; outline-offset: 3px; }
    .icon { display: flex; width: 1.6rem; height: 1.6rem; flex-shrink: 0; }
    .icon svg { width: 100%; height: 100%; filter: brightness(0) invert(1); }
    @media (max-width: 480px) {
      .hero { width: 190px; height: 190px; }
      .meteor { width: 230px; }
      .install-options { gap: .5rem; }
      p { font-size: 16px; }
    }
  `];

  render() {
    const android = /Android/i.test(navigator.userAgent);
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
    const mobile = isMobile() || ios;
    const options = INSTALL_OPTIONS.filter(option => {
      if (!mobile) return true;
      if (option.label === "Extension") return false;
      if (option.label === "Android") return android;
      if (option.label === "iOS") return ios;
      return true;
    });
    return html`<div class="get-meteor-container">
      <div class="hero" aria-hidden="true">
        <div class="meteor">${unsafeSVG(svg_graphics_text.smiling_meteor)}</div>
      </div>
      <div class="copy"><h1 class="page-title">Get Meteor Wallet</h1><p>Your gateway to the NEAR Universe</p></div>
      <nav class="install-options" aria-label="Get Meteor Wallet">
        ${options.map(option => html`<a class="platform-button" href=${option.url} target="_blank" rel="noopener noreferrer"><span class="icon" aria-hidden="true">${unsafeSVG(option.icon)}</span><span>${option.label}</span></a>`)}
      </nav>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { "get-meteor-screen": GetMeteorScreen; }
}
