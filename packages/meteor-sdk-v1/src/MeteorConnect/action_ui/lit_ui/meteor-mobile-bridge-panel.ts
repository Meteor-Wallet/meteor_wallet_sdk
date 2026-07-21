import { css, html, LitElement } from "lit";
import { property, query, state } from "lit/decorators.js";
import QRCodeStyling from "qr-code-styling";
import type {
  IMobileBridgeSnapshot,
  MobileBridgeSession,
} from "../../target_clients/mobile_bridge/MobileBridgeSession";
import { isMobile } from "../utils/isMobile";
import { customElement } from "./custom-element";

@customElement("meteor-mobile-bridge-panel")
export class MeteorMobileBridgePanel extends LitElement {
  @property({ attribute: false }) session?: MobileBridgeSession;
  @property({ attribute: false }) openInApp?: () => void;
  @property({ attribute: false }) refreshCode?: () => Promise<void>;
  @property({ attribute: false }) resetIdentity?: () => Promise<void>;
  @state() private snapshot?: IMobileBridgeSnapshot;
  @state() private showQr = !isMobile();
  @state() private pin = "";
  @state() private pinPending = false;
  @state() private interactionError?: string;
  @state() private resetConfirmation = false;
  @state() private resetPending = false;
  @state() private now = Date.now();
  @query("#mobile-bridge-qr") private qrTarget?: HTMLDivElement;
  @query("input") private pinInput?: HTMLInputElement;
  private unsubscribe?: () => void;
  private qr?: QRCodeStyling;
  private qrValue?: string;
  private pinWasFocused = false;
  private timer?: ReturnType<typeof setInterval>;

  static styles = css`
    :host { display: block; width: 100%; }
    .panel { display: flex; flex-direction: column; gap: .75rem; align-items: center; padding: .85rem; border: 1px solid rgba(150,140,255,.2); border-radius: .9rem; background: rgba(15,12,30,.72); box-sizing: border-box; }
    .title { font-size: .8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08rem; color: rgb(170,165,235); }
    .status { margin: 0; font-size: .83rem; color: rgb(215,212,242); }
    .muted { color: rgb(145,140,180); font-size: .76rem; }
    .error { color: #ffaaa9; font-size: .8rem; }
    .success { color: #9ce6bd; font-size: .8rem; }
    .qr { width: 174px; height: 174px; padding: 8px; box-sizing: border-box; border-radius: 12px; background: white; }
    .actions { display: flex; gap: .55rem; flex-wrap: wrap; justify-content: center; }
    button { border: 0; border-radius: .65rem; padding: .65rem .9rem; font: inherit; font-weight: 700; cursor: pointer; background: #6657e8; color: white; }
    button.secondary { background: rgba(255,255,255,.11); }
    button:disabled { opacity: .55; cursor: default; }
    .pin { display: flex; gap: .5rem; justify-content: center; }
    input { width: 7rem; padding: .6rem; border-radius: .55rem; border: 1px solid rgba(255,255,255,.25); background: rgba(0,0,0,.22); color: white; text-align: center; letter-spacing: .28rem; font-size: 1rem; }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.bindSession();
    this.timer = setInterval(() => {
      this.now = Date.now();
    }, 1000);
  }

  protected willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (changed.has("session")) this.bindSession();
  }

  protected updated(): void {
    const link = this.snapshot?.deepLink;
    if (this.showQr && link != null) void this.updateComplete.then(() => this.drawQr(link));
    if (
      this.snapshot?.phase === "wallet_verification" &&
      !this.pinWasFocused &&
      this.pinInput != null
    ) {
      this.pinInput.focus();
      this.pinWasFocused = true;
    } else if (this.snapshot?.phase !== "wallet_verification") {
      this.pinWasFocused = false;
    }
  }

  disconnectedCallback(): void {
    this.unsubscribe?.();
    if (this.timer != null) clearInterval(this.timer);
    this.qr = undefined;
    super.disconnectedCallback();
  }

  private bindSession(): void {
    this.unsubscribe?.();
    this.unsubscribe = this.session?.subscribe((snapshot) => {
      this.snapshot = snapshot;
    });
  }

  private drawQr(link: string): void {
    if (this.qrTarget == null) return;
    if (this.qr == null) {
      this.qr = new QRCodeStyling({
        width: 158,
        height: 158,
        type: "svg",
        data: link,
        margin: 5,
        dotsOptions: { color: "#22105f", type: "rounded" },
        backgroundOptions: { color: "#ffffff" },
      });
    } else if (this.qrValue !== link) {
      this.qr.update({ data: link });
    }
    this.qrValue = link;
    this.qrTarget.innerHTML = "";
    this.qr.append(this.qrTarget);
  }

  private async submitPin(): Promise<void> {
    if (this.session == null || this.pinPending) return;
    this.pinPending = true;
    try {
      await this.session.submitPin(this.pin);
      this.pin = "";
      this.interactionError = undefined;
    } catch {
      // The session snapshot owns the safe, user-facing PIN error.
    } finally {
      this.pinPending = false;
    }
  }

  private openMobileApp(): void {
    try {
      this.openInApp?.();
      this.interactionError = undefined;
    } catch {
      this.interactionError =
        "Meteor Mobile could not be opened automatically. Scan the QR code instead.";
      this.showQr = true;
    }
  }

  private async refreshMobileCode(): Promise<void> {
    try {
      await this.refreshCode?.();
      this.interactionError = undefined;
    } catch {
      this.interactionError = "A new mobile code could not be created. Please try again.";
    }
  }

  private async confirmIdentityReset(): Promise<void> {
    if (!this.resetConfirmation) {
      this.resetConfirmation = true;
      return;
    }
    this.resetPending = true;
    try {
      await this.resetIdentity?.();
      this.resetConfirmation = false;
      this.interactionError = undefined;
    } catch (error) {
      this.interactionError =
        error instanceof Error && error.message === "mobile_bridge_other_tab_active"
          ? "Meteor Mobile is active in another tab. Close that request and try again."
          : "The mobile pairing could not be reset. Please try again.";
    } finally {
      this.resetPending = false;
    }
  }

  private statusText(snapshot: IMobileBridgeSnapshot): string {
    switch (snapshot.phase) {
      case "initializing":
        return "Initializing secure mobile connection…";
      case "busy_other_tab":
        return "Meteor Mobile is busy in another tab. Retrying…";
      case "creating_bridge":
        return "Creating secure mobile request…";
      case "waiting_for_wallet":
        return "Scan or open Meteor Mobile to continue.";
      case "wallet_verification":
        return "Enter the 4-digit PIN shown on your phone.";
      case "wallet_action":
        return "Review and approve this request in Meteor Mobile.";
      case "completed":
        return "Completed in Meteor Mobile.";
      case "failed":
        return "The mobile request could not be completed.";
      case "cancelled":
        return "The mobile request was cancelled.";
    }
  }

  render() {
    const snapshot = this.snapshot;
    if (snapshot == null) {
      return html`<section class="panel" aria-live="polite"><span class="title">Meteor Mobile</span><p class="status">Preparing…</p></section>`;
    }
    const mobile = isMobile();
    const secondsLeft =
      snapshot.expiresAt == null
        ? undefined
        : Math.max(0, Math.ceil((snapshot.expiresAt - this.now) / 1000));
    const showPin = snapshot.phase === "wallet_verification";
    return html`
      <section class="panel" aria-live="polite" aria-label="Meteor Mobile">
        <span class="title">Meteor Mobile</span>
        <p class="status">${this.statusText(snapshot)}</p>
        ${snapshot.reconnecting ? html`<span class="muted">Reconnecting securely…</span>` : ""}
        ${snapshot.push === "delivered" ? html`<span class="success">Notification sent. QR remains available as a fallback.</span>` : ""}
        ${snapshot.push === "not_delivered" ? html`<span class="muted">Notification unavailable${snapshot.pushReason ? ` (${snapshot.pushReason})` : ""}; use the code below.</span>` : ""}
        ${
          mobile && snapshot.deepLink != null
            ? html`
          <div class="actions">
            <button @click=${() => this.openMobileApp()}>Open in App</button>
            <button class="secondary" aria-label="Show QR code" @click=${() => (this.showQr = !this.showQr)}>${this.showQr ? "Hide QR" : "Show QR"}</button>
          </div>`
            : ""
        }
        ${this.showQr && snapshot.deepLink != null ? html`<div id="mobile-bridge-qr" class="qr" role="img" aria-label="Scan with Meteor Mobile"></div>` : ""}
        ${!mobile && snapshot.deepLink != null ? html`<div class="actions"><button class="secondary" @click=${() => this.openMobileApp()}>Open in App</button></div>` : ""}
        ${
          secondsLeft != null && snapshot.phase === "waiting_for_wallet"
            ? html`
          <span class="muted">Code expires in ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}</span>
          ${secondsLeft <= 60 ? html`<button class="secondary" @click=${() => void this.refreshMobileCode()}>Refresh mobile code</button>` : ""}
        `
            : ""
        }
        ${
          showPin
            ? html`
          <div class="pin">
            <input aria-label="4-digit Meteor Mobile PIN" inputmode="numeric" maxlength="4" .value=${this.pin}
              @input=${(event: InputEvent) => (this.pin = (event.target as HTMLInputElement).value.replace(/\D/g, "").slice(0, 4))} />
            <button ?disabled=${this.pinPending || this.pin.length !== 4 || snapshot.pinAttemptsUsed >= 3} @click=${() => void this.submitPin()}>Verify</button>
          </div>
          <span class="muted">${Math.max(0, 3 - snapshot.pinAttemptsUsed)} attempts remaining</span>
        `
            : ""
        }
        ${snapshot.pinError ? html`<span class="error">${snapshot.pinError}</span>` : ""}
        ${this.interactionError ? html`<span class="error">${this.interactionError}</span>` : ""}
        ${
          snapshot.identityResetRequired
            ? html`
          <span class="error">This dApp's saved Meteor Mobile pairing no longer matches the server.</span>
          ${
            this.resetConfirmation
              ? html`
            <span class="muted">Resetting removes this dApp's saved mobile pairings for this environment. Your NEAR accounts remain listed and will pair again by QR.</span>
          `
              : ""
          }
          <button ?disabled=${this.resetPending} @click=${() => void this.confirmIdentityReset()}>
            ${this.resetConfirmation ? "Confirm Reset & Re-pair" : "Reset Mobile Pairing"}
          </button>
        `
            : ""
        }
        ${snapshot.error && !snapshot.identityResetRequired ? html`<span class="error">${snapshot.error === "wallet_update_required" ? "Update Meteor Mobile to continue with this request." : snapshot.error}</span>` : ""}
      </section>
    `;
  }
}
