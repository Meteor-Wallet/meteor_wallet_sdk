import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import type { TMeteorConnectionExecutionTarget } from "../../MeteorConnect.types";
import { customElement } from "./custom-element";
import { continuationPlatform } from "./meteor-wallet-continuation";
import "./meteor-wallet-continuation";

@customElement("continue-action-screen")
export class ContinueActionScreen extends LitElement {
  @property() executionTarget: TMeteorConnectionExecutionTarget | "unset" = "v1_web";
  @property({ attribute: false }) onContinue?: () => void;
  static styles = css`:host { display: flex; flex: 1; min-height: 0; }`;
  render() {
    const target = continuationPlatform(this.executionTarget);
    return html`<meteor-wallet-continuation .walletLabel=${target.label} .walletPlatform=${target.platform} .onOpen=${this.onContinue}></meteor-wallet-continuation>`;
  }
}
