import { consume } from "@lit/context";
import type { TAllAccountsTransferDataEncrypted } from "@meteorwallet/connect-shared";
import { css, html, LitElement, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import type { ExecutableAction } from "../../action/ExecutableAction";
import { MeteorLogger } from "../../logging/MeteorLogger";
import type { TMeteorConnectionExecutionTarget } from "../../MeteorConnect.types";
import type { TTransferTargetPlatform } from "../../target_clients/mobile_bridge/MeteorConnectMobileBridgeClient.types";
import type {
  IMobileBridgeSnapshot,
  MobileBridgeSession,
} from "../../target_clients/mobile_bridge/MobileBridgeSession";
import { getTransferAttachmentForAction } from "../../transfer_accounts/MeteorConnectTransferAccounts";
import { ActionUiController } from "./ActionUiController";
import { customElement } from "./custom-element";
import { svg_icons_text } from "./graphical/svg_icons/svg_icons_text";
import { svg_meteor_logo_text } from "./graphical/svg_meteor_logo_text";
import "./meteor-mobile-bridge-panel";
import type { ITransferKeyRevealSource } from "./meteor-transfer-key-card";
import "./meteor-transfer-key-card";
import { overlayCloseTriggerContext } from "./meteor-action-ui-context";

type TTransferTerminalState = "imported" | "declined" | "expired";

const TERMINAL_COPY: Record<
  TTransferTerminalState,
  { title: string; subtitle: string; good: boolean }
> = {
  imported: {
    title: "Accounts transferred",
    subtitle: "Your accounts are now available in Meteor Wallet.",
    good: true,
  },
  declined: {
    title: "Transfer declined",
    subtitle: "The transfer was declined on the other device. Nothing was imported.",
    good: false,
  },
  expired: {
    title: "Transfer not completed",
    subtitle: "The connection expired before the transfer finished on the other device.",
    good: false,
  },
};

const svg_check = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.8 9.6 18 19.5 6.5"/></svg>`;
const svg_neutral = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.4"/><path d="M8.6 12h6.8"/></svg>`;

/**
 * The dedicated transfer-accounts popup flow (§ dedicated popup UI): Review (explicit start —
 * the 5-minute bridge TTL only starts burning on click) → Connect (bridge panel reuse: QR /
 * open link / PIN) → Reveal (key card, gated on authoritative wallet_action) → terminal states.
 * Satisfies the same ActionUi property contract as <meteor-action-ui-container>.
 */
@customElement("meteor-transfer-accounts-container")
export class MeteorTransferAccountsContainer extends LitElement {
  private logger = MeteorLogger.createLogger("MeteorConnect:<meteor-transfer-accounts-container>");

  @property({ type: Object }) action!: ExecutableAction<any>;
  @property({ attribute: false }) closeAction: (() => void) | undefined = undefined;
  @property({ attribute: false })
  pendingKnownExecutionTarget: TMeteorConnectionExecutionTarget | undefined = undefined;
  /** Preview-harness override for the reveal gate; production resolves the real attachment. */
  @property({ attribute: false }) previewRevealSource?: ITransferKeyRevealSource;
  /** Preview-harness override to inspect terminal screens directly. */
  @property({ attribute: false }) previewTerminalState?: TTransferTerminalState;

  @consume({ context: overlayCloseTriggerContext })
  @property({ attribute: false })
  public overlayCloseTrigger?: () => void;

  @state() private screen: "review" | "choose_platform" | "connect" = "review";
  @state() private mobileSession?: MobileBridgeSession;
  @state() private snapshot?: IMobileBridgeSnapshot;
  @state() private startPending = false;
  @state() private startError?: string;
  @state() private terminalState?: TTransferTerminalState;
  @state() private targetPlatform?: TTransferTargetPlatform;

  private actionController!: ActionUiController;
  private unsubscribeSession?: () => void;
  private farewellShownResolve?: () => void;

  static styles = css`
    :host {
      --meteor-dark-gray-lightest: 34, 34, 41;
      --meteor-dark-gray-standard: 27, 27, 38;
      --meteor-dark-gray-darkest: 14, 14, 23;
      --meteor-text-on-dark-light: 220, 220, 255;
      --meteor-text-on-dark-standard: 190, 190, 230;
      --meteor-text-on-dark-dark: 154, 151, 190;
      --mc-primary-a: 62, 19, 231;
      --mc-primary-b: 89, 47, 254;
      --mc-green: 105, 215, 169;
      --mc-red: 255, 138, 134;
      --mc-hairline: rgba(255, 255, 255, 0.08);
      display: block;
      width: 100%;
      height: 100%;
    }
    .modal {
      font-family: 'Gilroy', Inter, sans-serif;
      font-weight: 500;
      background:
        radial-gradient(130% 55% at 50% -12%, rgba(98, 63, 220, 0.22), rgba(98, 63, 220, 0) 62%),
        linear-gradient(135deg, rgb(var(--meteor-dark-gray-darkest)) 0%, rgb(var(--meteor-dark-gray-standard)) 150%);
      color: rgb(var(--meteor-text-on-dark-light));
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      width: 100%;
      height: 100%;
      text-align: center;
    }
    .meteor-connect-title-box { display: flex; flex-direction: row; gap: .65rem; min-height: 3.7rem; padding: .45rem .75rem; box-sizing: border-box; border-bottom: 1px solid rgb(var(--meteor-dark-gray-lightest)); align-items: center; justify-content: space-between; }
    .meteor-logo-and-title { display: flex; flex-direction: row; gap: .7rem; align-items: center; }
    .meteor-logo { width: 2.85rem; height: 2.85rem; margin: -0.1rem; border-radius: 100%; }
    .meteor-logo svg { width: 85%; height: 85%; margin-top: 0; margin-left: .5rem; }
    .title-text-box { display: flex; flex-direction: column; gap: .22rem; justify-content: center; align-items: flex-start; }
    .title-text-box .title { margin: 0; font-size: 1.35rem; font-weight: 700; line-height: .9em; letter-spacing: .03rem; color: rgba(255,255,255,.9); }
    .title-text-box .subtitle { margin: 0; font-size: .68rem; font-weight: 700; line-height: .9em; letter-spacing: .24rem; text-transform: uppercase; color: rgba(180,180,255,1); }
    .close-circle { width: 2.75rem; height: 2.75rem; margin: 0; display: flex; align-items: center; justify-content: center; border-radius: 100%; background: rgba(255,255,255,0); cursor: pointer; transition: background 150ms ease; border: 0; padding: 0; color: inherit; font: inherit; }
    .close-circle:hover { background: rgba(255,255,255,.07); }
    .close-circle:focus-visible { outline: 2px solid rgba(155,140,255,.9); outline-offset: 1px; }
    .close-circle svg { width: 34%; height: 34%; color: rgba(var(--meteor-text-on-dark-light), 1); }
    .content { position: relative; padding: .6rem .9rem .75rem; display: flex; flex-direction: column; justify-content: center; flex-grow: 1; gap: .6rem; overflow-y: auto; min-height: 0; }
    .content::-webkit-scrollbar { width: .35rem; }
    .content::-webkit-scrollbar-thumb { border-radius: 999px; background: rgba(255,255,255,.14); }

    .section-kicker { font-size: .72rem; font-weight: 700; text-transform: uppercase; color: rgba(var(--meteor-text-on-dark-dark), 1); letter-spacing: .08rem; }
    .review-title { margin: 0; color: rgba(var(--meteor-text-on-dark-light), 1); font-size: 1.12rem; line-height: 1.3rem; font-weight: 750; text-wrap: balance; }
    .review-note { margin: 0; color: rgba(var(--meteor-text-on-dark-dark), 1); font-size: .74rem; line-height: 1rem; text-wrap: balance; }
    .account-count { display: inline-flex; align-items: center; gap: .42rem; align-self: center; padding: .34rem .68rem; border-radius: 999px; font-size: .7rem; border: 1px solid var(--mc-hairline); color: rgba(var(--meteor-text-on-dark-dark), 1); background: rgba(255,255,255,.05); }
    .account-list { width: 100%; max-height: 15.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: .4rem; box-sizing: border-box; padding: .1rem; }
    .account-list::-webkit-scrollbar { width: .35rem; }
    .account-list::-webkit-scrollbar-thumb { border-radius: 999px; background: rgba(255,255,255,.14); }
    .account-row { display: flex; align-items: center; justify-content: space-between; gap: .6rem; padding: .55rem .7rem; border-radius: .65rem; border: 1px solid var(--mc-hairline); background: rgba(255,255,255,.04); }
    .account-id { font-size: .8rem; font-weight: 650; color: rgba(var(--meteor-text-on-dark-light), 1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .account-network { flex-shrink: 0; font-size: .66rem; font-weight: 700; letter-spacing: .05rem; text-transform: uppercase; color: rgba(var(--meteor-text-on-dark-dark), 1); }
    .primary-button { display: inline-flex; align-items: center; justify-content: center; gap: .4rem; min-height: 2.55rem; border: 0; border-radius: .65rem; padding: .68rem .95rem; box-sizing: border-box; font-family: inherit; font-size: .84rem; font-weight: 700; letter-spacing: .035rem; white-space: nowrap; cursor: pointer; color: white; background: linear-gradient(135deg, rgba(var(--mc-primary-a), .8) 0%, rgba(var(--mc-primary-b), .7) 100%); filter: drop-shadow(0 3px 10px rgba(0,0,0,.2)); transition: transform 120ms ease, background 120ms ease; }
    .primary-button:hover:not(:disabled) { background: linear-gradient(135deg, rgba(var(--mc-primary-a), 1) 0%, rgba(var(--mc-primary-b), .85) 100%); transform: translateY(-1px); }
    .primary-button:disabled { opacity: .55; cursor: default; }
    .primary-button:focus-visible { outline: 2px solid rgba(155,140,255,.95); outline-offset: 2px; }
    .start-error { margin: 0; color: rgb(var(--mc-red)); font-size: .74rem; line-height: 1rem; }
    .platform-button { display: flex; flex-direction: column; align-items: center; gap: .3rem; width: 100%; box-sizing: border-box; padding: .85rem .9rem; border: 1px solid rgba(150,140,255,.22); border-radius: .8rem; cursor: pointer; color: inherit; font-family: inherit; background: linear-gradient(155deg, rgba(var(--meteor-dark-gray-lightest), .4), rgba(var(--meteor-dark-gray-darkest), .55) 70%); box-shadow: inset 0 1px rgba(255,255,255,.04), 0 4px 14px rgba(0,0,0,.22); transition: transform 120ms ease, border-color 120ms ease; }
    .platform-button:hover:not(:disabled) { border-color: rgba(160,140,255,.6); transform: translateY(-1px); }
    .platform-button:disabled { opacity: .55; cursor: default; }
    .platform-button:focus-visible { outline: 2px solid rgba(155,140,255,.95); outline-offset: 2px; }
    .platform-name { font-size: .95rem; font-weight: 750; color: rgba(var(--meteor-text-on-dark-light), 1); }
    .platform-hint { font-size: .7rem; line-height: .95rem; color: rgba(var(--meteor-text-on-dark-dark), 1); }
    .back-link { align-self: center; border: 0; padding: .3rem .5rem; background: none; cursor: pointer; font-family: inherit; font-size: .72rem; color: rgba(var(--meteor-text-on-dark-dark), 1); text-decoration: underline; }
    .back-link:focus-visible { outline: 2px solid rgba(155,140,255,.95); outline-offset: 2px; }
    .spinner { display: inline-block; width: .9rem; height: .9rem; border: 2px solid rgba(255,255,255,.38); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .terminal-stage { display: flex; flex-direction: column; align-items: center; gap: .6rem; text-align: center; padding: 1rem 0; animation: stage-in .42s cubic-bezier(.16,1,.3,1) both; }
    .terminal-icon { width: 66px; height: 66px; display: grid; place-items: center; border-radius: 21px; color: white; background: linear-gradient(145deg, #8a718f, #51425e); box-shadow: 0 12px 34px rgba(40,30,70,.3), inset 0 1px rgba(255,255,255,.2); }
    .terminal-icon.good { background: linear-gradient(145deg, #40bc86, #227a61); box-shadow: 0 12px 34px rgba(32,157,109,.27), inset 0 1px rgba(255,255,255,.2); }
    .terminal-icon svg { width: 31px; height: 31px; }
    .terminal-title { margin: 0; color: rgba(var(--meteor-text-on-dark-light), 1); font-size: 1.1rem; font-weight: 750; }
    .terminal-subtitle { max-width: 17rem; margin: 0; color: rgba(var(--meteor-text-on-dark-dark), 1); font-size: .76rem; line-height: 1.02rem; }
    @keyframes stage-in { from { opacity: 0; transform: translateY(7px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @media (prefers-reduced-motion: reduce) { .terminal-stage, .spinner { animation: none !important; } }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.actionController = new ActionUiController(this, this.action, this.closeAction);
    // Terminal screens: observe the action's settlement so a signed result / expiry renders a
    // closing state during ActionUi's farewell grace instead of vanishing instantly. Attaching
    // here never *creates* execution — the transfer only starts on the Review click.
    this.action.waitForExecutionOutput().then(
      (output: { success: boolean }) => {
        this.terminalState = output.success ? "imported" : "declined";
      },
      (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        if (message === "mobile_bridge_expired") this.terminalState = "expired";
      },
    );
  }

  disconnectedCallback(): void {
    this.unsubscribeSession?.();
    super.disconnectedCallback();
  }

  /**
   * ActionUi farewell hook: once the action settles with a presentable ending, hold the popup
   * open briefly on the terminal screen before cleanup.
   */
  async farewell(): Promise<void> {
    if (this.terminalState == null) return;
    await this.updateComplete;
    await new Promise<void>((resolve) => {
      this.farewellShownResolve = resolve;
      setTimeout(resolve, 1_900);
    });
  }

  private async startTransfer(platform: TTransferTargetPlatform): Promise<void> {
    if (this.startPending) return;
    this.startPending = true;
    this.startError = undefined;
    this.targetPlatform = platform;
    try {
      const session = await this.actionController.prepareMobileBridge({
        transferTargetPlatform: platform,
      });
      this.bindSession(session);
      this.screen = "connect";
    } catch (error) {
      this.logger.err("Failed to start transfer bridge", error);
      this.startError = `Couldn't start the secure transfer: ${
        error instanceof Error ? error.message : String(error)
      }`;
    } finally {
      this.startPending = false;
    }
  }

  private get walletLabel(): string {
    return this.targetPlatform === "mobile" ? "Meteor Mobile" : "Meteor Web";
  }

  private bindSession(session: MobileBridgeSession | undefined): void {
    this.unsubscribeSession?.();
    this.mobileSession = session;
    this.unsubscribeSession = session?.subscribe((snapshot) => {
      this.snapshot = snapshot;
    });
  }

  private revealSource = (): ITransferKeyRevealSource | undefined => {
    if (this.previewRevealSource != null) return this.previewRevealSource;
    return getTransferAttachmentForAction(this.action)?.getActiveHandle();
  };

  private handleActionClose(): void {
    if (this.overlayCloseTrigger) {
      this.overlayCloseTrigger();
      return;
    }
    this.closeAction?.();
  }

  private renderReview() {
    const input = this.action.expandedInput as TAllAccountsTransferDataEncrypted;
    const accounts = input.allAccountsBasicInfo ?? [];
    return html`
      <span class="section-kicker">Transfer accounts</span>
      <p class="review-title">Transfer accounts to Meteor Wallet</p>
      <span class="account-count">${accounts.length} account${accounts.length === 1 ? "" : "s"} · encrypted end-to-end</span>
      <div class="account-list" aria-label="Accounts to transfer">
        ${accounts.map(
          (account) => html`
            <div class="account-row">
              <span class="account-id">${account.accountId}</span>
              <span class="account-network">NEAR · ${account.networkId}</span>
            </div>
          `,
        )}
      </div>
      <p class="review-note">
        Your account keys stay encrypted until you reveal the decrypt key to Meteor Wallet on the
        connected device.
      </p>
      <button type="button" class="primary-button" @click=${() => {
        this.screen = "choose_platform";
      }}>
        Start secure transfer
      </button>
    `;
  }

  private renderChoosePlatform() {
    return html`
      <span class="section-kicker">Choose destination</span>
      <p class="review-title">Where should your accounts go?</p>
      <p class="review-note">
        Both options use the same end-to-end encrypted transfer — pick the Meteor Wallet you want
        to receive the accounts.
      </p>
      <button
        type="button"
        class="platform-button"
        ?disabled=${this.startPending}
        @click=${() => this.startTransfer("web")}
      >
        <span class="platform-name">Meteor Web</span>
        <span class="platform-hint">wallet in this or another browser — link or QR</span>
      </button>
      <button
        type="button"
        class="platform-button"
        ?disabled=${this.startPending}
        @click=${() => this.startTransfer("mobile")}
      >
        <span class="platform-name">Meteor Mobile</span>
        <span class="platform-hint">the app on your phone — QR or deep link</span>
      </button>
      ${this.startPending ? html`<span class="spinner" aria-hidden="true"></span>` : nothing}
      ${this.startError != null ? html`<p class="start-error">${this.startError}</p>` : nothing}
      <button type="button" class="back-link" @click=${() => {
        this.screen = "review";
        this.startError = undefined;
      }}>Back to review</button>
    `;
  }

  private renderConnect() {
    if (this.snapshot?.phase === "wallet_action") {
      return html`
        <meteor-transfer-key-card
          .session=${this.mobileSession}
          .revealSource=${this.revealSource}
        ></meteor-transfer-key-card>
      `;
    }
    return html`
      <meteor-mobile-bridge-panel
        .session=${this.mobileSession}
        .walletLabel=${this.walletLabel}
        .contextual=${true}
        .openInApp=${() => this.action.meteorConnect.mobileBridgeClient.openCurrentSessionInApp()}
        .refreshCode=${async () => {
          // Refresh = new bridge = freshly regenerated key + ciphertext (attachment-driven).
          this.bindSession(await this.actionController.refreshMobileBridge());
        }}
        .resetIdentity=${async () => {
          this.bindSession(await this.actionController.resetMobileIdentityAndRePair());
        }}
      ></meteor-mobile-bridge-panel>
    `;
  }

  private renderTerminal(state: TTransferTerminalState) {
    const copy = TERMINAL_COPY[state];
    return html`
      <div class="terminal-stage">
        <div class=${`terminal-icon${copy.good ? " good" : ""}`}>${copy.good ? svg_check : svg_neutral}</div>
        <p class="terminal-title">${copy.title}</p>
        <p class="terminal-subtitle">${copy.subtitle}</p>
      </div>
    `;
  }

  render() {
    if (import.meta.hot) import.meta.hot.accept();
    const terminal = this.previewTerminalState ?? this.terminalState;

    return html`
      <div class="modal">
        <div class="meteor-connect-title-box">
          <div class="meteor-logo-and-title">
            <div class="meteor-logo">${unsafeSVG(svg_meteor_logo_text)}</div>
            <div class="title-text-box">
              <span class="title">Meteor</span>
              <span class="subtitle">Transfer</span>
            </div>
          </div>
          <button type="button" class="close-circle" aria-label="Close Meteor Connect" @click=${() => this.handleActionClose()}>
            ${unsafeSVG(svg_icons_text.icon_close_x)}
          </button>
        </div>
        <div class="content">
          ${
            terminal != null
              ? this.renderTerminal(terminal)
              : this.screen === "review"
                ? this.renderReview()
                : this.screen === "choose_platform"
                  ? this.renderChoosePlatform()
                  : this.renderConnect()
          }
        </div>
      </div>
    `;
  }
}
