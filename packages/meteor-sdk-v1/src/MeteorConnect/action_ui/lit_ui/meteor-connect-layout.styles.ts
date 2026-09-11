import { css, unsafeCSS } from "lit";
import { animate_meteor_logo_css } from "./graphical/styles/animate_meteor_logo_css";

export const meteorConnectLayoutStyles = [
    unsafeCSS(animate_meteor_logo_css),
    css`
      :host {
        --mc-font-size-reduction: 4px;
        --mc-line-height: normal;
        --meteor-dark-gray-lightest: 34, 34, 41;
        --meteor-dark-gray-standard: 27, 27, 38;
        --meteor-dark-gray-darkest: 14, 14, 23;

        --meteor-text-on-dark-light: 220, 220, 255;
        --meteor-text-on-dark-standard: 190, 190, 230;
        --meteor-text-on-dark-dark: 154, 151, 190;
        display: block;
        width: 100%;
        height: 100%;
      }

      :host-context(meteor-action-ui-overlay) {
        height: auto;
      }

      :host-context(meteor-action-ui-overlay) .modal {
        height: auto;
        min-height: min(668px, calc(var(--meteor-viewport-height, 100dvh) - 1rem - 2px));
        max-height: calc(var(--meteor-viewport-height, 100dvh) - 1rem - 2px);
      }

      :host([mobile-device]) .option-buttons-row { grid-template-columns: minmax(0, 1fr); }
      :host([mobile-device]) .platform-button.dev { grid-row: auto; }
      :host([mobile-device]) .modal { min-height: min(378px, calc(var(--meteor-viewport-height, 100dvh) - 1rem - 2px)); }
      /* Add your styles here */
      .modal {
        font-family: 'Gilroy', Inter, sans-serif;
        font-weight: 500;
        font-style: normal;
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
        margin: auto;
        text-align: center;
        z-index: 10001;
      }

      h2 {
        font-size: calc(1rem - 4px);
      }

      p {
        margin: 0;
      }

      .meteor-connect-title-box {
        display: flex;
        flex-direction: row;
        gap: 0.65rem;
        min-height: 3.7rem;
        padding: 0.45rem 0.75rem;
        box-sizing: border-box;
        /* background: rgba(255, 255, 255, 0.3); */
        /* background: linear-gradient(140deg, rgba(var(--meteor-topbar-blue-lightest), 0.8) 0%, rgba(var(--meteor-topbar-blue-standard), 0.5) 100%); */
        border-bottom: 1px solid rgb(var(--meteor-dark-gray-lightest));
        /* border-radius: 0.75rem; */
        align-items: center;
        justify-content: space-between;
      }

      .meteor-logo-and-title {
        display: flex;
        flex-direction: row;
        gap: 0.7rem;
        align-items: center;
      }

      #meteor_svg_logo {
        filter: drop-shadow(-0.1rem 0.1rem 0.2em rgba(0, 0, 20, 0.15));
        //filter: drop-shadow(0 -0.2em rgba(255, 255, 255, 0.5));
      }

      .meteor-logo {
        width: 2.85rem;
        height: 2.85rem;
        margin: -0.1rem;
        /* padding: 0em 0.2em 0.7em 0.7rem; */
        border-radius: 100%;
        /* background: rgba(255, 255, 255, 0.5); */
        background: linear-gradient(45deg, rgba(var(--meteor-topbar-blue-standard), 0.85) 0%, rgba(43, 51, 123, 0.65) 15%, rgba(var(--meteor-topbar-blue-lightest), 0.05));
      }

      .meteor-logo svg {
        width: 85%;
        height: 85%;
        margin-top: 0rem;
        margin-left: 0.5rem;
      }

      .close-circle {
        width: 2.75rem;
        height: 2.75rem;
        margin: 0;
        display: flex;
        flex-direction: column;
        align-items: center;  
        justify-content: center;
        border-radius: 100%;
        background: rgba(255, 255, 255, 0);
        filter: drop-shadow(0 0.05rem 0.07rem rgba(0, 0, 0, 0.5));
        cursor: pointer;
        transition: background 150ms ease;
        border: 0;
        padding: 0;
        color: inherit;
        font: inherit;
      }

      .close-circle:hover {
        background: rgba(255, 255, 255, 0.07);
      }

      .close-circle:focus-visible {
        outline: 2px solid rgba(155, 140, 255, 0.9);
        outline-offset: 1px;
      }

      .close-circle svg {
        width: 34%;
        height: 34%;
        color: rgba(var(--meteor-text-on-dark-light), 1);
        /* color: rgba(0, 0, 0, 0.2); */
        /* box-shadow: 0 0 15px 6px inset rgba(0,0,0, 1); */
        /* filter: drop-shadow(0 -1px 0 rgba(255, 255, 255, 0.2)); */
      }

      .title-text-box {
        display: flex;
        flex-direction: column;
        gap: 0.22rem;
        justify-content: center;
        align-items: flex-start;
      }

      .title-text-box .title {
        margin: 0;
        font-size: calc(1.35rem - 4px);
        font-weight: 700;
        line-height: normal;
        letter-spacing: 0.03rem;
        color: rgba(255, 255, 255, 0.9);
        filter: drop-shadow(0 0.05rem 0.07rem rgba(0, 0, 0, 0.3));
      }

      .title-text-box .subtitle {
        margin: 0;
        font-size: calc(0.68rem - 4px);
        font-weight: 700;
        line-height: normal;
        letter-spacing: 0.24rem;
        text-transform: uppercase;
        color: rgba(180, 180, 255, 1);
      }

      .title-text-box .subsection-title {
        margin: 0;
        font-size: calc(1.05rem - 4px);
        font-weight: 500;
        letter-spacing: 0.02rem;
        color: rgba(255, 255, 255, 0.9);
        filter: drop-shadow(0 0.05rem 0.07rem rgba(0, 0, 0, 0.3));
      }

      .connect-link-gif-box {
        flex-grow: 1;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .link-gif {
        max-width: 10rem;
        object-fit: contain;
        opacity: 0.35;
      }

      .options {
        padding: 0;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 0.4rem;
        align-items: center;
      }

      .meteor-connect-content {
        position: relative;
        padding: 0.5rem 0.9rem 0.6rem;
        display: flex;
        flex-direction: column;
        /* justify-content: space-evenly; */
        justify-content: flex-start;
        flex-grow: 1;
        gap: 0.45rem;
        overflow-y: auto;
        min-height: 0;
      }

      .meteor-connect-content.contextual {
        justify-content: center;
      }

      .meteor-connect-content::-webkit-scrollbar {
        width: 0.35rem;
      }

      .meteor-connect-content::-webkit-scrollbar-thumb {
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.14);
      }

      .background-graphics-box {
        position: absolute;
        top: 5%;
        left: 10%;
        right: 10%;
        bottom: 25%;
        z-index: -1;
        background: radial-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0) 70%);
      }

      .background-graphics-box img {
        filter: blur(0.5px) brightness(1.5);
        opacity: 0.2;
        width: 100%;
        height: 100%;
        object-fit: cover;
        pointer-events: none;
        user-select: none;
      }

      .section-action-title {
        font-size: calc(0.72rem - 4px);
        font-weight: 700;
        text-transform: uppercase;
        color: rgba(var(--meteor-text-on-dark-dark), 1);
        letter-spacing: 0.08rem;
        filter: drop-shadow(0 0.05rem 0.07rem rgba(0, 0, 0, 0.4));
      }

      .option-buttons-row {
        display: flex;
        flex-direction: column;
        width: 100%;
        justify-content: center;
        align-items: stretch;
        gap: 0.4rem;
      }

      .divider {
        display: flex;
        align-items: center;
        justify-content: center;
        /* margin: 0.5rem 0; */
      }

      .divider .section-action-title {
        flex-shrink: 0;
        margin: 0 0.7rem;
      }

      .divider .divider-line {
        flex-grow: 1;
        height: 1px;
        background: rgba(255, 255, 255, 0.2);
      }

      .no-wallet-bottom-section {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 0.45rem;
        margin-top: auto;
      }

      .qr-section {
        height: 190px;
        box-sizing: border-box;
        // width: 100%;
        display: flex;
        align-items: center;
        // flex-gap: 1rem;
        justify-content: center;
        padding: 1rem;
        border-radius: 1rem;
        background: rgba(var(--meteor-dark-gray-darkest), 1);
        box-shadow: inset 0 4px 20px rgba(0, 0, 0, 0.3);
      }

      .qr-container {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        align-items: center;
        justify-content: center;
      }

      .qr-code-target {
        width: 130px;
        height: 130px;
        display: grid;
        place-items: center;
        background: white;
        border-radius: 0.75rem;
        padding: 0.25rem;
        box-sizing: border-box;
      }

      .qr-helper {
        font-size: calc(0.8rem - 4px);
        line-height: normal;
        font-weight: 500;
        color: rgba(var(--meteor-text-on-dark-dark), 1);
      }

      /* Content transition animations */
      @keyframes fadeInContent {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fadeOutContent {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(-8px);
        }
      }

      @keyframes contentFadeOut {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }

      .meteor-connect-content {
        animation: fadeInContent 300ms ease-out forwards;
      }

      meteor-action-ui-executing {
        animation: fadeInContent 300ms ease-out forwards;
      }

      get-meteor-screen {
        animation: fadeInContent 300ms ease-out forwards;
      }

      continue-action-screen {
        animation: fadeInContent 300ms ease-out forwards;
      }

      .meteor-connect-title-box {
        animation: fadeInContent 280ms ease-out forwards;
        animation-delay: 40ms;
      }

      /* Apply fade out to content when parent overlay is closing */
      :host-context(meteor-action-ui-overlay[closing]) .meteor-connect-content,
      :host-context(meteor-action-ui-overlay[closing]) meteor-action-ui-executing,
      :host-context(meteor-action-ui-overlay[closing]) get-meteor-screen,
      :host-context(meteor-action-ui-overlay[closing]) continue-action-screen,
      :host-context(meteor-action-ui-overlay[closing]) .meteor-connect-title-box {
        animation: contentFadeOut 200ms ease-in forwards;
      }

      .modal { background: #0e0e18; color: #fff; }
      .meteor-connect-title-box { padding: .8rem 1.2rem; min-height: 4.25rem; }
      .meteor-logo { background: none; width: 2.5rem; height: 2.5rem; flex-shrink: 0; }
      .meteor-logo img { display: block; width: 100%; height: 100%; object-fit: contain; }
      .title-text-box .title, .title-text-box .subsection-title, .page-title { font-family: 'Gilroy', sans-serif; font-weight: 500; font-style: normal; font-size: 22px; line-height: normal; letter-spacing: 0px; vertical-align: bottom; }
      .close-circle svg { width: 55%; height: 55%; }
      .meteor-connect-content { padding: 1rem 1rem 0; gap: .8rem; }
      .options { align-items: stretch; gap: .75rem; }
      .section-action-title, .mobile-divider { font-family: 'Gilroy', sans-serif; font-weight: 400; font-style: normal; font-size: 16px; line-height: normal; letter-spacing: 0px; vertical-align: bottom; }
      .section-action-title { text-transform: none; color: #999; text-align: left; filter: none; }
      .option-buttons-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem; align-items: stretch; }
      .platform-button { display: flex; align-items: center; justify-content: center; gap: .5rem; width: 100%; min-height: 3rem; padding: .65rem .8rem; background: #21213f; color: #fff; border: 0; border-radius: .4rem; font-family: 'Gilroy', sans-serif; font-weight: 600; font-style: normal; font-size: 16px; line-height: normal; letter-spacing: 0; text-align: center; cursor: pointer; }
      .mobile-request-spinner { width: 1.3rem; height: 1.3rem; flex-shrink: 0; border: 2px solid rgba(255,255,255,.35); border-top-color: white; border-radius: 50%; animation: mobile-request-spin .8s linear infinite; }
      @keyframes mobile-request-spin { to { transform: rotate(360deg); } }
      .platform-button:disabled { cursor: not-allowed; background: #29263f; color: #aaa6bf; filter: none; }
      .platform-button:disabled[aria-busy="true"] { cursor: wait; }
      .platform-button.primary:not(:disabled) { background: linear-gradient(110deg, #4210ec, #602cff); }
      .platform-button.dev { grid-column: 1 / -1; grid-row: 2; }
      .platform-button span { min-width: 0; overflow-wrap: anywhere; }
      .platform-button svg { width: 1.6rem; height: 1.6rem; flex-shrink: 0; }
      .platform-button:hover:not(:disabled), .get-wallet-link:hover { filter: brightness(1.15); }
      button:focus-visible { outline: 2px solid #a991ff; outline-offset: 3px; }
      .mobile-divider { display: flex; align-items: center; gap: 1rem; color: #777; }
      .mobile-divider > span { height: 1px; background: #33333c; flex: 1; }
      .mobile-divider strong { color: #fff; font-weight: inherit; }
      .no-wallet-bottom-section { flex-direction: row; flex-wrap: wrap; justify-content: center; align-items: center; gap: .65rem; margin: auto -1rem 0; padding: 1rem; background: #12121e; color: #999; font-size: calc(1.15rem - 4px); }
      .get-wallet-link { border: 0; background: none; padding: 0; font: inherit; color: #8060ff; cursor: pointer; }
      @media (max-height: 760px) {
        .meteor-connect-title-box { min-height: 4rem; padding: .65rem 1.2rem; }
        .meteor-connect-content { padding-top: 1rem; gap: .8rem; }
        .options { gap: .65rem; }
        .platform-button { min-height: 3rem; }
        .no-wallet-bottom-section { padding-top: .8rem; padding-bottom: .8rem; }
      }
      @media (max-width: 480px) {
        .meteor-connect-title-box { padding: .8rem 1rem; }
        .meteor-connect-content { padding: 1rem 1rem 0; gap: .8rem; }
        .option-buttons-row { gap: .5rem; }
        .mobile-divider { gap: .75rem; }
      }
    `,
  ];
