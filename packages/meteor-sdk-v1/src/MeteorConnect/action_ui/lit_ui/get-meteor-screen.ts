import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import type { TMeteorConnectionExecutionTarget } from "../../MeteorConnect.types";
import { customElement } from "./custom-element";
import { svg_graphics_text } from "./graphical/svg_graphics/svg_graphics_text";
import { svg_icons_text } from "./graphical/svg_icons/svg_icons_text";

const GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=app.meteorwallet.v2";
const APP_STORE_URL = "https://apps.apple.com/us/app/meteor-wallet/id6739558223";

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
      min-height: 0;
    }

    .get-meteor-container {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      align-items: center;
      justify-content: center;
      gap: 0.9rem;
      padding: 0.75rem 1rem 1rem;
      box-sizing: border-box;
    }

    /* ---------- Playful meteor hero ---------- */
    .hero {
      position: relative;
      width: 11rem;
      height: 8.5rem;
      display: grid;
      place-items: center;
    }

    .hero-glow {
      position: absolute;
      inset: -18%;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(112, 88, 248, 0.32), transparent 65%);
      pointer-events: none;
    }

    .meteor-float {
      width: 9.5rem;
      animation: hero-float 5s ease-in-out infinite;
      filter: drop-shadow(0 12px 24px rgba(62, 38, 184, 0.45));
    }

    .meteor-float svg {
      width: 100%;
      height: auto;
      display: block;
    }

    .sparkle {
      position: absolute;
      background: #ffd76b;
      clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
      animation: twinkle 2.6s ease-in-out infinite;
      pointer-events: none;
    }

    .sparkle.s1 {
      width: 0.85rem;
      height: 0.85rem;
      left: 4%;
      top: 12%;
    }

    .sparkle.s2 {
      width: 0.65rem;
      height: 0.65rem;
      right: 2%;
      top: 32%;
      background: #b5a3ff;
      animation-delay: 0.7s;
    }

    .sparkle.s3 {
      width: 0.5rem;
      height: 0.5rem;
      left: 16%;
      bottom: 8%;
      background: #ffffff;
      animation-delay: 1.3s;
    }

    @keyframes hero-float {
      0%,
      100% {
        transform: translateY(0) rotate(-1.5deg);
      }
      50% {
        transform: translateY(-8px) rotate(1.5deg);
      }
    }

    @keyframes twinkle {
      0%,
      100% {
        opacity: 0.25;
        transform: scale(0.7) rotate(0deg);
      }
      50% {
        opacity: 1;
        transform: scale(1) rotate(20deg);
      }
    }

    /* ---------- Headline copy (store-listing inspired) ---------- */
    .get-meteor-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      text-align: center;
    }

    .get-meteor-text .get-meteor-title {
      max-width: 19rem;
      font-size: 1.32rem;
      line-height: 1.4rem;
      font-weight: 800;
      color: rgba(255, 255, 255, 1);
      text-wrap: balance;
    }

    .get-meteor-text .get-meteor-subtitle {
      max-width: 17.5rem;
      font-size: 0.8rem;
      line-height: 1.1rem;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.55);
      text-wrap: balance;
    }

    /* ---------- Store badges ---------- */
    .store-badges {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      flex-wrap: wrap;
    }

    .store-badge {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      min-height: 2.9rem;
      padding: 0.45rem 0.85rem;
      box-sizing: border-box;
      border-radius: 0.8rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: linear-gradient(150deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.02));
      color: white;
      text-decoration: none;
      cursor: pointer;
      transition: transform 140ms ease, border-color 140ms ease, background 140ms ease, filter 140ms ease;
    }

    .store-badge:hover {
      border-color: rgba(150, 140, 255, 0.45);
      background: linear-gradient(150deg, rgba(139, 119, 255, 0.18), rgba(69, 193, 255, 0.06));
      transform: translateY(-1px);
      filter: drop-shadow(0 6px 16px rgba(62, 38, 184, 0.28));
    }

    .store-badge:focus-visible {
      outline: 2px solid rgba(155, 140, 255, 0.95);
      outline-offset: 2px;
    }

    .store-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.45rem;
      height: 1.45rem;
      flex-shrink: 0;
    }

    .store-icon svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    .store-lines {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.12rem;
      line-height: 1;
    }

    .store-kicker {
      font-size: 0.56rem;
      font-weight: 600;
      letter-spacing: 0.04rem;
      color: rgba(220, 215, 255, 0.65);
    }

    .store-name {
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.01rem;
    }

    /* ---------- Desktop divider + options ---------- */
    .desktop-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      max-width: 20rem;
    }

    .desktop-divider .divider-line {
      flex-grow: 1;
      height: 1px;
      background: rgba(255, 255, 255, 0.14);
    }

    .desktop-divider .divider-text {
      flex-shrink: 0;
      margin: 0 0.7rem;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08rem;
      color: rgba(var(--meteor-text-on-dark-dark, 154, 151, 190), 1);
    }

    .app-buttons {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      flex-wrap: wrap;
    }

    @media (prefers-reduced-motion: reduce) {
      .meteor-float,
      .sparkle {
        animation: none !important;
      }
    }
  `;

  render() {
    const supportsWeb = this.supportedPlatforms.includes("v1_web");
    const supportsExtension = this.supportedPlatforms.includes("v1_ext");
    const supportsMobile = this.supportedPlatforms.includes("v2_bridge_mobile");

    return html`
      <div
        class="get-meteor-container"
      >
        <div class="hero" aria-hidden="true">
          <div class="hero-glow"></div>
          <div class="meteor-float">${unsafeSVG(svg_graphics_text.smiling_meteor)}</div>
          <span class="sparkle s1"></span>
          <span class="sparkle s2"></span>
          <span class="sparkle s3"></span>
        </div>
        <div class="get-meteor-text">
          <span class="get-meteor-title">Your gateway to the NEAR universe</span>
          <span class="get-meteor-subtitle">Store, send and explore Web3 with Meteor — free on mobile and desktop.</span>
        </div>
        ${
          supportsMobile
            ? html`
        <div class="store-badges">
          <a class="store-badge" href=${GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer" aria-label="Get Meteor Wallet on Google Play">
            <span class="store-icon">${unsafeSVG(svg_icons_text.icon_google_play)}</span>
            <span class="store-lines">
              <span class="store-kicker">GET IT ON</span>
              <span class="store-name">Google Play</span>
            </span>
          </a>
          <a class="store-badge" href=${APP_STORE_URL} target="_blank" rel="noopener noreferrer" aria-label="Download Meteor Wallet on the App Store">
            <span class="store-icon">${unsafeSVG(svg_icons_text.icon_ios_apple)}</span>
            <span class="store-lines">
              <span class="store-kicker">Download on the</span>
              <span class="store-name">App Store</span>
            </span>
          </a>
        </div>
        `
            : ""
        }
        ${
          supportsExtension || supportsWeb
            ? html`
          <div class="desktop-divider">
            <span class="divider-line"></span>
            <span class="divider-text">Or continue on desktop</span>
            <span class="divider-line"></span>
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
        `
            : ""
        }
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "get-meteor-screen": GetMeteorScreen;
  }
}
