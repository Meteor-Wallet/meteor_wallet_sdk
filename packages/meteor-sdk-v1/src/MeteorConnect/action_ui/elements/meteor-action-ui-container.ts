import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("meteor-action-ui-container")
export class MeteorActionUiContainer extends LitElement {
  static styles = css`
    /* ... existing styles ... */
    input { width: 100%; padding: 8px; margin-bottom: 10px; box-sizing: border-box; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; }
  `;

  render() {
    return html`
      <div class="actions">
        <button @click=${this._cancel}>Cancel</button>
      </div>
    `;
  }

  /*private _submit() {
    this.dispatchEvent(
      new CustomEvent("sdk-submit", {
        detail: { value: this.userInput },
        bubbles: true,
        composed: true,
      }),
    );
  }*/

  private _cancel() {
    this.dispatchEvent(new CustomEvent("sdk-cancel", { bubbles: true, composed: true }));
  }
}

/*
<button @click=${this._submit}>Confirm</button>

* <input
        type="text"
        placeholder="Enter value..."
        .value=${this.userInput}
        @input=${(e: any) => (this.userInput = e.target.value)}
      />
* */
