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
  @property({ type: Boolean, reflect: true }) contextual = false;
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
    .panel { display: flex; flex-direction: column; gap: .48rem; align-items: center; padding: .7rem; border: 1px solid rgba(150,140,255,.24); border-radius: .9rem; background: linear-gradient(145deg, rgba(22,18,45,.92), rgba(12,10,26,.82)); box-shadow: 0 10px 28px rgba(0,0,0,.18), inset 0 1px rgba(255,255,255,.025); box-sizing: border-box; }
    :host([contextual]) .panel { padding: .9rem; }
    .heading { display: flex; flex-direction: column; gap: .22rem; align-items: center; }
    .title { font-size: .76rem; font-weight: 800; text-transform: uppercase; letter-spacing: .09rem; color: rgb(181,176,246); }
    .status { margin: 0; font-size: .82rem; line-height: 1.15rem; color: rgb(225,223,247); }
    .muted { color: rgb(166,162,199); font-size: .73rem; line-height: .95rem; }
    .error { color: #ffb7b5; font-size: .76rem; line-height: 1rem; }
    .success { color: #a8ebc5; font-size: .76rem; line-height: 1rem; }
    .request-access { display: flex; align-items: center; justify-content: center; gap: .75rem; width: 100%; }
    .request-controls { display: flex; flex: 1; min-width: 0; flex-direction: column; align-items: center; justify-content: center; gap: .5rem; }
    .qr { width: 150px; height: 150px; flex: 0 0 150px; padding: 7px; box-sizing: border-box; border-radius: 11px; background: white; box-shadow: 0 5px 18px rgba(0,0,0,.24); }
    .actions { display: flex; gap: .45rem; flex-wrap: wrap; justify-content: center; }
    button { min-height: 2.35rem; border: 0; border-radius: .65rem; padding: .58rem .78rem; font: inherit; font-size: .78rem; font-weight: 700; cursor: pointer; background: linear-gradient(135deg, #604ce2, #7665f3); color: white; box-shadow: 0 4px 12px rgba(43,29,131,.25); }
    button.secondary { background: rgba(255,255,255,.11); }
    button:disabled { opacity: .55; cursor: default; }
    button:focus-visible { outline: 2px solid rgba(165,150,255,.95); outline-offset: 2px; }
    .spinner { display: inline-block; width: .9rem; height: .9rem; border: 2px solid rgba(255,255,255,.38); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; vertical-align: middle; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .pin { display: flex; gap: .45rem; justify-content: center; }
    input { width: 7rem; min-height: 2.35rem; box-sizing: border-box; padding: .52rem; border-radius: .6rem; border: 1px solid rgba(255,255,255,.25); outline: none; background: rgba(0,0,0,.24); color: white; text-align: center; letter-spacing: .28rem; font-size: 1rem; }
    input:focus { border-color: rgba(139,122,255,.9); box-shadow: 0 0 0 3px rgba(112,86,237,.18); }
    @media (max-width: 370px) {
      .request-access { flex-direction: column; }
      .request-controls { flex: none; }
    }
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
        width: 136,
        height: 136,
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
      this.pin = "";
      await this.updateComplete;
      this.pinInput?.focus();
    } finally {
      this.pinPending = false;
    }
  }

  private handlePinSubmit(event: SubmitEvent): void {
    event.preventDefault();
    if (this.pinPending || this.pin.length !== 4 || (this.snapshot?.pinAttemptsUsed ?? 3) >= 3) {
      return;
    }
    void this.submitPin();
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
    const showRequestAccess = snapshot.deepLink != null && snapshot.phase === "waiting_for_wallet";
    const showRequestQr = showRequestAccess && this.showQr;
    return html`
      <section class="panel" aria-live="polite" aria-label="Meteor Mobile">
        <div class="heading">
          <span class="title">Meteor Mobile</span>
          <p class="status">${this.statusText(snapshot)}</p>
        </div>
        ${snapshot.reconnecting ? html`<span class="muted">Reconnecting securely…</span>` : ""}
        ${showRequestAccess && snapshot.push === "delivered" ? html`<span class="success">Notification sent. QR remains available as a fallback.</span>` : ""}
        ${showRequestAccess && snapshot.push === "not_delivered" ? html`<span class="muted">Notification unavailable${snapshot.pushReason ? ` (${snapshot.pushReason})` : ""}; use the code below.</span>` : ""}
        ${
          showRequestAccess
            ? html`
          <div class="request-access">
            ${showRequestQr ? html`<div id="mobile-bridge-qr" class="qr" role="img" aria-label="Scan with Meteor Mobile"></div>` : ""}
            <div class="request-controls">
              <div class="actions">
                <button @click=${() => this.openMobileApp()}>Open in App</button>
                ${
                  mobile
                    ? html`<button class="secondary" aria-label="Show QR code" @click=${() => (this.showQr = !this.showQr)}>${this.showQr ? "Hide QR" : "Show QR"}</button>`
                    : ""
                }
              </div>
              ${
                secondsLeft != null
                  ? html`<span class="muted">Code expires in ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}</span>`
                  : ""
              }
              ${
                secondsLeft != null && secondsLeft <= 60
                  ? html`<button class="secondary" @click=${() => void this.refreshMobileCode()}>Refresh code</button>`
                  : ""
              }
            </div>
          </div>`
            : ""
        }
        ${
          showPin
            ? html`
          <form class="pin" @submit=${(event: SubmitEvent) => this.handlePinSubmit(event)}>
            <input aria-label="4-digit Meteor Mobile PIN" inputmode="numeric" maxlength="4" .value=${this.pin}
              @input=${(event: InputEvent) => (this.pin = (event.target as HTMLInputElement).value.replace(/\D/g, "").slice(0, 4))} />
            <button type="submit" aria-label=${this.pinPending ? "Verifying PIN" : "Verify PIN"}
              ?disabled=${this.pinPending || this.pin.length !== 4 || snapshot.pinAttemptsUsed >= 3}
            >
              ${this.pinPending ? html`<span class="spinner" role="status" aria-label="Verifying PIN"></span>` : "Verify"}
            </button>
          </form>
          ${snapshot.pinError && !this.pinPending ? html`<span class="muted">${Math.max(0, 3 - snapshot.pinAttemptsUsed)} attempts remaining</span>` : ""}
        `
            : ""
        }
        ${snapshot.pinError && !this.pinPending ? html`<span class="error">${snapshot.pinError}</span>` : ""}
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
