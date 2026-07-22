import { css, html, LitElement } from "lit";
import { property, query, state } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
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
  @state() private presentedPushStage: "sending" | "sent" | "review" = "sending";
  @query("#mobile-bridge-qr") private qrTarget?: HTMLDivElement;
  @query("input") private pinInput?: HTMLInputElement;
  private unsubscribe?: () => void;
  private qr?: QRCodeStyling;
  private qrValue?: string;
  private pinWasFocused = false;
  private timer?: ReturnType<typeof setInterval>;
  private presentationTimer?: ReturnType<typeof setTimeout>;
  private presentationStartedAt = Date.now();
  private boundSession?: MobileBridgeSession;

  static styles = css`
    :host { display: block; width: 100%; }
    .panel { position: relative; overflow: hidden; display: flex; flex-direction: column; gap: .48rem; align-items: center; padding: .7rem; border: 1px solid rgba(150,140,255,.24); border-radius: .9rem; background: linear-gradient(145deg, rgba(22,18,45,.92), rgba(12,10,26,.82)); box-shadow: 0 10px 28px rgba(0,0,0,.18), inset 0 1px rgba(255,255,255,.025); box-sizing: border-box; }
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
    .stage-panel { height: 292px; justify-content: center; isolation: isolate; }
    .stage-panel::before { content: ""; position: absolute; width: 260px; height: 260px; left: -95px; top: -120px; z-index: -1; border-radius: 50%; background: radial-gradient(circle, rgba(105,79,244,.2), transparent 68%); pointer-events: none; }
    .stage-panel::after { content: ""; position: absolute; width: 220px; height: 220px; right: -100px; bottom: -130px; z-index: -1; border-radius: 50%; background: radial-gradient(circle, rgba(69,193,255,.11), transparent 70%); pointer-events: none; }
    .stage { width: 100%; min-height: 258px; display: flex; align-items: center; justify-content: center; animation: stage-in .42s cubic-bezier(.16,1,.3,1) both; }
    .push-layout { width: 100%; display: grid; grid-template-columns: minmax(0,1fr) 150px; align-items: center; gap: .85rem; }
    .stage-primary { min-width: 0; min-height: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .55rem; text-align: center; }
    .stage-kicker { color: rgb(176,168,244); font-size: .67rem; font-weight: 800; letter-spacing: .1rem; text-transform: uppercase; }
    .stage-title { min-height: 2.44rem; max-width: 12rem; margin: 0; display: flex; align-items: center; color: #f5f3ff; font-size: 1.03rem; line-height: 1.22rem; font-weight: 750; text-wrap: balance; }
    .stage-subtitle { min-height: 2rem; max-width: 12rem; margin: 0; display: flex; align-items: center; color: rgb(166,162,199); font-size: .74rem; line-height: 1rem; text-wrap: balance; }
    .stage-icon { position: relative; width: 66px; height: 66px; display: grid; place-items: center; border-radius: 21px; color: white; background: linear-gradient(145deg, rgba(112,88,248,.95), rgba(63,44,165,.9)); box-shadow: 0 12px 34px rgba(62,38,184,.35), inset 0 1px rgba(255,255,255,.2); }
    .stage-icon svg { width: 31px; height: 31px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
    .stage-icon.sending::before, .stage-icon.sending::after { content: ""; position: absolute; inset: -7px; border: 1px solid rgba(139,119,255,.32); border-radius: 26px; animation: notify-pulse 1.7s ease-out infinite; }
    .stage-icon.sending::after { animation-delay: .65s; }
    .stage-icon.sent { background: linear-gradient(145deg, #40bc86, #227a61); box-shadow: 0 12px 34px rgba(32,157,109,.27), inset 0 1px rgba(255,255,255,.2); }
    .stage-icon.unavailable { background: linear-gradient(145deg, #8a718f, #51425e); }
    .mini-loader { width: 1rem; height: 1rem; border: 2px solid rgba(255,255,255,.25); border-top-color: rgba(255,255,255,.95); border-radius: 50%; animation: spin .75s linear infinite; }
    .status-line { min-height: 1rem; display: flex; align-items: center; justify-content: center; gap: .4rem; color: rgb(190,185,222); font-size: .7rem; }
    .fallback-slot { width: 150px; min-height: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .38rem; }
    .fallback-label { min-height: .85rem; color: rgb(151,146,187); font-size: .66rem; font-weight: 700; letter-spacing: .045rem; text-transform: uppercase; }
    .qr-placeholder { width: 150px; height: 150px; display: grid; place-items: center; box-sizing: border-box; border: 1px solid rgba(162,151,231,.16); border-radius: 11px; overflow: hidden; color: rgb(145,139,181); font-size: .68rem; background: linear-gradient(110deg, rgba(255,255,255,.035) 20%, rgba(255,255,255,.08) 38%, rgba(255,255,255,.035) 56%); background-size: 220% 100%; animation: qr-shimmer 1.8s linear infinite; }
    .fallback-slot .qr { box-shadow: 0 8px 24px rgba(0,0,0,.3), 0 0 0 1px rgba(255,255,255,.05); }
    .fallback-open { min-height: 1.8rem; padding: .3rem .58rem; font-size: .69rem; background: rgba(255,255,255,.08); box-shadow: none; }
    .review-stage { flex-direction: column; gap: .65rem; text-align: center; }
    .review-visual { position: relative; width: 88px; height: 88px; display: grid; place-items: center; }
    .review-visual::before, .review-visual::after { content: ""; position: absolute; inset: 5px; border-radius: 50%; border: 1px solid rgba(103,220,181,.3); animation: review-pulse 2s ease-out infinite; }
    .review-visual::after { animation-delay: .8s; }
    .review-phone { position: relative; width: 42px; height: 68px; display: grid; place-items: center; border: 2px solid rgba(244,242,255,.92); border-radius: 11px; background: linear-gradient(160deg, rgba(93,72,212,.92), rgba(34,27,78,.96)); box-shadow: 0 13px 35px rgba(63,41,174,.42); }
    .review-phone::before { content: ""; position: absolute; width: 13px; height: 2px; top: 5px; border-radius: 2px; background: rgba(255,255,255,.6); }
    .review-check { width: 18px; height: 9px; margin-top: -2px; border-left: 2px solid #82ebbd; border-bottom: 2px solid #82ebbd; transform: rotate(-45deg); }
    .review-title { max-width: 18rem; margin: 0; color: #f7f5ff; font-size: 1.18rem; line-height: 1.35rem; font-weight: 760; text-wrap: balance; }
    .review-subtitle { max-width: 17rem; margin: 0; color: rgb(173,169,205); font-size: .78rem; line-height: 1.05rem; }
    .approval-pill { display: flex; align-items: center; gap: .45rem; margin-top: .15rem; padding: .42rem .7rem; border: 1px solid rgba(128,231,190,.17); border-radius: 999px; color: rgb(174,229,207); font-size: .71rem; background: rgba(58,172,129,.09); }
    .approval-dot { width: .42rem; height: .42rem; border-radius: 50%; background: #69d7a9; box-shadow: 0 0 0 4px rgba(105,215,169,.1); animation: dot-pulse 1.4s ease-in-out infinite; }
    @keyframes stage-in { from { opacity: 0; transform: translateY(7px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes notify-pulse { 0% { opacity: .8; transform: scale(.84); } 75%,100% { opacity: 0; transform: scale(1.22); } }
    @keyframes review-pulse { 0% { opacity: .75; transform: scale(.7); } 75%,100% { opacity: 0; transform: scale(1.25); } }
    @keyframes dot-pulse { 50% { opacity: .45; transform: scale(.78); } }
    @keyframes qr-shimmer { to { background-position: -220% 0; } }
    @media (max-width: 370px) {
      .request-access { flex-direction: column; }
      .request-controls { flex: none; }
      .stage-panel { height: 420px; }
      .push-layout { grid-template-columns: 1fr; }
      .stage { min-height: 386px; }
      .stage-primary { min-height: 160px; gap: .35rem; }
      .stage-primary .stage-subtitle { display: none; }
      .fallback-slot { min-height: 205px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .stage, .stage-icon::before, .stage-icon::after, .review-visual::before, .review-visual::after, .approval-dot, .qr-placeholder { animation: none !important; }
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
    if (this.presentationTimer != null) clearTimeout(this.presentationTimer);
    this.qr = undefined;
    super.disconnectedCallback();
  }

  private bindSession(): void {
    if (this.boundSession !== this.session) {
      this.boundSession = this.session;
      this.presentedPushStage = "sending";
      this.presentationStartedAt = Date.now();
      if (this.presentationTimer != null) clearTimeout(this.presentationTimer);
    }
    this.unsubscribe?.();
    this.unsubscribe = this.session?.subscribe((snapshot) => {
      this.snapshot = snapshot;
      this.reconcilePushPresentation(snapshot);
    });
  }

  private reconcilePushPresentation(snapshot: IMobileBridgeSnapshot): void {
    if (this.presentationTimer != null) clearTimeout(this.presentationTimer);
    const pushWasSent = snapshot.push === "delivered";
    // wallet_action is the authoritative bridge acknowledgement that Meteor Mobile received the
    // request. Do not advance the UI to approval based on push delivery alone.
    const walletReceivedRequest = snapshot.phase === "wallet_action";

    let nextStage: "sent" | "review" | undefined;
    let minimumStageDuration = 0;
    if (this.presentedPushStage === "sending" && pushWasSent) {
      nextStage = "sent";
      minimumStageDuration = 450;
    } else if (this.presentedPushStage === "sent" && walletReceivedRequest) {
      nextStage = "review";
      minimumStageDuration = 700;
    }
    if (nextStage == null) return;

    const delay = Math.max(0, minimumStageDuration - (Date.now() - this.presentationStartedAt));
    this.presentationTimer = setTimeout(() => {
      this.presentedPushStage = nextStage;
      this.presentationStartedAt = Date.now();
      this.reconcilePushPresentation(this.snapshot ?? snapshot);
    }, delay);
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

  private requestPinSubmission(): void {
    if (this.pinPending || this.pin.length !== 4 || (this.snapshot?.pinAttemptsUsed ?? 3) >= 3) {
      return;
    }
    void this.submitPin();
  }

  private handlePinKeyDown(event: KeyboardEvent): void {
    if (event.key !== "Enter") return;

    // This UI can run in a sandboxed iframe without `allow-forms`. Never let
    // Enter fall through to native form submission (including a host form).
    event.preventDefault();
    event.stopPropagation();
    if (event.repeat || event.isComposing) return;
    this.requestPinSubmission();
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

  private renderPushStage(
    snapshot: IMobileBridgeSnapshot | undefined,
    stage: "sending" | "sent" | "unavailable",
    secondsLeft?: number,
  ) {
    const deepLink = snapshot?.deepLink;
    const mobile = isMobile();
    const showFallbackQr = stage !== "sending" && deepLink != null && this.showQr;
    const title =
      stage === "sending"
        ? "Sending push notification to wallet"
        : stage === "sent"
          ? "Push notification sent"
          : "Push notification unavailable";
    const subtitle =
      stage === "sending"
        ? "Securely contacting your paired Meteor Mobile wallet."
        : stage === "sent"
          ? "Waiting for Meteor Mobile to receive the request."
          : "Use the secure QR code to continue in Meteor Mobile.";

    return keyed(
      `push-${stage}`,
      html`<div class="stage">
        <div class="push-layout">
          <div class="stage-primary">
            <span class="stage-kicker">Meteor Mobile</span>
            <div class=${`stage-icon ${stage}`} aria-hidden="true">
              ${
                stage === "sent"
                  ? html`<svg viewBox="0 0 24 24"><path d="m5 12.5 4.2 4.2L19 7" /></svg>`
                  : html`<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" />${stage === "unavailable" ? html`<path d="m5 5 14 14" />` : ""}</svg>`
              }
            </div>
            <h2 class="stage-title">${title}</h2>
            <p class="stage-subtitle">${subtitle}</p>
            <div class="status-line">
              ${stage === "sending" || stage === "sent" ? html`<span class="mini-loader" aria-hidden="true"></span>` : ""}
              <span>${
                stage === "sending"
                  ? "Contacting paired device"
                  : stage === "sent"
                    ? "Waiting for wallet"
                    : "QR fallback ready"
              }</span>
            </div>
          </div>
          <div class="fallback-slot">
            <span class="fallback-label">${stage === "sending" ? "Preparing backup QR" : "Scan instead"}</span>
            ${
              showFallbackQr
                ? html`<div id="mobile-bridge-qr" class="qr" role="img" aria-label="Scan with Meteor Mobile"></div>`
                : html`<div class="qr-placeholder">
                    ${
                      deepLink != null && mobile
                        ? html`<button class="fallback-open" @click=${() => (this.showQr = true)}>Show QR</button>`
                        : stage === "sending"
                          ? "Preparing secure code"
                          : "QR code loading"
                    }
                  </div>`
            }
            ${
              stage !== "sending" && deepLink != null
                ? html`<button class="fallback-open" @click=${() => this.openMobileApp()}>Open Meteor Mobile</button>`
                : html`<span class="status-line">${secondsLeft == null ? "" : `Expires in ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`}</span>`
            }
          </div>
        </div>
      </div>`,
    );
  }

  private renderReviewStage() {
    return keyed(
      "wallet-review",
      html`<div class="stage review-stage">
        <span class="stage-kicker">Request received</span>
        <div class="review-visual" aria-hidden="true">
          <div class="review-phone"><span class="review-check"></span></div>
        </div>
        <h2 class="review-title">Review and approve this request in Meteor Mobile</h2>
        <p class="review-subtitle">Your wallet has securely received the request and is ready for your approval.</p>
        <div class="approval-pill" role="status">
          <span class="approval-dot"></span>
          <span>Waiting for your approval</span>
        </div>
      </div>`,
    );
  }

  render() {
    const snapshot = this.snapshot;
    if (snapshot == null) {
      return this.contextual
        ? html`<section class="panel stage-panel" aria-live="polite" aria-label="Meteor Mobile">${this.renderPushStage(undefined, "sending")}</section>`
        : html`<section class="panel" aria-live="polite"><span class="title">Meteor Mobile</span><p class="status">Preparing…</p></section>`;
    }
    const mobile = isMobile();
    const secondsLeft =
      snapshot.expiresAt == null
        ? undefined
        : Math.max(0, Math.ceil((snapshot.expiresAt - this.now) / 1000));
    const showPin = snapshot.phase === "wallet_verification";
    const showRequestAccess = snapshot.deepLink != null && snapshot.phase === "waiting_for_wallet";
    const showRequestQr = showRequestAccess && this.showQr;
    const inPushPresentation =
      this.contextual &&
      snapshot.push !== "not_attempted" &&
      snapshot.push !== "not_delivered" &&
      ["initializing", "creating_bridge", "waiting_for_wallet", "wallet_action"].includes(
        snapshot.phase,
      ) &&
      this.presentedPushStage !== "review";

    if (inPushPresentation) {
      return html`<section class="panel stage-panel" aria-live="polite" aria-label="Meteor Mobile">
        ${this.renderPushStage(
          snapshot,
          this.presentedPushStage === "sending" ? "sending" : "sent",
          secondsLeft,
        )}
      </section>`;
    }

    if (snapshot.phase === "wallet_action") {
      return html`<section class="panel stage-panel" aria-live="polite" aria-label="Meteor Mobile">
        ${this.renderReviewStage()}
      </section>`;
    }

    if (
      this.contextual &&
      snapshot.push === "not_delivered" &&
      ["creating_bridge", "waiting_for_wallet"].includes(snapshot.phase)
    ) {
      return html`<section class="panel stage-panel" aria-live="polite" aria-label="Meteor Mobile">
        ${this.renderPushStage(snapshot, "unavailable", secondsLeft)}
      </section>`;
    }

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
          <div class="pin" role="group" aria-label="Meteor Mobile PIN verification">
            <input aria-label="4-digit Meteor Mobile PIN" inputmode="numeric" maxlength="4" .value=${this.pin}
              @input=${(event: InputEvent) => (this.pin = (event.target as HTMLInputElement).value.replace(/\D/g, "").slice(0, 4))}
              @keydown=${(event: KeyboardEvent) => this.handlePinKeyDown(event)} />
            <button type="button" aria-label=${this.pinPending ? "Verifying PIN" : "Verify PIN"}
              ?disabled=${this.pinPending || this.pin.length !== 4 || snapshot.pinAttemptsUsed >= 3}
              @click=${() => this.requestPinSubmission()}
            >
              ${this.pinPending ? html`<span class="spinner" role="status" aria-label="Verifying PIN"></span>` : "Verify"}
            </button>
          </div>
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
