import { consume } from "@lit/context";
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
import "./get-meteor-screen";
import { svg_icons_text } from "./graphical/svg_icons/svg_icons_text";
import { svg_meteor_logo_text } from "./graphical/svg_meteor_logo_text";
import "./meteor-action-button";
import "./meteor-mobile-bridge-panel";
import type { ITransferKeyRevealSource } from "./meteor-transfer-key-card";
import "./meteor-transfer-key-card";
import { overlayCloseTriggerContext } from "./meteor-action-ui-context";

/** Transfer supports web + mobile wallets only — the extension is deliberately excluded. */
const TRANSFER_SUPPORTED_PLATFORMS: TMeteorConnectionExecutionTarget[] = [
  "v1_web",
  "v2_bridge_mobile",
];

/** Phone glyph in the shared icon style (stroke/currentColor) — the icon set has no mobile icon. */
const svg_icon_mobile_phone =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="6.8" y="2.8" width="10.4" height="18.4" rx="2.6"/><path d="M10.5 5.5h3"/><path d="M11.99 17.9h.02" stroke-width="2.4"/></svg>';

type TTransferTerminalState =
  | "imported"
  | "keys_prepared"
  | "keys_verified"
  | "declined"
  | "expired";

const TERMINAL_COPY: Record<
  TTransferTerminalState,
  { title: string; subtitle: string; good: boolean }
> = {
  imported: {
    title: "Accounts transferred",
    subtitle: "Your accounts are now available in Meteor Wallet.",
    good: true,
  },
  keys_prepared: {
    title: "Destination keys prepared",
    subtitle: "Meteor Wallet securely prepared the destination signer. Continue in My NEAR Wallet.",
    good: true,
  },
  keys_verified: {
    title: "Destination keys verified",
    subtitle:
      "Meteor verified the submitted AddKey transactions. Recovery and cleanup continue in the wallet.",
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
 * The dedicated transfer-accounts popup flow (§ dedicated popup UI), shaped like the regular
 * <meteor-action-ui-container>: a "Choose your wallet" screen when no target platform is known,
 * or — when the action already carries one (the verify turn is pinned to the wallet that
 * answered the start; the start turn when the caller pre-selected) — straight onto the Connect
 * screen with the bridge preparing immediately, mirroring the regular popup's contextual
 * (signed-in) behavior. Connect reuses the bridge panel (QR / open link / PIN) → Reveal (key
 * card, gated on authoritative wallet_action) → terminal states. The account details themselves
 * live on the partner frontends, not in this popup.
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
  /** "Get Meteor Wallet" sub-page (same as the NEAR popup), minus the extension wallet. */
  @property({ type: Boolean }) showGetMeteor = false;

  @consume({ context: overlayCloseTriggerContext })
  @property({ attribute: false })
  public overlayCloseTrigger?: () => void;

  @state() private screen: "choose_platform" | "connect" = "choose_platform";
  @state() private mobileSession?: MobileBridgeSession;
  @state() private snapshot?: IMobileBridgeSnapshot;
  @state() private startPending = false;
  @state() private startError?: string;
  @state() private terminalState?: TTransferTerminalState;
  @state() private targetPlatform?: TTransferTargetPlatform;
  @state() private localDevWebAvailable = false;

  private actionController!: ActionUiController;
  private unsubscribeSession?: () => void;
  private farewellShownResolve?: () => void;
  /** Set once at mount: a pre-selected platform means the chooser is never offered. */
  private platformLocked = false;

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
    .content { position: relative; padding: .6rem .9rem .75rem; display: flex; flex-direction: column; justify-content: flex-start; flex-grow: 1; gap: .6rem; overflow-y: auto; min-height: 0; }
    .content.contextual { justify-content: center; }
    .content::-webkit-scrollbar { width: .35rem; }
    .content::-webkit-scrollbar-thumb { border-radius: 999px; background: rgba(255,255,255,.14); }
    .background-graphics-box { position: absolute; top: 5%; left: 10%; right: 10%; bottom: 25%; z-index: -1; background: radial-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0) 70%); }
    .background-graphics-box img { filter: blur(0.5px) brightness(1.5); opacity: 0.2; width: 100%; height: 100%; object-fit: cover; pointer-events: none; user-select: none; }

    .section-kicker { font-size: .72rem; font-weight: 700; text-transform: uppercase; color: rgba(var(--meteor-text-on-dark-dark), 1); letter-spacing: .08rem; }
    .start-error { margin: 0; color: rgb(var(--mc-red)); font-size: .74rem; line-height: 1rem; }
    /* NEAR-popup option/divider patterns (mirrors meteor-action-ui-container). */
    .options { padding: 0; width: 100%; display: flex; flex-direction: column; justify-content: center; gap: .5rem; align-items: center; }
    .option-buttons-row { display: flex; flex-direction: column; width: 100%; justify-content: center; align-items: stretch; gap: .5rem; }
    .divider { display: flex; align-items: center; justify-content: center; width: 100%; }
    .divider .section-kicker { flex-shrink: 0; margin: 0 .7rem; }
    .divider .divider-line { flex-grow: 1; height: 1px; background: rgba(255,255,255,.2); }
    .no-wallet-bottom-section { display: flex; flex-direction: column; align-items: stretch; gap: .55rem; margin-top: auto; }
    .subsection-title { margin: 0; font-size: 1.05rem; font-weight: 500; letter-spacing: .02rem; color: rgba(255,255,255,.9); }
    .back-link { align-self: center; border: 0; padding: .3rem .5rem; background: none; cursor: pointer; font-family: inherit; font-size: .72rem; color: rgba(var(--meteor-text-on-dark-dark), 1); text-decoration: underline; }
    .back-link:focus-visible { outline: 2px solid rgba(155,140,255,.95); outline-offset: 2px; }

    .terminal-stage { display: flex; flex-direction: column; align-items: center; gap: .6rem; text-align: center; padding: 1rem 0; animation: stage-in .42s cubic-bezier(.16,1,.3,1) both; }
    .terminal-icon { width: 66px; height: 66px; display: grid; place-items: center; border-radius: 21px; color: white; background: linear-gradient(145deg, #8a718f, #51425e); box-shadow: 0 12px 34px rgba(40,30,70,.3), inset 0 1px rgba(255,255,255,.2); }
    .terminal-icon.good { background: linear-gradient(145deg, #40bc86, #227a61); box-shadow: 0 12px 34px rgba(32,157,109,.27), inset 0 1px rgba(255,255,255,.2); }
    .terminal-icon svg { width: 31px; height: 31px; }
    .terminal-title { margin: 0; color: rgba(var(--meteor-text-on-dark-light), 1); font-size: 1.1rem; font-weight: 750; }
    .terminal-subtitle { max-width: 17rem; margin: 0; color: rgba(var(--meteor-text-on-dark-dark), 1); font-size: .76rem; line-height: 1.02rem; }
    @keyframes stage-in { from { opacity: 0; transform: translateY(7px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }

    /* Content transition animations (mirrors meteor-action-ui-container). */
    @keyframes fadeInContent { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes contentFadeOut { from { opacity: 1; } to { opacity: 0; } }
    .content, get-meteor-screen { animation: fadeInContent 300ms ease-out forwards; }
    .meteor-connect-title-box { animation: fadeInContent 280ms ease-out forwards; animation-delay: 40ms; }
    :host-context(meteor-action-ui-overlay[closing]) .content,
    :host-context(meteor-action-ui-overlay[closing]) get-meteor-screen,
    :host-context(meteor-action-ui-overlay[closing]) .meteor-connect-title-box { animation: contentFadeOut 200ms ease-in forwards; }

    @media (prefers-reduced-motion: reduce) { .terminal-stage, .content, get-meteor-screen, .meteor-connect-title-box { animation: none !important; } }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.actionController = new ActionUiController(this, this.action, this.closeAction);
    // Terminal screens: observe the action's settlement so a signed result / expiry renders a
    // closing state during ActionUi's farewell grace instead of vanishing instantly.
    this.targetPlatform = this.action.getTransferTargetPlatform();
    // A pre-selected platform (the verify turn is pinned to the wallet that answered the start;
    // the start turn when the caller already chose) behaves like the regular popup's contextual
    // target: skip the chooser and open straight onto that platform.
    this.platformLocked = this.targetPlatform != null;
    if (this.targetPlatform != null) {
      void this.startTransfer(this.targetPlatform);
    }
    this.action.waitForExecutionOutput().then(
      (output: unknown) => {
        if (this.action.id === "meteor_wallet_core::transfer_accounts") {
          const legacyOutput = output as { success: boolean };
          this.terminalState = legacyOutput.success ? "imported" : "declined";
        } else {
          this.terminalState =
            this.action.id === "meteor_wallet_core::new_key_account_transfer_start"
              ? "keys_prepared"
              : "keys_verified";
        }
      },
      (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        if (message === "mobile_bridge_expired") this.terminalState = "expired";
      },
    );
    // Dev-gated "Meteor Web (Local Dev)" option — same gate as the V1 dev-web target.
    void this.action.meteorConnect.mobileBridgeClient
      .isTransferLocalDevWebAvailable()
      .then((available: boolean) => {
        this.localDevWebAvailable = available;
      })
      .catch(() => {});
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
    // Show the connect screen right away — the bridge panel renders its own preparing state
    // until the session exists, the same way the regular popup's contextual flow does.
    this.screen = "connect";
    try {
      const session = await this.actionController.prepareMobileBridge({
        transferTargetPlatform: platform,
      });
      this.bindSession(session);
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
    if (this.targetPlatform === "mobile") return "Meteor Mobile";
    if (this.targetPlatform === "web_local_dev") return "Meteor Web (Local Dev)";
    return "Meteor Web";
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

  private renderChoosePlatform() {
    return html`
      <div class="background-graphics-box">
        <img src="https://storage.googleapis.com/meteor-apps-v2/graphics/meteor_connect_ui/star.gif" alt="Meteor Background Stars" class="star-gif" />
      </div>
      <div class="options" aria-label="Wallet platform choices">
        <span class="section-kicker">Choose your wallet</span>
        <div class="option-buttons-row">
          <meteor-action-button
            variant="option"
            label="Meteor Web"
            .icon=${svg_icons_text.icon_web_globe}
            @meteor-button-click=${() => this.startTransfer("web")}
          ></meteor-action-button>
          <meteor-action-button
            variant="option"
            label="Meteor Mobile"
            .icon=${svg_icon_mobile_phone}
            @meteor-button-click=${() => this.startTransfer("mobile")}
          ></meteor-action-button>
          ${
            this.localDevWebAvailable
              ? html`
          <meteor-action-button
            variant="option"
            label="Meteor Web (Local Dev)"
            .icon=${svg_icons_text.icon_web_globe}
            @meteor-button-click=${() => this.startTransfer("web_local_dev")}
          ></meteor-action-button>`
              : nothing
          }
        </div>
      </div>
      <div class="no-wallet-bottom-section">
        <div class="divider">
          <span class="divider-line"></span>
          <span class="section-kicker">Don't have a wallet?</span>
          <span class="divider-line"></span>
        </div>
        <div class="options">
          <meteor-action-button
            variant="primary"
            label="Get Meteor Wallet"
            @meteor-button-click=${() => {
              this.showGetMeteor = true;
            }}
          ></meteor-action-button>
        </div>
      </div>
    `;
  }

  private renderConnect() {
    if (this.startError != null) {
      return html`
        <p class="start-error">${this.startError}</p>
        <div class="options">
          <meteor-action-button
            variant="primary"
            label="Try again"
            @meteor-button-click=${() => {
              const platform = this.targetPlatform;
              if (platform != null) void this.startTransfer(platform);
            }}
          ></meteor-action-button>
        </div>
        ${
          this.platformLocked
            ? nothing
            : html`<button type="button" class="back-link" @click=${() => {
                this.screen = "choose_platform";
                this.startError = undefined;
              }}>Choose a different wallet</button>`
        }
      `;
    }
    if (
      this.snapshot?.phase === "wallet_action" &&
      this.action.id === "meteor_wallet_core::transfer_accounts"
    ) {
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
    const showingGetMeteor = terminal == null && this.showGetMeteor;

    return html`
      <div class="modal">
        <div class="meteor-connect-title-box">
          <div class="meteor-logo-and-title">
            ${
              showingGetMeteor
                ? html`
            <button
              type="button"
              class="close-circle"
              aria-label="Back to wallet choices"
              @click=${() => {
                this.showGetMeteor = false;
              }}
            >
              ${unsafeSVG(svg_icons_text.icon_arrow_back)}
            </button>
            <div class="title-text-box">
              <span class="subsection-title">Get Meteor Wallet</span>
            </div>`
                : html`
            <div class="meteor-logo">${unsafeSVG(svg_meteor_logo_text)}</div>
            <div class="title-text-box">
              <span class="title">Meteor</span>
              <span class="subtitle">Transfer</span>
            </div>`
            }
          </div>
          <button type="button" class="close-circle" aria-label="Close Meteor Connect" @click=${() => this.handleActionClose()}>
            ${unsafeSVG(svg_icons_text.icon_close_x)}
          </button>
        </div>
        ${
          showingGetMeteor
            ? html`<get-meteor-screen .supportedPlatforms=${TRANSFER_SUPPORTED_PLATFORMS}></get-meteor-screen>`
            : html`<div class=${`content${terminal != null || this.screen === "connect" ? " contextual" : ""}`}>
          ${
            terminal != null
              ? this.renderTerminal(terminal)
              : this.screen === "choose_platform"
                ? this.renderChoosePlatform()
                : this.renderConnect()
          }
        </div>`
        }
      </div>
    `;
  }
}
