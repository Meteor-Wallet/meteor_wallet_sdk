# Meteor UI standard

The user approved the current Meteor Connect / Meteor Transfer styling as the baseline for future UI work. Prefer the validated desktop styling when resolving differences; mobile shares its visual language with an intentionally simpler layout. Explicit later user requests supersede this baseline.

## Shared implementation

- `meteor-connect-layout.styles.ts`: shared shell, typography, buttons, spacing, footer and responsive styling. Both containers consume this directly; change shared styles instead of copying them.
- `meteor-mobile-bridge-panel.ts`: shared loading, QR, pairing and connection states; `connectDesign` enables this design.
- `meteor-action-ui-overlay.ts`: responsive minimum dimensions.
- `graphical/meteor-header-logo.ts`: approved static SVG for headers.
- `graphical/meteor-connect-logo.ts`: animated GIF for continuation screens.

Connect and Transfer still own separate markup and behavior. Preserve their action-specific semantics.

## Typography

Use Gilroy, natural (`normal`) line heights, and zero letter spacing for the main labels and buttons. Do not restore the original fixed 50px or 16px line heights.

| Element | Current size | Weight |
| --- | --- | --- |
| Header | 22px | 500 Medium |
| Platform buttons | 16px | 600 SemiBold |
| Chooser heading and mobile divider (including “mobile”) | 16px | 400 Regular |
| Scan heading | 16px | 400 Regular |
| QR generation message | 12px | 400 Regular |
| Footer | `calc(1.15rem - 4px)` | inherited 500 |

The user reduced all sizes by a total of 4px. The shared bridge panel receives `--mc-font-size-reduction: 4px` and `--mc-line-height: normal`; avoid subtracting another 4px from already adjusted values. Countdown/open controls use `calc(.95rem - 4px)`.

## Surfaces and controls

- Modal: `#0e0e18`; QR/loading card: `#12121D`; footer: `#12121e`.
- Primary button: 110-degree gradient `#4210ec` → `#602cff`.
- Secondary button: `#21213f`; disabled: `#29263f` with `#aaa6bf` text and no hover highlight.
- Muted labels: `#999`; divider text: `#777`; wallet link: `#8060ff`.
- Button radius: `.4rem`; minimum height: `3rem`; padding: `.65rem .8rem`; icon/text gap: `.5rem`; icons: `1.6rem`.
- Keep visible keyboard focus and accessible loading/disabled semantics.
- Header uses the supplied static white SVG in a fixed `2.5rem` box with `object-fit: contain`, without the old GIF scaling.

## Spacing and sizing

- Content padding: `1rem 1rem 0`; section gap: `.8rem`.
- Chooser heading/button gap: `.75rem` (`.65rem` on short viewports).
- Platform grid gap: `.5rem`; mobile divider gap: `1rem` (`.75rem` on narrow screens).
- Header padding: `.8rem 1.2rem`, minimum height `4.25rem`; short viewport: `.65rem 1.2rem`, minimum `4rem`; narrow viewport: `.8rem 1rem`.
- Footer padding: `1rem` (vertical `.8rem` on short viewports), negative side margins matching content padding, `margin-top: auto` so it reaches the bottom.
- Outer modal minimum width: 480px on desktop, 500px on mobile (viewport-capped); desktop minimum height: 670px; mobile minimum height: 380px. Dimensions are automatic and capped to viewport minus 1rem. Inner minimum heights account for the 2px border.
- Retain QR scannability: current plain code with no center logo, 216px normally / 180px on short viewports. Do not scale the QR down with text.

## Desktop/mobile behavior

- Desktop: platform buttons side by side; conditional Dev Web (Localhost) on a full-width second row. Mobile QR/loading card below, no Open Meteor Mobile button on desktop.
- Mobile: stacked Meteor Mobile primary and Meteor Web secondary buttons; no extension or QR/toggle. Preserve the existing dev-option visibility rule.
- Create the mobile request eagerly. Until its link is ready, show a spinner and “Preparing connection” in a disabled mobile button.
- Clicking Meteor Mobile directly calls the same `openCurrentSessionInApp` path as Open Meteor Mobile; do not toggle the QR/connection panel on click. Session advancement can reveal required pairing/approval states.
- Get Meteor Wallet keeps internal installation navigation despite the arrow decoration.
- No cancel-request or refresh-code button on these redesigned pages. Retain header close behavior and existing protocol lifecycle/recovery behavior.

Verify desktop and real phone-width previews when changing layout. Use package-local TypeScript checks; run relevant tests from `packages/meteor-sdk-v1` so its decorator configuration is applied.

## Transfer after platform selection

Transfer now navigates to a centered continuation screen after choosing a platform (including mobile). Show the approved GIF, “Creating secure request” while preparing, then “Continue in [wallet]” and platform-specific instructions. Retain the expiry countdown, link recovery, and a primary-gradient “Open [wallet]” button on this screen, including desktop. Reuse the eagerly prepared mobile request. Keep PIN, identity recovery, key reveal and terminal states functional. This Transfer-specific flow supersedes the chooser-only mobile click rule above; Connect retains that rule.

## Shared continuation presentation

`meteor-wallet-continuation.ts` owns the centered GIF, platform-aware copy, loading indicator and primary Open button for Connect and Transfer. Bridge sessions provide “Session expires in” and recovery UI via slots. Legacy executing actions have no session deadline or safe reopen callback, so those controls are omitted rather than restarting an active action. The pre-execution known-platform screen passes its existing continue callback.

## Get Meteor Wallet

Connect and Transfer share `get-meteor-screen.ts`: an orbital smiling-meteor illustration, “Get Meteor Wallet” heading, “Your gateway to the NEAR Universe” subtitle, and a two-column grid of secondary links (Extension, Web, Android, iOS). Installation destinations are independent of the current action's supported platforms; hide Extension on mobile devices and show only the matching native store (Android on Android; iOS on iPhone/iPad, including iPad desktop-mode user agents). Keep Web available and both stores visible on desktop. Keep the existing header back and close controls. Use the explicit store URLs in that component, including the Google Play `hl=en` parameter.

On the desktop Transfer chooser, always display Chrome Extension with `svg_icons_text.icon_chrome` in the second slot. Disable it using the shared disabled button style when the transfer type or extension capability does not support it. Keep it absent on mobile.

For a mobile-wallet continuation, desktop browsers show the session QR in the centered visual slot and hide Open Meteor Mobile; mobile devices show the primary Open Meteor Mobile button without a QR. The session countdown stays visible in both. Web/extension wallet continuations retain their own Open control.
