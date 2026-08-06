import { css, html, LitElement, nothing } from "lit";
import { property, query, state } from "lit/decorators.js";
import QRCodeStyling from "qr-code-styling";
import type {
  IMobileBridgeSnapshot,
  MobileBridgeSession,
} from "../../target_clients/mobile_bridge/MobileBridgeSession";
import type { ITransferKeyRevealPayload } from "../../transfer_accounts/TransferKeyHandle";
import { customElement } from "./custom-element";

/**
 * Structural reveal-gate interface: the real TransferKeyHandle in production, a fake in the
 * preview harness. The card never holds the key itself — it pulls through the gate on every
 * render, so a lapsed gate (phase regression, wipe, session swap) hides the key automatically.
 */
export interface ITransferKeyRevealSource {
  getRevealPayload(session: MobileBridgeSession): ITransferKeyRevealPayload | null;
}

const svg_key_glyph = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="14" r="4.2"/><path d="M11 11 20 2M15.5 6.5 18 9M12.8 9.2 15 11.4"/></svg>`;

/**
 * The post-PIN reveal card (§ dedicated popup UI): "Connection verified" → explicit Reveal →
 * grouped key + copy + key QR + Hide. The key string is NOT in the DOM at all before the reveal
 * click (conditional render, not CSS), and never in aria-live regions, tooltips, inputs, or data
 * attributes.
 */
@customElement("meteor-transfer-key-card")
export class MeteorTransferKeyCard extends LitElement {
  @property({ attribute: false }) session?: MobileBridgeSession;
  @property({ attribute: false }) revealSource?: () => ITransferKeyRevealSource | undefined;
  @state() private snapshot?: IMobileBridgeSnapshot;
  @state() private revealed = false;
  @state() private copied = false;
  @state() private now = Date.now();
  @query("#transfer-key-qr") private qrTarget?: HTMLDivElement;
  private unsubscribe?: () => void;
  private boundSession?: MobileBridgeSession;
  private qr?: QRCodeStyling;
  private qrValue?: string;
  private timer?: ReturnType<typeof setInterval>;
  private copiedTimer?: ReturnType<typeof setTimeout>;

  static styles = css`
    :host {
      --mc-primary-a: 62, 19, 231;
      --mc-primary-b: 89, 47, 254;
      --mc-ink: rgb(var(--meteor-text-on-dark-light, 245, 243, 255));
      --mc-body: rgb(var(--meteor-text-on-dark-standard, 190, 190, 230));
      --mc-muted: rgb(var(--meteor-text-on-dark-dark, 154, 151, 190));
      --mc-hairline: rgba(255, 255, 255, 0.08);
      --mc-green: 105, 215, 169;
      --mc-amber: 255, 200, 130;
      display: block;
      width: 100%;
    }
    .panel { position: relative; isolation: isolate; overflow: hidden; display: flex; flex-direction: column; gap: .55rem; align-items: center; padding: .8rem .8rem .7rem; border: 1px solid rgba(150,140,255,.13); border-radius: .9rem; background: linear-gradient(155deg, rgba(var(--meteor-dark-gray-lightest, 34,34,41), .32), rgba(var(--meteor-dark-gray-darkest, 14,14,23), .55) 70%); box-shadow: inset 0 2px 16px rgba(0,0,0,.22), inset 0 1px rgba(255,255,255,.035); box-sizing: border-box; }
    .pill { display: inline-flex; align-items: center; gap: .42rem; padding: .38rem .68rem; border-radius: 999px; font-size: .7rem; line-height: 1; border: 1px solid rgba(var(--mc-green), .22); color: rgb(174,229,207); background: rgba(58,172,129,.09); }
    .pill-dot { width: .42rem; height: .42rem; border-radius: 50%; background: currentColor; box-shadow: 0 0 0 4px rgba(255,255,255,.06); }
    .stage-kicker { color: var(--mc-muted); font-size: .72rem; font-weight: 700; letter-spacing: .08rem; text-transform: uppercase; }
    .stage-title { margin: 0; color: var(--mc-ink); font-size: 1.03rem; line-height: 1.25rem; font-weight: 750; text-wrap: balance; }
    .warning { max-width: 19rem; margin: 0; color: var(--mc-body); font-size: .74rem; line-height: 1rem; text-wrap: balance; }
    .key-icon { width: 54px; height: 54px; display: grid; place-items: center; border-radius: 17px; color: white; background: linear-gradient(145deg, rgba(112,88,248,.95), rgba(63,44,165,.9)); box-shadow: 0 12px 34px rgba(62,38,184,.35), inset 0 1px rgba(255,255,255,.2); }
    .key-icon svg { width: 26px; height: 26px; }
    button { display: inline-flex; align-items: center; justify-content: center; gap: .4rem; min-height: 2.55rem; border: 0; border-radius: .65rem; padding: .68rem .95rem; box-sizing: border-box; font-family: inherit; font-size: .84rem; font-weight: 700; letter-spacing: .035rem; line-height: 1em; white-space: nowrap; cursor: pointer; color: white; background: linear-gradient(135deg, rgba(var(--mc-primary-a), .8) 0%, rgba(var(--mc-primary-b), .7) 100%); filter: drop-shadow(0 3px 10px rgba(0, 0, 0, .2)); transition: transform 120ms ease, background 120ms ease; }
    button:hover:not(:disabled) { background: linear-gradient(135deg, rgba(var(--mc-primary-a), 1) 0%, rgba(var(--mc-primary-b), .85) 100%); transform: translateY(-1px); }
    button.ghost { min-height: 2.05rem; padding: .42rem .68rem; font-size: .72rem; background: rgba(255,255,255,.08); filter: none; }
    button.ghost:hover:not(:disabled) { background: rgba(255,255,255,.13); }
    button:focus-visible { outline: 2px solid rgba(155,140,255,.95); outline-offset: 2px; }
    .key-tile { width: 100%; box-sizing: border-box; padding: .6rem .65rem; border-radius: .7rem; border: 1px solid rgba(150,140,255,.22); background: rgba(var(--meteor-dark-gray-darkest, 14,14,23), .75); box-shadow: inset 0 2px 10px rgba(0,0,0,.3); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .78rem; line-height: 1.15rem; letter-spacing: .04rem; color: var(--mc-ink); word-break: break-all; user-select: all; text-align: center; }
    .reveal-actions { display: flex; gap: .5rem; flex-wrap: wrap; justify-content: center; }
    .qr-frame { padding: 3px; border-radius: 13px; background: linear-gradient(150deg, rgba(139,119,255,.55), rgba(69,50,160,.2) 55%, rgba(69,193,255,.3)); box-shadow: 0 10px 26px rgba(30,15,90,.35); }
    .qr { width: 128px; height: 128px; display: grid; place-items: center; box-sizing: border-box; border-radius: 10px; background: white; overflow: hidden; }
    .clipboard-note { margin: 0; color: var(--mc-muted); font-size: .68rem; line-height: .92rem; }
    .countdown { display: inline-flex; align-items: center; gap: .4rem; font-size: .71rem; color: var(--mc-muted); font-variant-numeric: tabular-nums; }
    .countdown.urgent { color: rgb(var(--mc-amber)); }
    .countdown-ring { width: .58rem; height: .58rem; border-radius: 50%; border: 2px solid currentColor; border-top-color: transparent; opacity: .75; animation: ring-spin 2.4s linear infinite; }
    @keyframes ring-spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { button { transition: none; } }
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
    const payload = this.currentPayload();
    if (this.revealed && payload != null) {
      this.drawQr(payload.raw);
    } else {
      this.clearQr();
    }
  }

  disconnectedCallback(): void {
    this.unsubscribe?.();
    if (this.timer != null) clearInterval(this.timer);
    if (this.copiedTimer != null) clearTimeout(this.copiedTimer);
    this.clearQr();
    super.disconnectedCallback();
  }

  private bindSession(): void {
    if (this.boundSession !== this.session) {
      this.boundSession = this.session;
      this.revealed = false;
    }
    this.unsubscribe?.();
    this.unsubscribe = this.session?.subscribe((snapshot) => {
      this.snapshot = snapshot;
      // The gate is authoritative: any phase regression drops the reveal immediately.
      if (snapshot.phase !== "wallet_action") this.revealed = false;
    });
  }

  /** Pulled fresh on every render — never cached into state. */
  private currentPayload(): ITransferKeyRevealPayload | null {
    const session = this.session;
    if (session == null) return null;
    return this.revealSource?.()?.getRevealPayload(session) ?? null;
  }

  private drawQr(value: string): void {
    const target = this.qrTarget;
    if (target == null || this.qrValue === value) return;
    this.qrValue = value;
    target.replaceChildren();
    // Same settings as the bridge panel's link QR — svg + roundSize:false is load-bearing for
    // dense payloads like the key string.
    this.qr = new QRCodeStyling({
      width: 120,
      height: 120,
      type: "svg",
      data: value,
      margin: 4,
      qrOptions: { errorCorrectionLevel: "M" },
      dotsOptions: { color: "#22105f", type: "rounded", roundSize: false },
      backgroundOptions: { color: "#ffffff" },
    });
    this.qr.append(target);
  }

  private clearQr(): void {
    this.qr = undefined;
    this.qrValue = undefined;
    this.qrTarget?.replaceChildren();
  }

  private async copyKey(): Promise<void> {
    const payload = this.currentPayload();
    if (payload == null) return;
    try {
      await navigator.clipboard.writeText(payload.raw);
      this.copied = true;
      if (this.copiedTimer != null) clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => {
        this.copied = false;
      }, 1600);
    } catch {
      // Clipboard unavailable (permissions/insecure context) — the visible key remains the path.
    }
  }

  private renderCountdown() {
    const expiresAt = this.snapshot?.expiresAt;
    if (expiresAt == null) return nothing;
    const remaining = Math.max(0, Math.floor((expiresAt - this.now) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = `${remaining % 60}`.padStart(2, "0");
    return html`<span class=${`countdown${remaining <= 30 ? " urgent" : ""}`}>
      <span class="countdown-ring" aria-hidden="true"></span> Bridge expires in ${minutes}:${seconds}
    </span>`;
  }

  render() {
    const payload = this.revealed ? this.currentPayload() : null;
    const gateOpen = this.currentPayload() != null;

    return html`
      <div class="panel">
        <span class="pill"><span class="pill-dot"></span>Connection verified</span>
        <span class="stage-kicker">Decrypt key</span>
        ${
          payload == null
            ? html`
              <div class="key-icon">${svg_key_glyph}</div>
              <p class="stage-title">Reveal your decrypt key</p>
              <p class="warning">
                This key unlocks your transferred accounts. Enter it only in Meteor Wallet on the
                connected device.
              </p>
              <button
                type="button"
                ?disabled=${!gateOpen}
                @click=${() => {
                  this.revealed = true;
                }}
              >Reveal decrypt key</button>
            `
            : html`
              <p class="warning">
                This key unlocks your transferred accounts. Enter it only in Meteor Wallet on the
                connected device.
              </p>
              <div class="key-tile">${payload.grouped}</div>
              <div class="qr-frame"><div id="transfer-key-qr" class="qr" role="img" aria-label="Decrypt key QR code"></div></div>
              <div class="reveal-actions">
                <button type="button" class="ghost" @click=${() => this.copyKey()}>
                  ${this.copied ? "Copied ✓" : "Copy key"}
                </button>
                <button
                  type="button"
                  class="ghost"
                  @click=${() => {
                    this.revealed = false;
                  }}
                >Hide</button>
              </div>
              <p class="clipboard-note">
                Copying places the key in your clipboard — paste it in Meteor Wallet, then copy
                something else to clear clipboard history.
              </p>
            `
        }
        ${this.renderCountdown()}
      </div>
    `;
  }
}
