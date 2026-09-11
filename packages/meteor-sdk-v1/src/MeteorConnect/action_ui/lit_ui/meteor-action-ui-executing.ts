import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import type { TMeteorConnectionExecutionTarget } from "../../MeteorConnect.types";
import { customElement } from "./custom-element";
import { continuationPlatform } from "./meteor-wallet-continuation";
import "./meteor-wallet-continuation";

@customElement("meteor-action-ui-executing")
export class MeteorActionUiExecuting extends LitElement {
  @property() executingForPlatform: TMeteorConnectionExecutionTarget | "unset" = "v1_web";
  static styles = css`:host { display: flex; flex: 1; min-height: 0; }`;
  render() {
    const target = continuationPlatform(this.executingForPlatform);
    return html`<meteor-wallet-continuation .walletLabel=${target.label} .walletPlatform=${target.platform} ></meteor-wallet-continuation>`;
  }
}
