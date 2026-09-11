import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import type { TMeteorConnectionExecutionTarget } from "../../MeteorConnect.types";
import { customElement } from "./custom-element";
import { meteorConnectLogo } from "./graphical/meteor-connect-logo";

export function continuationPlatform(target: TMeteorConnectionExecutionTarget | "unset") {
  if (target === "v1_ext") return { label: "Chrome Extension", platform: "extension" };
  if (target === "v1_web_localhost") return { label: "Meteor Web (Local Dev)", platform: "web" };
  if (target === "v1_web") return { label: "Meteor Web", platform: "web" };
  if (target === "v2_bridge_mobile" || target === "v2_rid_mobile_deep_link") return { label: "Meteor Mobile", platform: "mobile" };
  return { label: "Meteor Wallet", platform: "web" };
}

@customElement("meteor-wallet-continuation")
export class MeteorWalletContinuation extends LitElement {
  @property() walletLabel = "Meteor Wallet";
  @property() walletPlatform = "web";
  @property() instruction?: string;
  @property({ type: Boolean }) preparing = false;
  @property({ type: Boolean }) scanMobile = false;
  @property({ attribute: false }) onOpen?: () => void | Promise<void>;

  static styles = css`
    :host { display: flex; flex: 1; width: 100%; min-height: 0; font-family: 'Gilroy', sans-serif; }
    section { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; min-height: 320px; text-align: center; padding: 1rem; box-sizing: border-box; }
    img { width: 5rem; height: 5rem; object-fit: contain; transform: scale(2.2); margin-bottom: 1.5rem; }
    .copy { display: flex; flex-direction: column; gap: .5rem; }
    h2 { margin: 0; color: #fff; font-size: 20px; font-weight: 600; line-height: normal; }
    p { margin: 0; color: #999; font-size: 14px; font-weight: 400; line-height: normal; }
    button { min-height: 3rem; padding: .65rem .8rem; border: 0; border-radius: .4rem; background: linear-gradient(110deg, #4210ec, #602cff); color: white; font: 600 16px 'Gilroy', sans-serif; line-height: normal; letter-spacing: 0; cursor: pointer; }
    button:hover { filter: brightness(1.15); }
    button:focus-visible { outline: 2px solid #a991ff; outline-offset: 3px; }
    .spinner { width: 1.3rem; height: 1.3rem; border: 2px solid #ffffff59; border-top-color: white; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;

  render() {
    const location = this.walletPlatform === "mobile" ? `${this.walletLabel} app` : this.walletPlatform === "extension" ? this.walletLabel : `open ${this.walletLabel} window`;
    return html`<section>
      <slot name="visual"><img src=${meteorConnectLogo} alt="" /></slot>
      <div class="copy" aria-live="polite">
        <h2>${this.preparing ? "Creating secure request" : `Continue in ${this.walletLabel}`}</h2>
        <p>${this.preparing ? `Preparing your connection to ${this.walletLabel}…` : this.instruction ?? (this.scanMobile ? `Scan with ${this.walletLabel} to continue` : `Complete the action in the ${location}`)}</p>
      </div>
      <slot name="countdown"></slot>
      ${this.preparing ? html`<span class="spinner" role="status" aria-label="Creating secure request"></span>` : this.onOpen ? html`<button @click=${() => this.onOpen?.()}>Open ${this.walletLabel}</button>` : ""}
      <slot></slot>
    </section>`;
  }
}
