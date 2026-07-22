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

const svg_qr_glyph = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="6.4" height="6.4" rx="1.4"/><rect x="14.1" y="3.5" width="6.4" height="6.4" rx="1.4"/><rect x="3.5" y="14.1" width="6.4" height="6.4" rx="1.4"/><path d="M14.1 14.1h2.6v2.6h-2.6zM17.9 17.9h2.6v2.6h-2.6z"/></svg>`;

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
  @state() private pinShake = false;
  @state() private interactionError?: string;
  @state() private resetConfirmation = false;
  @state() private resetPending = false;
  @state() private now = Date.now();
  @state() private presentedPushStage: "sending" | "sent" | "review" = "sending";
  @query("#mobile-bridge-qr") private qrTarget?: HTMLDivElement;
  @query("input") private pinInput?: HTMLInputElement;
  @state() private pinFocused = false;
  private unsubscribe?: () => void;
  private qr?: QRCodeStyling;
  private qrValue?: string;
  private pinWasFocused = false;
  private lastPinError?: string;
  private timer?: ReturnType<typeof setInterval>;
  private pinShakeTimer?: ReturnType<typeof setTimeout>;
  private presentationTimer?: ReturnType<typeof setTimeout>;
  private presentationStartedAt = Date.now();
  private boundSession?: MobileBridgeSession;

  static styles = css`
    :host {
      /* Shared Meteor Connect button/accent tokens — keep in sync with meteor-action-button. */
      --mc-primary-a: 62, 19, 231;
      --mc-primary-b: 89, 47, 254;
      --mc-secondary-a: 30, 30, 61;
      --mc-secondary-b: 30, 32, 65;
      /* Text/surface tokens follow the surrounding Meteor Connect modal palette
         (--meteor-text-on-dark-* / --meteor-dark-gray-* come from meteor-action-ui-container). */
      --mc-ink: rgb(var(--meteor-text-on-dark-light, 245, 243, 255));
      --mc-body: rgb(var(--meteor-text-on-dark-standard, 190, 190, 230));
      --mc-muted: rgb(var(--meteor-text-on-dark-dark, 154, 151, 190));
      --mc-kicker: rgb(var(--meteor-text-on-dark-dark, 154, 151, 190));
      --mc-hairline: rgba(255, 255, 255, 0.08);
      --mc-green: 105, 215, 169;
      --mc-red: 255, 138, 134;
      --mc-amber: 255, 200, 130;
      display: block;
      width: 100%;
    }

    /* ---------- Card shell ---------- */
    .panel { position: relative; isolation: isolate; overflow: hidden; display: flex; flex-direction: column; gap: .5rem; align-items: center; padding: .75rem .8rem; border: 1px solid rgba(150,140,255,.13); border-radius: .9rem; background: linear-gradient(155deg, rgba(var(--meteor-dark-gray-lightest, 34,34,41), .32), rgba(var(--meteor-dark-gray-darkest, 14,14,23), .55) 70%); box-shadow: inset 0 2px 16px rgba(0,0,0,.22), inset 0 1px rgba(255,255,255,.035); box-sizing: border-box; }
    .panel::before { content: ""; position: absolute; width: 240px; height: 240px; left: -90px; top: -110px; z-index: -1; border-radius: 50%; background: radial-gradient(circle, rgba(105,79,244,.12), transparent 68%); pointer-events: none; }
    .panel::after { content: ""; position: absolute; width: 200px; height: 200px; right: -90px; bottom: -120px; z-index: -1; border-radius: 50%; background: radial-gradient(circle, rgba(69,193,255,.07), transparent 70%); pointer-events: none; }
    :host([contextual]) .panel { padding: .9rem; }
    .heading { display: flex; flex-direction: column; gap: .26rem; align-items: center; }
    .title { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08rem; color: var(--mc-kicker); }
    .status { margin: 0; font-size: .82rem; line-height: 1.15rem; color: var(--mc-body); }
    .muted { color: var(--mc-muted); font-size: .73rem; line-height: .95rem; }
    .error { color: rgb(var(--mc-red)); font-size: .76rem; line-height: 1rem; }

    /* ---------- Buttons (mirrors meteor-action-button) ---------- */
    button { display: inline-flex; align-items: center; justify-content: center; gap: .4rem; min-height: 2.55rem; border: 0; border-radius: .65rem; padding: .68rem .95rem; box-sizing: border-box; font-family: inherit; font-size: .84rem; font-weight: 700; letter-spacing: .035rem; line-height: 1em; white-space: nowrap; cursor: pointer; color: white; background: linear-gradient(135deg, rgba(var(--mc-primary-a), .8) 0%, rgba(var(--mc-primary-b), .7) 100%); filter: drop-shadow(0 3px 10px rgba(0, 0, 0, .2)); transition: transform 120ms ease, background 120ms ease; }
    button:hover:not(:disabled) { background: linear-gradient(135deg, rgba(var(--mc-primary-a), 1) 0%, rgba(var(--mc-primary-b), .85) 100%); transform: translateY(-1px); }
    button:active:not(:disabled) { transform: translateY(0); }
    button.secondary { background: linear-gradient(135deg, rgba(var(--mc-secondary-a), .8) 0%, rgba(var(--mc-secondary-b), .7) 100%); }
    button.secondary:hover:not(:disabled) { background: linear-gradient(135deg, rgba(var(--mc-secondary-a), 1) 0%, rgba(var(--mc-secondary-b), 1) 100%); }
    button.ghost { min-height: 2.05rem; padding: .42rem .68rem; font-size: .72rem; background: rgba(255,255,255,.08); filter: none; }
    button.ghost:hover:not(:disabled) { background: rgba(255,255,255,.13); }
    button.icon-toggle { min-width: 2.55rem; padding: .5rem; }
    button.icon-toggle svg { width: 1.15rem; height: 1.15rem; }
    button.icon-toggle[aria-pressed="true"] { background: linear-gradient(135deg, rgba(var(--mc-primary-a), .55) 0%, rgba(var(--mc-primary-b), .45) 100%); }
    button:disabled { opacity: .55; cursor: default; }
    button:focus-visible { outline: 2px solid rgba(155,140,255,.95); outline-offset: 2px; }
    .spinner { display: inline-block; width: .9rem; height: .9rem; border: 2px solid rgba(255,255,255,.38); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; vertical-align: middle; }
    .mini-loader { width: 1rem; height: 1rem; border: 2px solid rgba(255,255,255,.25); border-top-color: rgba(255,255,255,.95); border-radius: 50%; animation: spin .75s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ---------- Status pills ---------- */
    .pill { display: inline-flex; align-items: center; gap: .42rem; padding: .38rem .68rem; border-radius: 999px; font-size: .7rem; line-height: 1; border: 1px solid var(--mc-hairline); color: var(--mc-muted); background: rgba(255,255,255,.05); }
    .pill.good { border-color: rgba(var(--mc-green), .22); color: rgb(174,229,207); background: rgba(58,172,129,.09); }
    .pill.warn { border-color: rgba(var(--mc-amber), .25); color: rgb(var(--mc-amber)); background: rgba(255,187,105,.08); }
    .pill.bad { border-color: rgba(var(--mc-red), .25); color: rgb(var(--mc-red)); background: rgba(255,120,120,.08); }
    .pill-dot { width: .42rem; height: .42rem; border-radius: 50%; background: currentColor; box-shadow: 0 0 0 4px rgba(255,255,255,.06); }
    .pill.good .pill-dot { animation: dot-pulse 1.4s ease-in-out infinite; }

    /* ---------- QR / waiting card ---------- */
    .request-access { display: flex; align-items: center; justify-content: center; gap: .75rem; width: 100%; }
    .request-access.stacked { flex-direction: column; gap: .6rem; }
    .request-controls { display: flex; flex: 1; min-width: 0; flex-direction: column; align-items: center; justify-content: center; gap: .55rem; }
    .request-access.stacked .request-controls { flex: none; }
    .actions { display: flex; gap: .5rem; flex-wrap: wrap; justify-content: center; }
    .qr-frame { position: relative; flex: 0 0 auto; padding: 3px; border-radius: 13px; background: linear-gradient(150deg, rgba(139,119,255,.55), rgba(69,50,160,.2) 55%, rgba(69,193,255,.3)); box-shadow: 0 10px 26px rgba(30,15,90,.35); }
    .qr { width: 128px; height: 128px; display: grid; place-items: center; padding: 0; box-sizing: border-box; border-radius: 10px; background: white; overflow: hidden; }
    .countdown { display: inline-flex; align-items: center; gap: .4rem; font-size: .71rem; color: var(--mc-muted); font-variant-numeric: tabular-nums; }
    .countdown.urgent { color: rgb(var(--mc-amber)); }
    .countdown-ring { width: .58rem; height: .58rem; border-radius: 50%; border: 2px solid currentColor; border-top-color: transparent; opacity: .75; animation: spin 2.4s linear infinite; }

    /* ---------- Stage cards (push / review / pin / status) ---------- */
    .stage-panel { height: 292px; justify-content: center; }
    .stage-panel.auto { height: auto; min-height: 292px; padding: 1rem .9rem; }
    .stage-panel.slim { height: auto; min-height: 190px; }
    .stage { width: 100%; min-height: 258px; display: flex; align-items: center; justify-content: center; animation: stage-in .42s cubic-bezier(.16,1,.3,1) both; }
    .stage.compact { min-height: 0; flex-direction: column; gap: .6rem; text-align: center; padding: .35rem 0; }
    .push-layout { width: 100%; display: grid; grid-template-columns: minmax(0,1fr) 150px; align-items: center; gap: .85rem; }
    .stage-primary { min-width: 0; min-height: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .55rem; text-align: center; }
    .stage-kicker { color: var(--mc-kicker); font-size: .72rem; font-weight: 700; letter-spacing: .08rem; text-transform: uppercase; }
    .stage-title { min-height: 2.44rem; max-width: 12rem; margin: 0; display: flex; align-items: center; justify-content: center; color: var(--mc-ink); font-size: 1.03rem; line-height: 1.22rem; font-weight: 750; text-wrap: balance; }
    .stage-subtitle { min-height: 2rem; max-width: 12rem; margin: 0; display: flex; align-items: center; color: var(--mc-muted); font-size: .74rem; line-height: 1rem; text-wrap: balance; }
    .stage-icon { position: relative; width: 66px; height: 66px; display: grid; place-items: center; border-radius: 21px; color: white; background: linear-gradient(145deg, rgba(112,88,248,.95), rgba(63,44,165,.9)); box-shadow: 0 12px 34px rgba(62,38,184,.35), inset 0 1px rgba(255,255,255,.2); }
    .stage-icon svg { width: 31px; height: 31px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
    .stage-icon.small { width: 48px; height: 48px; border-radius: 15px; }
    .stage-icon.small svg { width: 23px; height: 23px; }
    .stage-icon.sending::before, .stage-icon.sending::after { content: ""; position: absolute; inset: -7px; border: 1px solid rgba(139,119,255,.32); border-radius: 26px; animation: notify-pulse 1.7s ease-out infinite; }
    .stage-icon.sending::after { animation-delay: .65s; }
    .stage-icon.sent, .stage-icon.good { background: linear-gradient(145deg, #40bc86, #227a61); box-shadow: 0 12px 34px rgba(32,157,109,.27), inset 0 1px rgba(255,255,255,.2); }
    .stage-icon.unavailable, .stage-icon.neutral { background: linear-gradient(145deg, #8a718f, #51425e); }
    .status-line { min-height: 1rem; display: flex; align-items: center; justify-content: center; gap: .4rem; color: var(--mc-body); font-size: .7rem; }
    .fallback-slot { width: 150px; min-height: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .38rem; }
    .fallback-label { min-height: .85rem; color: var(--mc-kicker); font-size: .66rem; font-weight: 700; letter-spacing: .06rem; text-transform: uppercase; }
    .fallback-slot .qr-frame { padding: 3px; }
    .fallback-slot .qr { width: 144px; height: 144px; }
    .qr-placeholder { width: 150px; height: 150px; display: grid; place-items: center; box-sizing: border-box; border: 1px solid var(--mc-hairline); border-radius: 11px; overflow: hidden; color: var(--mc-muted); font-size: .68rem; background: linear-gradient(110deg, rgba(255,255,255,.035) 20%, rgba(255,255,255,.08) 38%, rgba(255,255,255,.035) 56%); background-size: 220% 100%; animation: qr-shimmer 1.8s linear infinite; }

    /* ---------- Review stage ---------- */
    .review-stage { flex-direction: column; gap: .65rem; text-align: center; }
    .review-visual { position: relative; width: 88px; height: 88px; display: grid; place-items: center; }
    .review-visual::before, .review-visual::after { content: ""; position: absolute; inset: 5px; border-radius: 50%; border: 1px solid rgba(103,220,181,.3); animation: review-pulse 2s ease-out infinite; }
    .review-visual::after { animation-delay: .8s; }
    .review-visual.violet::before, .review-visual.violet::after { border-color: rgba(139,119,255,.34); }
    .review-phone { position: relative; width: 42px; height: 68px; display: grid; place-items: center; border: 2px solid rgba(244,242,255,.92); border-radius: 11px; background: linear-gradient(160deg, rgba(93,72,212,.92), rgba(34,27,78,.96)); box-shadow: 0 13px 35px rgba(63,41,174,.42); }
    .review-phone::before { content: ""; position: absolute; width: 13px; height: 2px; top: 5px; border-radius: 2px; background: rgba(255,255,255,.6); }
    .review-check { width: 18px; height: 9px; margin-top: -2px; border-left: 2px solid #82ebbd; border-bottom: 2px solid #82ebbd; transform: rotate(-45deg); }
    .phone-pin-dots { display: flex; gap: 3px; margin-top: -2px; }
    .phone-pin-dots span { width: 5px; height: 5px; border-radius: 50%; background: rgba(210,200,255,.95); box-shadow: 0 0 6px rgba(170,150,255,.8); animation: phone-dot 1.6s ease-in-out infinite; }
    .phone-pin-dots span:nth-child(2) { animation-delay: .18s; }
    .phone-pin-dots span:nth-child(3) { animation-delay: .36s; }
    .phone-pin-dots span:nth-child(4) { animation-delay: .54s; }
    .review-title { max-width: 18rem; margin: 0; color: var(--mc-ink); font-size: 1.18rem; line-height: 1.35rem; font-weight: 760; text-wrap: balance; }
    .review-subtitle { max-width: 17rem; margin: 0; color: var(--mc-muted); font-size: .78rem; line-height: 1.05rem; }

    /* ---------- PIN stage ---------- */
    .pin-stage { flex-direction: column; gap: .55rem; text-align: center; min-height: 0; }
    .pin-row { position: relative; display: flex; gap: .55rem; justify-content: center; padding: .2rem 0; }
    .pin-row.shake { animation: pin-shake .45s cubic-bezier(.36,.07,.19,.97) both; }
    .pin-cell { width: 50px; height: 58px; display: grid; place-items: center; font-size: 1.45rem; font-weight: 800; color: var(--mc-ink); border-radius: .8rem; border: 1px solid var(--mc-hairline); background: linear-gradient(160deg, rgba(255,255,255,.05), rgba(255,255,255,.015)); box-shadow: inset 0 1px rgba(255,255,255,.04), 0 4px 14px rgba(0,0,0,.25); transition: border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease; }
    .pin-cell.filled { border-color: rgba(139,122,255,.7); transform: translateY(-1px); }
    .pin-cell.active { border-color: rgba(160,140,255,.95); box-shadow: inset 0 1px rgba(255,255,255,.06), 0 0 0 3px rgba(112,86,237,.22), 0 4px 16px rgba(52,30,150,.35); }
    .pin-row.error .pin-cell { border-color: rgba(var(--mc-red), .65); }
    .pin-caret { width: 2px; height: 1.3rem; border-radius: 2px; background: #b9a8ff; animation: caret-blink 1.1s steps(2, start) infinite; }
    .pin-hidden-input { position: absolute; inset: 0; width: 100%; height: 100%; box-sizing: border-box; opacity: 0; border: 0; padding: 0; margin: 0; background: transparent; color: transparent; caret-color: transparent; font-size: 16px; text-align: center; outline: none; cursor: pointer; }
    .pin-actions { display: flex; flex-direction: column; align-items: center; gap: .45rem; width: 100%; }
    .pin-verify { min-width: 232px; }

    /* ---------- Identity reset ---------- */
    .reset-card { display: flex; flex-direction: column; align-items: center; gap: .5rem; max-width: 19rem; }

    @keyframes stage-in { from { opacity: 0; transform: translateY(7px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes notify-pulse { 0% { opacity: .8; transform: scale(.84); } 75%,100% { opacity: 0; transform: scale(1.22); } }
    @keyframes review-pulse { 0% { opacity: .75; transform: scale(.7); } 75%,100% { opacity: 0; transform: scale(1.25); } }
    @keyframes dot-pulse { 50% { opacity: .45; transform: scale(.78); } }
    @keyframes qr-shimmer { to { background-position: -220% 0; } }
    @keyframes caret-blink { 50% { opacity: 0; } }
    @keyframes phone-dot { 0%, 100% { opacity: .45; } 50% { opacity: 1; } }
    @keyframes pin-shake {
      10%, 90% { transform: translateX(-1px); }
      20%, 80% { transform: translateX(2px); }
      30%, 50%, 70% { transform: translateX(-4px); }
      40%, 60% { transform: translateX(4px); }
    }

    @media (max-width: 370px) {
      .request-access { flex-direction: column; }
      .request-controls { flex: none; }
      .stage-panel { height: 420px; }
      .stage-panel.auto, .stage-panel.slim { height: auto; }
      .push-layout { grid-template-columns: 1fr; }
      .stage { min-height: 386px; }
      .stage.compact, .pin-stage { min-height: 0; }
      .stage-primary { min-height: 160px; gap: .35rem; }
      .stage-primary .stage-subtitle { display: none; }
      .fallback-slot { min-height: 205px; }
      .pin-cell { width: 44px; height: 52px; font-size: 1.3rem; }
      .pin-verify { min-width: 206px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .stage, .stage-icon::before, .stage-icon::after, .review-visual::before, .review-visual::after,
      .pill-dot, .qr-placeholder, .pin-row.shake, .pin-caret, .phone-pin-dots span, .countdown-ring { animation: none !important; }
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
    if (this.pinShakeTimer != null) clearTimeout(this.pinShakeTimer);
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
      this.reconcilePinErrorPresentation(snapshot);
      this.reconcilePushPresentation(snapshot);
    });
  }

  /** Play the shake feedback exactly once per newly surfaced PIN error. */
  private reconcilePinErrorPresentation(snapshot: IMobileBridgeSnapshot): void {
    if (snapshot.pinError != null && snapshot.pinError !== this.lastPinError) {
      this.pinShake = true;
      if (this.pinShakeTimer != null) clearTimeout(this.pinShakeTimer);
      this.pinShakeTimer = setTimeout(() => {
        this.pinShake = false;
      }, 500);
    }
    this.lastPinError = snapshot.pinError;
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
        width: 128,
        height: 128,
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

  private formatCountdown(secondsLeft: number): string {
    return `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;
  }

  private renderCountdown(secondsLeft: number | undefined, label = "Code expires in") {
    if (secondsLeft == null) return "";
    const urgent = secondsLeft <= 60;
    return html`<span class=${`countdown${urgent ? " urgent" : ""}`}>
      <span class="countdown-ring" aria-hidden="true"></span>
      ${label} ${this.formatCountdown(secondsLeft)}
    </span>`;
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
                ? html`<div class="qr-frame"><div id="mobile-bridge-qr" class="qr" role="img" aria-label="Scan with Meteor Mobile"></div></div>`
                : html`<div class="qr-placeholder">
                    ${
                      deepLink != null && mobile
                        ? html`<button class="ghost" @click=${() => (this.showQr = true)}>Show QR</button>`
                        : stage === "sending"
                          ? "Preparing secure code"
                          : "QR code loading"
                    }
                  </div>`
            }
            ${
              stage !== "sending" && deepLink != null
                ? html`<button class="ghost" @click=${() => this.openMobileApp()}>Open Meteor Mobile</button>`
                : html`<span class="status-line">${secondsLeft == null ? "" : `Expires in ${this.formatCountdown(secondsLeft)}`}</span>`
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
        <div class="pill good" role="status">
          <span class="pill-dot"></span>
          <span>Waiting for your approval</span>
        </div>
      </div>`,
    );
  }

  /**
   * First-pairing PIN entry, presented with the same stage treatment as the
   * "request received" screen: kicker, pulsing phone visual (showing the PIN on
   * the phone), then a segmented 4-digit input backed by one real hidden input
   * so focus, paste, mobile numeric keyboards, and screen readers keep working.
   */
  private renderPinStage(snapshot: IMobileBridgeSnapshot) {
    const attemptsLeft = Math.max(0, 3 - snapshot.pinAttemptsUsed);
    const exhausted = snapshot.pinAttemptsUsed >= 3;
    const activeIndex = Math.min(this.pin.length, 3);
    const cells = [0, 1, 2, 3].map((index) => {
      const digit = this.pin[index];
      const active = this.pinFocused && !this.pinPending && !exhausted && index === activeIndex;
      return html`<div
        class=${`pin-cell${digit != null ? " filled" : ""}${active ? " active" : ""}`}
        aria-hidden="true"
      >
        ${digit ?? (active ? html`<span class="pin-caret"></span>` : "")}
      </div>`;
    });

    return keyed(
      "wallet-pin",
      html`<div class="stage review-stage pin-stage">
        <span class="stage-kicker">Secure pairing</span>
        <div class="review-visual violet" aria-hidden="true">
          <div class="review-phone">
            <div class="phone-pin-dots"><span></span><span></span><span></span><span></span></div>
          </div>
        </div>
        <h2 class="review-title">Enter the PIN shown on your phone</h2>
        <p class="review-subtitle">
          Meteor Mobile is displaying a 4-digit PIN. Enter it here to securely pair this dApp with
          your wallet.
        </p>
        <div
          class=${`pin-row${this.pinShake ? " shake" : ""}${snapshot.pinError && !this.pinPending ? " error" : ""}`}
          role="group"
          aria-label="Meteor Mobile PIN verification"
          @click=${() => this.pinInput?.focus()}
        >
          ${cells}
          <input
            class="pin-hidden-input"
            aria-label="4-digit Meteor Mobile PIN"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="4"
            .value=${this.pin}
            ?disabled=${exhausted}
            @focus=${() => (this.pinFocused = true)}
            @blur=${() => (this.pinFocused = false)}
            @input=${(event: InputEvent) => (this.pin = (event.target as HTMLInputElement).value.replace(/\D/g, "").slice(0, 4))}
            @keydown=${(event: KeyboardEvent) => this.handlePinKeyDown(event)}
          />
        </div>
        <div class="pin-actions">
          <button type="button" class="pin-verify" aria-label=${this.pinPending ? "Verifying PIN" : "Verify PIN"}
            ?disabled=${this.pinPending || this.pin.length !== 4 || exhausted}
            @click=${() => this.requestPinSubmission()}
          >
            ${this.pinPending ? html`<span class="spinner" role="status" aria-label="Verifying PIN"></span>` : "Verify & Pair"}
          </button>
          ${
            snapshot.pinError && !this.pinPending
              ? html`<span class=${`pill ${attemptsLeft <= 1 ? "bad" : "warn"}`} role="status">
                  <span class="pill-dot"></span>
                  <span>${snapshot.pinError}${exhausted ? "" : ` · ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining`}</span>
                </span>`
              : html`<span class="muted">The PIN confirms both screens belong to you.</span>`
          }
          ${this.interactionError ? html`<span class="error">${this.interactionError}</span>` : ""}
        </div>
      </div>`,
    );
  }

  /** Compact icon stage for terminal and transient whole-panel states. */
  private renderStatusStage(
    key: string,
    icon: "check" | "cross" | "spinner",
    tone: "good" | "neutral" | "bad",
    title: string,
    subtitle?: string,
  ) {
    return keyed(
      key,
      html`<div class="stage compact">
        <span class="stage-kicker">Meteor Mobile</span>
        ${
          icon === "spinner"
            ? html`<div class="stage-icon small" aria-hidden="true"><span class="mini-loader"></span></div>`
            : html`<div class=${`stage-icon small ${tone === "good" ? "good" : "neutral"}`} aria-hidden="true">
                ${
                  icon === "check"
                    ? html`<svg viewBox="0 0 24 24"><path d="m5 12.5 4.2 4.2L19 7" /></svg>`
                    : html`<svg viewBox="0 0 24 24"><path d="m6.5 6.5 11 11" /><path d="m17.5 6.5-11 11" /></svg>`
                }
              </div>`
        }
        <h2 class="review-title" style="font-size:1.02rem; line-height:1.2rem;">${title}</h2>
        ${subtitle ? html`<p class="review-subtitle">${subtitle}</p>` : ""}
      </div>`,
    );
  }

  private renderIdentityReset() {
    return html`<div class="stage compact">
      <span class="stage-kicker">Meteor Mobile</span>
      <div class="stage-icon small neutral" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M12 8v5" /><path d="M12 16.6v.1" /><path d="M10.3 3.8 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0" /></svg>
      </div>
      <div class="reset-card">
        <span class="error">This dApp's saved Meteor Mobile pairing no longer matches the server.</span>
        ${
          this.resetConfirmation
            ? html`<span class="muted">Resetting removes this dApp's saved mobile pairings for this environment. Your NEAR accounts remain listed and will pair again by QR.</span>`
            : ""
        }
        <button ?disabled=${this.resetPending} @click=${() => void this.confirmIdentityReset()}>
          ${this.resetPending ? html`<span class="spinner" role="status" aria-label="Resetting"></span>` : this.resetConfirmation ? "Confirm Reset & Re-pair" : "Reset Mobile Pairing"}
        </button>
        ${this.interactionError ? html`<span class="error">${this.interactionError}</span>` : ""}
      </div>
    </div>`;
  }

  render() {
    const snapshot = this.snapshot;
    if (snapshot == null) {
      return this.contextual
        ? html`<section class="panel stage-panel" aria-live="polite" aria-label="Meteor Mobile">${this.renderPushStage(undefined, "sending")}</section>`
        : html`<section class="panel" aria-live="polite">
            <div class="heading">
              <span class="title">Meteor Mobile</span>
              <div class="status-line"><span class="mini-loader" aria-hidden="true"></span><span>Preparing secure connection…</span></div>
            </div>
          </section>`;
    }
    const mobile = isMobile();
    const secondsLeft =
      snapshot.expiresAt == null
        ? undefined
        : Math.max(0, Math.ceil((snapshot.expiresAt - this.now) / 1000));
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

    if (snapshot.identityResetRequired) {
      return html`<section class="panel stage-panel slim" aria-live="polite" aria-label="Meteor Mobile">
        ${this.renderIdentityReset()}
      </section>`;
    }

    if (inPushPresentation) {
      return html`<section class="panel stage-panel" aria-live="polite" aria-label="Meteor Mobile">
        ${this.renderPushStage(
          snapshot,
          this.presentedPushStage === "sending" ? "sending" : "sent",
          secondsLeft,
        )}
      </section>`;
    }

    if (snapshot.phase === "wallet_verification") {
      return html`<section class="panel stage-panel auto" aria-live="polite" aria-label="Meteor Mobile">
        ${this.renderPinStage(snapshot)}
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

    if (snapshot.phase === "completed") {
      return html`<section class="panel stage-panel slim" aria-live="polite" aria-label="Meteor Mobile">
        ${this.renderStatusStage("mobile-completed", "check", "good", "Completed in Meteor Mobile", "You can continue in this dApp.")}
      </section>`;
    }

    if (snapshot.phase === "failed" || snapshot.phase === "cancelled") {
      const failureDetail =
        snapshot.error === "wallet_update_required"
          ? "Update Meteor Mobile to continue with this request."
          : snapshot.error;
      return html`<section class="panel stage-panel slim" aria-live="polite" aria-label="Meteor Mobile">
        ${this.renderStatusStage(
          `mobile-${snapshot.phase}`,
          "cross",
          "bad",
          this.statusText(snapshot),
          failureDetail,
        )}
      </section>`;
    }

    return html`
      <section class="panel" aria-live="polite" aria-label="Meteor Mobile">
        <div class="heading">
          <span class="title">Meteor Mobile</span>
          <p class="status">${this.statusText(snapshot)}</p>
        </div>
        ${snapshot.reconnecting ? html`<span class="pill"><span class="mini-loader" aria-hidden="true"></span><span>Reconnecting securely…</span></span>` : ""}
        ${showRequestAccess && snapshot.push === "delivered" ? html`<span class="pill good"><span class="pill-dot"></span><span>Notification sent — QR remains available</span></span>` : ""}
        ${showRequestAccess && snapshot.push === "not_delivered" ? html`<span class="pill warn"><span class="pill-dot"></span><span>Notification unavailable — use the code below</span></span>` : ""}
        ${
          showRequestAccess
            ? html`
          <div class=${`request-access${mobile && showRequestQr ? " stacked" : ""}`}>
            ${showRequestQr ? html`<div class="qr-frame"><div id="mobile-bridge-qr" class="qr" role="img" aria-label="Scan with Meteor Mobile"></div></div>` : ""}
            <div class="request-controls">
              <div class="actions">
                <button @click=${() => this.openMobileApp()}>Open in App</button>
                ${
                  mobile
                    ? html`<button class="secondary icon-toggle" aria-label=${this.showQr ? "Hide QR code" : "Show QR code"}
                        aria-pressed=${this.showQr ? "true" : "false"}
                        @click=${() => (this.showQr = !this.showQr)}>${svg_qr_glyph}</button>`
                    : ""
                }
              </div>
              ${this.renderCountdown(secondsLeft)}
              ${
                secondsLeft != null && secondsLeft <= 60
                  ? html`<button class="ghost" @click=${() => void this.refreshMobileCode()}>Refresh code</button>`
                  : ""
              }
            </div>
          </div>`
            : ""
        }
        ${this.interactionError ? html`<span class="error">${this.interactionError}</span>` : ""}
        ${snapshot.error ? html`<span class="error">${snapshot.error === "wallet_update_required" ? "Update Meteor Mobile to continue with this request." : snapshot.error}</span>` : ""}
      </section>
    `;
  }
}
