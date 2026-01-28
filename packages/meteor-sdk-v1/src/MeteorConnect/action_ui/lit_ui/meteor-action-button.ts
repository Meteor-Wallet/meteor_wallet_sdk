import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { customElement } from "./custom-element";

export type ButtonVariant = "primary" | "secondary";
export type PlatformType = "extension" | "web" | "ios" | "android";

@customElement("meteor-action-button")
export class MeteorActionButton extends LitElement {
  @property({ type: String }) label: string = "";
  @property({ type: String }) icon?: string; // SVG string
  @property({ type: String }) variant: ButtonVariant = "secondary";
  @property({ type: Boolean }) disabled: boolean = false;

  static styles = css`
    :host {
      --meteor-brand-blue-lightest: 77, 144, 232;
      --meteor-brand-blue-light: 57, 124, 212;
      --button-dark-part: 35, 69, 105;
      --background-primary: 27, 84, 182;
      /* --background-primary-hover: rgba(255, 255, 255, 0.16); */
      /* --background-primary-active: rgba(255, 255, 255, 0.2); */
      --text-color: white;
      --transition: transform 120ms ease, background 120ms ease;
      --border-radius: 0.75rem;
      --padding: 0.55rem 0.8rem;
      --gap: 0.4rem;
    }

    button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--gap);
      padding: var(--padding);
      /* border: none; */
      border-radius: var(--border-radius);
      border: 1px solid rgba(var(--meteor-brand-blue-light), 0.5);
      box-sizing: content-box;
      background: linear-gradient(135deg, rgba(var(--meteor-brand-blue-light), 1) 0%, rgba(var(--background-primary), 0.7) 100%);
      filter: drop-shadow(0 3px 10px rgba(0, 0, 0, 0.2));
      color: var(--text-color);
      font-weight: 700;
      letter-spacing: 0.035rem;
      line-height: 1em;
      font-family: inherit;
      font-size: 0.9rem;
      cursor: pointer;
      transition: var(--transition);
      white-space: nowrap;
    }

    button:hover:not(:disabled) {
      background: linear-gradient(135deg, rgba(var(--meteor-brand-blue-lightest), 1) 0%, rgba(var(--meteor-brand-blue-light), 0.7) 100%);
      transform: translateY(-1px);
    }

    button:active:not(:disabled) {
      background: linear-gradient(135deg, rgba(var(--meteor-brand-blue-lightest), 1) 0%, rgba(var(--meteor-brand-blue-light), 0.7) 100%);
      transform: translateY(0);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.3em;
      height: 1.3em;
      flex-shrink: 0;
    }

    .icon-wrapper svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    /* Primary variant */
    :host([variant="primary"]) button {
      background: linear-gradient(135deg, rgba(77, 134, 232, 0.8) 0%, rgba(136, 114, 255, 0.7) 100%);
      font-weight: 700;
    }

    :host([variant="primary"]) button:hover:not(:disabled) {
      background: linear-gradient(135deg, rgba(77, 134, 232, 1) 0%, rgba(136, 114, 255, 0.85) 100%);
    }

    :host([variant="primary"]) button:active:not(:disabled) {
      background: linear-gradient(135deg, rgba(57, 114, 212, 1) 0%, rgba(116, 94, 245, 0.85) 100%);
    }
  `;

  render() {
    return html`
      <button
        type="button"
        ?disabled=${this.disabled}
        @click=${this._handleClick}
      >
        ${this.icon ? html`<div class="icon-wrapper">${unsafeSVG(this.icon)}</div>` : ""}
        <span>${this.label}</span>
      </button>
    `;
  }

  private _handleClick() {
    this.dispatchEvent(
      new CustomEvent("meteor-button-click", {
        bubbles: true,
        composed: true,
        detail: { label: this.label },
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "meteor-action-button": MeteorActionButton;
  }
}
