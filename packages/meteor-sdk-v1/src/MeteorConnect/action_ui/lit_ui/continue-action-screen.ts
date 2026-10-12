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
  /** True while the wallet is being opened after the user pressed continue. */
  @property({ type: Boolean }) opening = false;
  static styles = css`:host { display: flex; flex: 1; min-height: 0; }`;
  render() {
    const target = continuationPlatform(this.executionTarget);
    const busy = this.opening
      ? { title: `Opening ${target.label}`, message: `Hang tight while we hand this over to ${target.label}…` }
      : undefined;
    return html`<meteor-wallet-continuation .walletLabel=${target.label} .walletPlatform=${target.platform} .busy=${busy} .onOpen=${this.onContinue}></meteor-wallet-continuation>`;
  }
}
