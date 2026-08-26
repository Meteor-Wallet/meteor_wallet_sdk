import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { customElement } from "./custom-element";
import { svg_icons_text } from "./graphical/svg_icons/svg_icons_text";

export type ButtonVariant = "primary" | "secondary" | "option";
export type PlatformType = "extension" | "web" | "ios" | "android";

@customElement("meteor-action-button")
export class MeteorActionButton extends LitElement {
  @property({ type: String }) label: string = "";
  @property({ type: String }) icon?: string; // SVG string
  @property({ type: String }) variant: ButtonVariant = "secondary";
  @property({ type: Boolean }) disabled: boolean = false;

  static styles = css`
    :host {
      --meteor-button-primary-light: 62, 19, 231;
      --meteor-button-primary-accent: 89, 47, 254;

      --meteor-button-secondary-light: 30, 30, 61;
      --meteor-button-secondary-accent: 30, 32, 65;
      
      --meteor-button-text-color: 255, 255, 255;

      --border-radius: 0.65rem;
      --padding: 0.68rem 0.85rem;
      --gap: 0.4rem;
      --transition: transform 120ms ease, background 120ms ease;
    }

      button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--gap);
      padding: var(--padding);
      /* border: none; */
      border-radius: var(--border-radius);
      border-width: 0;
      box-sizing: border-box;
      min-height: 2.55rem;
      background: linear-gradient(135deg, rgba(var(--meteor-button-secondary-light), 0.8) 0%, rgba(var(--meteor-button-secondary-accent), 0.7) 100%);
      filter: drop-shadow(0 3px 10px rgba(0, 0, 0, 0.2));
      color: rgba(var(--meteor-button-text-color), 1);
      font-weight: 700;
      letter-spacing: 0.035rem;
      line-height: 1em;
      font-family: inherit;
      font-size: 0.84rem;
      cursor: pointer;
      transition: var(--transition);
      white-space: nowrap;
    }

    button:hover:not(:disabled) {
      background: linear-gradient(135deg, rgba(var(--meteor-button-secondary-light), 1) 0%, rgba(var(--meteor-button-secondary-accent), 1) 100%);
      transform: translateY(-1px);
    }

    button:active:not(:disabled) {
      background: linear-gradient(135deg, rgba(var(--meteor-button-secondary-light), 1) 0%, rgba(var(--meteor-button-secondary-accent), 1) 100%);
      transform: translateY(0);
    }

    button:focus-visible {
      outline: 2px solid rgba(155, 140, 255, 0.95);
      outline-offset: 2px;
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
      background: linear-gradient(135deg, rgba(var(--meteor-button-primary-light), 0.8) 0%, rgba(var(--meteor-button-primary-accent), 0.7) 100%);
      font-weight: 700;
    }

    :host([variant="primary"]) button:hover:not(:disabled) {
      background: linear-gradient(135deg, rgba(var(--meteor-button-primary-light), 1) 0%, rgba(var(--meteor-button-primary-accent), 0.85) 100%);
    }

    :host([variant="primary"]) button:active:not(:disabled) {
      background: linear-gradient(135deg, rgba(var(--meteor-button-primary-light), 1) 0%, rgba(var(--meteor-button-primary-accent), 0.85) 100%);
    }

    /* Option variant — full-width list row: icon tile, label, chevron affordance */
    :host([variant="option"]) {
      display: block;
      width: 100%;
    }

    :host([variant="option"]) button {
      width: 100%;
      justify-content: flex-start;
      gap: 0.65rem;
      min-height: 2.4rem;
      padding: 0.35rem 0.7rem;
      border-radius: 0.8rem;
      border: 1px solid rgba(255, 255, 255, 0.075);
      background: linear-gradient(150deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
      filter: none;
      font-size: 0.88rem;
      transition: transform 140ms ease, background 140ms ease, border-color 140ms ease, filter 140ms ease;
    }

    :host([variant="option"]) button:hover:not(:disabled) {
      background: linear-gradient(150deg, rgba(139, 119, 255, 0.16), rgba(69, 193, 255, 0.05));
      border-color: rgba(150, 140, 255, 0.4);
      transform: translateY(-1px);
      filter: drop-shadow(0 6px 16px rgba(62, 38, 184, 0.25));
    }

    :host([variant="option"]) button:active:not(:disabled) {
      background: linear-gradient(150deg, rgba(139, 119, 255, 0.16), rgba(69, 193, 255, 0.05));
      transform: translateY(0);
    }

    :host([variant="option"]) .icon-wrapper {
      width: 1.7rem;
      height: 1.7rem;
      border-radius: 0.55rem;
      border: 1px solid rgba(150, 140, 255, 0.22);
      background: linear-gradient(140deg, rgba(112, 88, 248, 0.28), rgba(69, 193, 255, 0.12));
      color: #d6ceff;
      transition: border-color 140ms ease, color 140ms ease;
    }

    :host([variant="option"]) .icon-wrapper svg {
      width: 58%;
      height: 58%;
      margin: auto;
    }

    :host([variant="option"]) button:hover:not(:disabled) .icon-wrapper {
      border-color: rgba(160, 145, 255, 0.5);
      color: #ffffff;
    }

    .chevron {
      display: flex;
      width: 1rem;
      height: 1rem;
      margin-left: auto;
      flex-shrink: 0;
      color: rgba(190, 190, 230, 0.45);
      transition: transform 140ms ease, color 140ms ease;
    }

    .chevron svg {
      width: 100%;
      height: 100%;
    }

    :host([variant="option"]) button:hover:not(:disabled) .chevron {
      transform: translateX(2px);
      color: rgba(225, 220, 255, 0.9);
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
        <span class="label">${this.label}</span>
        ${
          this.variant === "option"
            ? html`<span class="chevron" aria-hidden="true">${unsafeSVG(svg_icons_text.icon_chevron_right)}</span>`
            : ""
        }
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
