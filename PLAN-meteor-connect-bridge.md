# Meteor Connect Mobile Bridge Integration Plan

**Status:** Session-protocol migration in progress; the legacy 0.9 implementation described below is
the audited baseline, not the release target.<br>
**Last reviewed:** 2026-08-19 (session-v1 migration amendment)<br>
**Primary scope:** `packages/meteor-sdk-v1/src/MeteorConnect` and its Meteor Connect popup  
**Reference implementation:** `../mc_backend/packages/demo-partner-web`, `../mc_backend/packages/demo-wallet-expo`, `../mc_backend/packages/meteor-connect-client`, and `../mc_backend/packages/meteor-connect-shared`

## 0. Session-protocol migration amendment (authoritative)

`../meteor-connect-bridge/PLAN-multiple-actions-bridge.md` and its remediated
`REVIEW-refactor-pre-production.md` supersede the legacy bridge lifecycle in the remainder of this
document. The bridge has no production deployment depending on the old single-action mode, so this
SDK must ship only the session-native producer surface. Historical `PartnerBridgeClient`,
`PartnerBridgeStore`, `create_bridge`, `request_action_via_push`, `verify_pin`, `cancel_bridge`, and
terminal `completed`-store references below describe the implementation being replaced; they are not
compatibility requirements.

All sibling repositories are explicitly pre-production. The bridge therefore deletes its legacy
mode and completes D30 first; this SDK then consumes only the final neutral session API. There is no
adapter, dual-mode interval, or fallback to the old client/store. Ordinary NEAR actions remain
fail-closed until the receiving wallets have implemented and crash-tested their D33 obligations.

### 0.1 Required SDK architecture

- One coordinator-owned `PartnerSessionClient`, with backend-scoped identity storage,
  `withPairedWalletMutationLock`, and `withSessionMutationLock` backed by the existing cross-tab
  lease provider.
- One SDK-local session projection driven by authenticated session facts and verified result
  waiters. No package-global bridge store is imported or reset.
- `createSession()` stages every action. Ordinary one-turn actions and `transfer_accounts` close
  only through `acknowledgeAndClose(receipt)` after the SDK has validated and durably applied any
  host-owned result effect.
- Push targets one exact paired-wallet record through `clientConnectionInfo` plus
  `notifyWalletForInitialClaim()`. A notification failure retains the same QR/deep-link session.
- Cancel/refresh maps the authenticated phase to `closeSession()`, `requestCloseAfterTurn()`, or
  `abandonResultAndClose(receipt)`; local disconnect is never presented as remote cancellation.
- The SDK persists only non-secret recovery identities and exact signed result/turn receipts.
  Bridge lease, partner secret, PIN, and action plaintext remain process-local. A terminal or
  process-lost bridge is recovered through the feature journal and a fresh session.
- The new-key API keeps one `external_work_v1` session across start result, durable result journal,
  `acknowledgeAndBeginExternalWork`, caller-owned finalized AddKey proofs, prepared verify turn,
  current-turn wake, verified result acknowledgement, and close. If the live session is lost, only
  the verification action is rebuilt in a fresh `single_turn_v1` session pinned to the same wallet.
- `transfer_accounts` uses `single_turn_v1` + fresh PIN and is considered complete only after the
  signed result receipt is acknowledged/closed. The transfer encryption key remains ephemeral and
  never enters the session journal.
- Wallet protocol v2 is requested, but the SDK rollout flag stays off until compatible wallet
  builds and the backend are jointly qualified. No production wallet may advertise v2 before all
  of its admitted action resolvers satisfy D33.

### 0.2 Migration checklist

- [ ] Replace the legacy partner client/store with the session client and authenticated fact
  projection; add exact-wallet selection and both mutation locks.
- [ ] Convert QR, PIN, push, result, close, refresh, reconnect, expiry, and terminal error handling
  to session phases and receipts.
- [ ] Add durable partner result/application receipts and failure-injection coverage for result
  validation, local key persistence, lost acknowledgement, reload, and cross-tab contention.
- [ ] Retain and advance the live new-key session across external work; preserve the existing
  fresh-session verification fallback and exact-wallet routing.
- [ ] Update dependencies to the coordinated connect/shared/NiceCode generation and remove every
  executable legacy import/call.
- [ ] Update SDK docs/security text and tests; run type-check, unit, build, package, browser, local
  backend, and real-device gates before enabling the feature.
- [ ] Consume the coordinated D27 deletion/D30 neutral rename directly and pin the final released
  package versions after all repository gates pass.

## Implementation status (legacy baseline)

The protocol/backend/client changes and the SDK mobile bridge path described below are now present in
the two local repositories. The source has passed workspace type checks, upstream package builds,
backend integration tests, partner-client tests, focused SDK adapter/coordination tests, the SDK
library build, the demo web build, and the Near Connect production executor build.

The rollout flag intentionally remains off by default. The following are operational release gates,
not missing source implementation:

- publish the new `@meteorwallet/connect` and `@meteorwallet/connect-shared` versions and regenerate
  the SDK lockfile from those published artifacts;
- deploy the compatible backend and mobile wallet implementation;
- run the two-real-client concurrent-channel isolation gate and the browser/web-extension regression
  matrix;
- test the built manifest/native custom-scheme path in the real Near Connect sandbox host and on real
  mobile devices; and
- inspect the final package tarball from the published dependency graph before progressively enabling
  mobile in production.

## 1. Objective

Add the new Meteor mobile wallet as a first-class MeteorConnect execution path by using the published `@meteorwallet/connect` and `@meteorwallet/connect-shared` packages.

For a mobile-eligible NEAR request, the SDK must:

1. Package the request as the matching typed `act_impl_near` Nice Action.
2. Create a Meteor bridge as soon as the action prompt starts.
3. Present the production Meteor mobile deep link in a section labelled **Meteor Mobile** — as a QR code on desktop browsers; when the dApp itself is being browsed on a mobile device, as a primary **Open in App** deep-link button with a secondary QR-icon toggle for the case where the browsing device is not the wallet device.
4. Keep the QR/deep link available as the fallback even when a push is attempted.
5. If the action targets an account that signed in through the Meteor mobile wallet, create the bridge through `request_action_via_push` so the backend attempts an immediate push notification to that exact wallet. This mirrors how a v1 extension-connected account already re-opens the extension directly. Sign-in never pushes — see 5.6.
6. Handle first-time QR pairing, including the mandatory PIN-verification step (4-digit PIN, limited attempts — see 5.1).
7. Wait for the encrypted, wallet-signed result streamed through `PartnerBridgeStore`, validate and convert it, then resolve the existing SDK action promise with the same public output type callers receive today.
8. Preserve the existing Meteor web and Chrome extension clients, URLs, buttons, contextual routing, action conversions, and response behavior.

This is an SDK integration, not a replacement of the current v1 web or extension implementations.

## 2. Definitions

- **Partner / dApp:** the website using MeteorConnect. In bridge terms, the SDK is a `PartnerBridgeClient`.
- **Wallet:** the new Meteor mobile app. It is a `WalletBridgeClient` and is responsible for claiming the bridge, displaying/performing the NEAR action, and returning the Nice Action result.
- **Pairing:** the first QR + PIN exchange that links the partner identity to the wallet identity.
- **Trusted/paired wallet:** a wallet previously linked to this partner. The backend may skip PIN verification, and the partner may request a new action by push.
- **Prepared mobile session:** a bridge that exists and has a QR, but whose wallet has not yet claimed it. Web/extension may still be selected at this stage.
- **Committed mobile session:** a wallet has claimed the bridge. The action is now locked to mobile to avoid executing it on two platforms.

## 3. Scope boundaries

### In scope

- A new partner-side mobile bridge target inside `MeteorConnect`.
- Typed conversion between the SDK's existing `MCNearActions` model and `act_impl_near`.
- Persistent partner identity and paired-wallet storage using the storage supplied to `MeteorConnect.initialize`.
- Automatic push attempt for actions targeting an account connected through the mobile wallet.
- QR, deep-link, push outcome, PIN, progress, retry, expiry/failure, and completion states in the Lit popup.
- Correct result conversion back to the existing `@meteorwallet/sdk` public types.
- Regression coverage for current web and extension behavior.
- Small upstream additions to the bridge packages/protocol that are required to make eager mobile preparation safe.

### Out of scope

- Replacing `MeteorConnectV1Client`, `MeteorWallet`, or `MeteorPostMessenger`.
- Changing the existing Chrome Web Store URL or legacy web wallet URL.
- Implementing push registration or notification handling in the SDK. Those are wallet responsibilities and already exist in the Expo reference flow.
- Rebuilding the main mobile wallet action-resolution screens. The SDK will emit the shared `act_impl_near` contract the wallet already consumes.
- Supporting multiple simultaneous MeteorConnect action popups **within one page**. The SDK UI is singleton-based per tab. Separate same-origin tabs may each run their own bridge concurrently after the 5.8 channel-isolation gate; only identity provisioning, short paired-wallet mutations, first-pairing windows, and destructive reset are serialized across tabs.
- Publishing the connect packages or SDK. Release commands remain a maintainer action.

## 4. Source review and current behavior

### 4.1 `@meteorwallet/connect-shared`

The source package is `../mc_backend/packages/meteor-connect-shared` and the installed SDK dependency is version `0.2.0`.

The public `act_impl_near` domain defines these wire actions:

| Shared action | Input highlights | Output |
| --- | --- | --- |
| `sign_in` | network, optional function-call key | `NearAccount[]` |
| `sign_in_and_sign_message` | sign-in fields plus base64 nonce message | `NearAccountWithSignedMessage[]` |
| `sign_out` | optional network | `null` |
| `sign_message` | message, recipient, `nonceBase64`, optional network/signer | signed message |
| `sign_and_send_transaction` | receiver and connector actions | final execution outcome |
| `sign_and_send_transactions` | transaction array | final execution outcome array |
| `sign_delegate_actions` | delegate transaction array | base64 Borsh signed delegates |
| `verify_owner` | network and message | Meteor verify-owner payload |

The schemas deliberately use JSON-safe values:

- `Uint8Array` nonces become base64 strings.
- `@near-js/transactions` action instances become connector actions shaped as `{ type, params }`.
- large integers inside action parameters become strings.
- transaction outcomes remain full JSON objects.
- signed delegate actions are base64 Borsh strings.

The production mobile app IDs and generated links are:

- `EMeteorAppId.meteor_wallet_mobile` → `meteorwallet://bridge_request?bridgeId=...`
- `EMeteorAppId.meteor_wallet_mobile_dev` → `meteorwalletdev://bridge_request?bridgeId=...`

The partner secret is not part of the backend-generated query string. The partner must append it as:

```text
#partnerSecret=<url-encoded-secret>
```

Keeping it in the fragment prevents it from entering HTTP access logs and referrer headers.

### 4.2 `@meteorwallet/connect`

The source package is `../mc_backend/packages/meteor-connect-client`; its npm name is `@meteorwallet/connect`. The installed SDK dependency is version `0.2.0` and already exposes the required push APIs.

`PartnerBridgeClient` provides the partner-side operations required by the SDK:

- `initialize_client()` provisions/restores the partner crypto identity.
- `get_paired_wallets()` reads the persisted wallet verify-key handles.
- `create_bridge({ actionRequest, meteorAppIds })` creates a QR/deep-link bridge.
- `request_action_via_push(...)` creates a fresh bridge, seals its secret for a paired wallet, attempts `notify_wallet`, and leaves the QR bridge live regardless of push outcome.
- `verify_pin({ pinCode })` completes first-time pairing.
- `disconnect_bridge()` tears down the local bridge session without deleting the persistent partner identity or paired-wallet records.
- `PartnerBridgeStore` exposes the lifecycle `idle → waiting_for_wallet → wallet_verification → wallet_action → completed|failed`.

Constraints the SDK design must account for:

- **`PartnerBridgeStore` carries no connection state.** Link drops, redials, realm reconnects, and attach failures surface only through `protected` hooks on `BridgeClientBase` (`onBridgeLinkEvent`, `onBridgeRealmStatus`, `onBridgeRealmAttachError`, `onBridgeRealmDiagnostic`), which `PartnerBridgeClient` leaves as console no-ops. The SDK must subclass `PartnerBridgeClient` to observe them (see 7.4), or an upstream addition must mirror status into the store.
- **`PartnerBridgeStore` is a module-global singleton.** Two clients in the same JavaScript realm overwrite the same store. The store is realm-scoped, so cross-tab contamination is impossible; the exposure is limited to same-realm double construction, which the SDK's process-wide coordinator (5.8) rules out by guaranteeing exactly one partner client per realm. The instance-scoped store refactor (8.5) is therefore recommended hygiene rather than a release blocker.
- **One attach failure is unrecoverable without special handling.** An `identity_pin_mismatch` (the backend has a different verify key pinned for this client identity) permanently parks the redial ladder — retrying can never succeed. Left unhandled it presents as an eternal spinner. A plain `reset_client()` is not sufficient: paired wallets are stored in a separately prefixed adapter and can survive the base clear. Recovery requires the dedicated, comprehensive identity reset specified in 8.4, explicit user confirmation, and QR + PIN pairing again.

On completion, the client has already:

- decrypted the wallet result end to end;
- verified the wallet identity signature when one is present; and
- placed the Nice Action result JSON in `bridge.actionResult.result`.

The SDK must still validate that the result belongs to the expected NEAR action, hydrate it with the installed `ActionDomain.hydrateResultPayload(...)` API, and convert its typed output to the existing SDK type (see section 10). Hydration performs schema deserialization/validation and reconstructs typed Nice Errors; the SDK must not duplicate that logic manually.

### 4.3 Demo partner flow

`../mc_backend/packages/demo-partner-web` demonstrates the intended partner sequence:

1. Construct `PartnerBridgeClient` with backend URL, partner metadata, and durable storage.
2. Build an action using `act_impl_near.action.<id>.request(input).toJsonObject()`.
3. For QR-only, call `create_bridge`.
4. For a paired wallet, call `request_action_via_push`; this creates the bridge before notifying, so QR fallback is always available.
5. Build the final QR/deep link from `walletLinks[n].linkString` plus the partner-secret fragment.
6. Observe `PartnerBridgeStore`.
7. When `wallet_verification` is reached, collect the wallet's displayed PIN and call `verify_pin`.
8. When `completed` is reached, consume the decrypted and signature-checked action result.

Important: a push result of `{ delivered: true }` means FCM accepted the message. It does not mean the user approved the action. The SDK must continue waiting for the bridge result.

Push failures are non-terminal. Current reasons are:

- `link_not_found`
- `not_trusted`
- `no_token`
- `send_failed`

Each must leave the QR visible and usable.

### 4.4 Demo Expo wallet flow

`../mc_backend/packages/demo-wallet-expo` demonstrates the wallet responsibilities with the same libraries:

- A deep link atomically parses `bridgeId` from the query and `partnerSecret` from the fragment.
- A push supplies `bridgeId`, `partnerId`, and a sealed secret.
- Partner keys saved at the first successful pairing are used to unseal the pushed secret.
- QR and push both converge on the same `claim_bridge({ bridgeId, partnerSecret })` path.
- A trusted wallet may land directly in `wallet_action`; a first-time wallet lands in `wallet_verification` and shows a PIN.
- The wallet hydrates `act_impl_near`, executes the matching action UI, creates the typed Nice Action result, and calls `complete_action`.
- Foreground, background-tap, and cold-start notification paths all feed the same claim controller.
- **A received push routes straight to `claim_bridge` with no user tap** — including silent foreground receipt. Because a trusted wallet's claim skips PIN and lands directly in `wallet_action`, a push can commit a bridge to mobile without any user interaction on the phone. This is why push is restricted to actions already routed to mobile (see 5.6).

The SDK does not reproduce this wallet logic. It only needs to generate the identical action and bridge contract.

### 4.5 Current SDK architecture

The relevant package is `packages/meteor-sdk-v1`.

Current flow:

1. A caller invokes `MeteorConnect.createAction` with an existing `near::*` request.
2. `MeteorConnect` expands account context and gathers target configs from its clients.
3. `ExecutableAction.promptForExecution` opens `ActionUi`.
4. `MeteorActionUiContainer` renders Chrome extension and web buttons.
5. `ExecutableAction.execute(target)` delegates to the target client.
6. Sign-in/sign-out results update MeteorConnect's account storage.

Current target clients:

- `MeteorConnectV1Client`: working `v1_web`, `v1_web_localhost`, and `v1_ext` implementation.
- `MeteorConnectV2MessengerClient`: declares old request-ID/deep-link targets but returns no execution configs and implements no actions.
- `MeteorConnectTestClient`: test-only target.

The popup already depends on `qr-code-styling` and contains dormant QR rendering code. That code currently renders a hard-coded placeholder and is not wired to an action.

The recent SDK commit `2faf830` already added:

```json
"@meteorwallet/connect": "^0.2.0",
"@meteorwallet/connect-shared": "^0.2.0"
```

No MeteorConnect source currently imports or uses either package.

## 5. Requirements clarified by the source review

### 5.1 PIN entry is required

A first-time QR scan does not proceed directly to the wallet action. It stops at `wallet_verification`, and the partner must submit the wallet-displayed PIN. A QR-only UI without PIN entry would work only for already-trusted wallets and would leave new users stuck.

The intended PIN contract is **exactly three submitted attempts**. The current backend does not yet implement that contract correctly: it increments before checking and fails only when the count is greater than three, so a fourth call fails even if correct; ordinary wrong attempts are also thrown without persisting the incremented counter. Phase 0 must correct this before the SDK relies on the attempt limit.

Required backend semantics after the Phase 0 fix (8.6, core semantics — release blocking):

- the PIN is **4 digits** (`generateClientSecurityPinCode(4)`);
- every submitted PIN is counted and persisted atomically before returning;
- a correct PIN on attempt 1, 2, or 3 succeeds;
- an incorrect PIN on attempt 1 or 2 remains retryable;
- an incorrect PIN on attempt 3 atomically transitions pairing and core status to terminal `failed` with the reason `PIN attempts exceeded`;
- attempts cannot be reset by Durable Object eviction, hibernation, reconnect, duplicate delivery, or page reload;
- recovery from the terminal state is a brand-new bridge/QR, restarting pairing.

Exposing authoritative `attemptsUsed`/`attemptsRemaining` to the partner (in the response and mirrored realm/store state) is **recommended, not blocking** (8.6): protocol/schema surface work the SDK can operate without. The error ID may remain `pin_incorrect`; the terminal bridge state is what distinguishes retryable from terminal outcomes.

The SDK defends itself regardless of which parts have shipped: it caps itself at **three submissions per bridge** (never sending the fourth call that today's backend fails even on a correct PIN), renders the server attempt count when the surface exists and its own capped submission count otherwise, treats the store's `failed` step as the terminal signal, and never uses the local count as the security boundary.

The popup therefore needs a first-pairing state with:

- a 4-digit PIN input (no coercion of leading zeroes);
- an explicit Verify/Continue action;
- pending and validation error states, including remaining-attempt feedback after a wrong PIN;
- a terminal attempts-exceeded state that offers "Create a new mobile QR" rather than further retries; and
- an option to keep/show the QR while verification is pending.

### 5.2 Eager mobile preparation can race legacy execution

Creating the bridge before a user clicks Web App or Chrome Extension means two independent wallet paths temporarily possess the same action. Today the bridge protocol has no partner-side cancel/abandon operation.

Without cancellation, this sequence is possible even with sign-in push removed (5.6):

1. SDK eagerly creates the QR/deep-link bridge.
2. The user scans the QR (or taps the deep link), then changes their mind and clicks Web App.
3. The web wallet executes the transaction.
4. The mobile wallet still holds the live claimed bridge and executes the same transaction again.

Production bridge expiry is five minutes, so merely disconnecting the SDK WebSocket is not sufficient. The backend bridge remains claimable.

This is a release-blocking correctness issue for transaction and delegate-action requests. Section 8.1 defines the required cancellation addition. It also requires idempotent create/push recovery: if bridge creation succeeds but the response is lost, the SDK has the same duplicate-execution problem unless it can recover and cancel that exact bridge rather than creating another one (8.1.1).

### 5.3 Contextual account routing must remain intact

Existing signed-in accounts retain the execution target through which they were connected. Actions with `executionTargetSource: "targeted_account"` route back to that target automatically.

To preserve web and extension behavior exactly:

- accounts connected through v1 web/extension continue through v1 without creating a mobile bridge;
- accounts connected through the new mobile bridge store a mobile connection config and use immediate push/QR on later actions;
- sign-in and sign-in-plus-message have no existing account target, so the popup prepares mobile while continuing to offer the unchanged web/extension choices.

Cross-platform signing with an account originally connected through a different target is a separate account-linking feature and is not part of this phase.

### 5.4 Partner identity must be durable and dApp-specific

Push works only after the same partner identity has paired once with the wallet. Recreating keys or changing the storage namespace makes the dApp look like a new partner and forces QR + PIN again.

The bridge storage must therefore:

- use the `storage` implementation passed to `MeteorConnect.initialize`;
- use a stable, dedicated key prefix;
- separate production and development backend identities;
- survive page reloads; and
- never be cleared when only the active bridge is replaced.

### 5.5 Paired-wallet selection must be deterministic

`get_paired_wallets` can return more than one wallet, but `request_action_via_push` accepts one wallet and creates a new bridge internally. Retrying it for several wallets would create several live bridges for the same request.

Selection policy — push is driven **only** by the account's stored connection, exactly like the existing v1 contextual routing:

1. Push only when the action targets an account whose stored connection is `v2_bridge_mobile`, using the exact `walletVerifyPublicKey` persisted in that connection config at sign-in, and the currently authenticated paired-wallet record for that key proves the required protocol capabilities (8.7.1). This is the mobile analogue of "the extension pops up straight away because the account signed in with the extension".
2. Sign-in — and any action without a mobile-connected contextual account — **never pushes**. It creates a QR/deep-link bridge with `create_bridge` only. No "most recently paired wallet" heuristic; `get_paired_wallets` is not used for target selection.
3. If push to the account's wallet is not delivered, keep that bridge and show its QR/deep link; do not create another bridge automatically.

Exposing the active paired-wallet record after claim is a release requirement, not an optional optimization. Without it the SDK cannot persist the exact verify key while also honoring the no-inference policy (section 8.2).

### 5.6 Push is contextual-only because wallets auto-claim pushes

The reference wallet claims a bridge the moment a push arrives — foreground receipt included, no user tap (4.4) — and a trusted wallet's claim lands directly in `wallet_action`. If sign-in pushed eagerly, a user sitting at their desktop intending to click **Web App** would be locked out of it (per the 6.3 commitment rules) the instant their phone — possibly in a pocket — auto-claimed the bridge. The SDK cannot distinguish "user engaged on the phone" from "phone auto-claimed".

Restricting push to mobile-connected contextual accounts removes the trap structurally:

- for a mobile-connected account, the popup is mobile-only anyway (6.1), so an auto-claim commits nothing the user didn't already choose at sign-in;
- for sign-in, a claim can only result from a QR scan or a deep-link tap — both of which **are** user intent, so the 6.3 commitment rules stay sound.

Independently, it remains good product hygiene for the production mobile wallet to require a user tap before acting on a pushed request (the action-approval screen already provides this), but the SDK design no longer depends on wallet-side behavior for correctness.

### 5.7 Mobile account routing records are environment- and identity-bound

A wallet verify key is meaningful only with the backend, Meteor app, and partner identity under which it was paired. A persisted development account must never be pushed through the production backend, and an account created under an old/reset partner identity must not be treated as trusted under the replacement identity.

Every new `v2_bridge_mobile` connection record must therefore contain:

- a connection schema version;
- a stable environment ID derived from the normalized backend origin;
- the configured Meteor app ID;
- the current partner client/identity ID; and
- the exact active wallet verify-key handle.

Before contextual routing, all five stored routing values must match the active bridge client, and the exact paired-wallet record must carry authenticated proof of the capabilities required by this bridge. On a legacy/incomplete/mismatched/capability-missing record, do not push. Prepare a QR/deep-link bridge and require pairing again. After a successful authenticated non-sign-out action **whose result passes the account-identity validation in section 10** (the result demonstrably came from the targeted account), update that targeted account's connection record from the current environment/partner identity and exact active wallet. Sign-out removes the account only after its returned signed-out account ID passes the same validation. Never refresh/remove from a result whose account identity was not validated, never silently reinterpret a development handle as production, and never infer a replacement wallet from `get_paired_wallets()`.

### 5.8 Same-page and cross-tab concurrency require an ownership policy

The durable partner identity is intentionally shared by same-origin tabs, but the protocol itself supports concurrent bridges under one identity: `BridgeClientBase`'s own documentation states "one identity, many bridges", each tab holds its own client instance, and each bridge is its own Durable Object. Whole-session cross-tab exclusivity is therefore **not** a correctness requirement — and it would have a real cost: an idle, unclaimed sign-in QR in one tab must never block a contextual payment push in another.

What genuinely needs mutual exclusion is narrow:

- **Identity provisioning** — the first `initialize_client()` that mints crypto keys, and the first `create_bridge` that assigns/persists `clientPerId`. Two tabs racing here can mint divergent identities over the same storage. The lock must cover a final post-lock read through first successful identity assignment; a client must never retain a cached “no ID” observation after another tab provisions one.
- **Every paired-wallet map mutation** — `persistPairedWallet()` is a read-modify-write even during a trusted reconnection. Two tabs reconnecting different trusted wallets can otherwise each read the old map and lose one another's update.
- **The first-pairing window** — from wallet claim (`wallet_verification`) through `verify_pin` completion. This longer lease prevents competing PIN surfaces; the paired-wallet write itself still uses the short mutation lock above.
- **Destructive identity reset** — `reset_partner_identity` must run under an exclusive maintenance lease and only when no other live tab/session is using the identity.

The implementation policy is:

1. One process-wide SDK coordinator owns partner-client construction for a storage namespace/environment and guarantees exactly one partner client per JavaScript realm.
2. The injected `IMeteorConnectBridgeLeaseProvider`, named from the normalized storage namespace/environment, exposes separate identity-provision, paired-wallet-mutation, first-pairing-window, and maintenance operations plus a live-session registry. Locks are released immediately after their critical section; TTL and heartbeat permit recovery after a crashed tab.
3. For direct same-origin SDK consumers, the default provider uses the Web Locks API with `ifAvailable` when supported and falls back to the same adapter-backed ticket/fencing algorithm over the SDK's durable browser storage when it is unavailable. The Near Connect executor runs in a sandboxed `srcdoc` iframe with an opaque origin (`sandbox="allow-scripts"`), so iframe-local Web Locks, `BroadcastChannel`, and `storage` events cannot coordinate sibling dApp tabs reliably. Its provider must coordinate through `window.selector.storage`. Both storage implementations require unique contender keys, choosing/ticket state, deterministic ticket+owner ordering, polling, heartbeat/expiry for crashed contenders, and ownership/fencing revalidation before every identity or pairing mutation. Browser `storage` events may reduce latency but are never the correctness path. A simple read-then-write lease is insufficient because two tabs can both observe an empty key. Note the parent-side `storage.keys` handler returns keys still carrying the `${storageSpace}:` prefix — strip it before matching contender records.
4. Identity initialization re-reads all persisted identity/crypto state after acquiring its lease. If another tab provisioned identity while this tab waited, reconstruct the client from that state; otherwise retain the lease through durable first identity assignment.
5. Upstream `PartnerBridgeClient.persistPairedWallet()` invokes an injected `withPairedWalletMutationLock(fn)` around its fresh read plus write. This applies to first pairing and trusted reconnection; the SDK cannot safely wrap only the public method because persistence occurs internally.
6. Steady-state bridges are deliberately concurrent after the short locks exit, subject to the channel-isolation release gate below. Sign-in QRs and contextual pushes in separate tabs then proceed independently.
7. A tab that cannot acquire the identity or first-pairing-window lease shows a deterministic "Meteor Mobile is busy in another tab" state with automatic retry. Short trusted-reconnection map locks retry internally. The implementation must not depend on receiving a cross-tab event; polling/lease expiry is the correctness path.
8. Each live bridge registers a tab/session token with heartbeat. Comprehensive reset acquires the maintenance lease, refuses with retryable `other_tab_active` while another registration is live, increments the fencing generation, then clears identity state. A stale generation cannot perform a later identity or pairing write and must reinitialize.
9. Same-page `MeteorConnect` instances use the same coordinator/mutex and cannot bypass the lease.

Concurrent-tab support has a release gate: test two real `PartnerBridgeClient` instances sharing durable identity/backing storage while using different bridge IDs. Confirm that NiceCode create-channel and WebSocket-channel runtime state cannot collide. If the test exposes shared channel-key collisions, split storage before release: share only durable identity and paired-wallet records, and namespace ephemeral create/WebSocket channel state by tab instance ID. Do not claim or enable concurrent-tab support until this gate passes.

Cross-tab races on the storage adapters' `__usedKeys__` bookkeeping indexes can still drop clear-index entries. Comprehensive reset (8.4) therefore enumerates its namespaces upstream rather than trusting those indexes.

Making `PartnerBridgeStore` instance-scoped (8.5) remains recommended hygiene; the coordinator's one-client-per-realm guarantee is what actually prevents same-realm contamination either way.

## 6. Recommended user experience

### 6.1 Initial sign-in popup

The existing top-level heading and legacy buttons remain. The Meteor Mobile panel adapts to the device the dApp is being browsed on (use the existing `isMobile()` util in `action_ui/utils`).

Desktop browser:

```text
Choose your wallet
[Chrome Extension] [Web App] [Dev Web when applicable]

Meteor Mobile
[QR code]  [Open Meteor Mobile]   ← QR primary; deep-link button secondary

Don't have a wallet?
[Get Meteor Wallet]
```

Mobile-device browser (the dApp is on the same device as the wallet in the common case):

```text
Choose your wallet
[Web App] [other applicable legacy targets]

Meteor Mobile
[Open in App]  [QR ▣]   ← deep link primary; QR-icon button toggles the QR
                          for the case where this browsing device is not
                          the wallet device

Don't have a wallet?
[Get Meteor Wallet]
```

The exact existing callbacks remain:

- Chrome Extension → `actionController.executeAction("v1_ext")`
- Web App → `actionController.executeAction("v1_web")`
- Dev Web → `actionController.executeAction("v1_web_localhost")`

The mobile panel starts in a loading state immediately while partner initialization and bridge creation run.

### 6.1.1 Actions on a mobile-connected account

An action targeting an account whose stored connection is `v2_bridge_mobile` shows **only** the Meteor Mobile panel — no legacy buttons — mirroring how a v1 extension-connected account already goes straight to the extension today:

- push fires immediately to the account's stored wallet verify key;
- the panel simultaneously shows the fallback: QR on desktop, **Open in App** (with QR toggle) on a mobile device;
- push failure reasons (4.3) update the status line but never remove the fallback.

### 6.2 Mobile panel states

| State | Popup behavior |
| --- | --- |
| initializing | “Preparing Meteor Mobile…”; legacy buttons remain enabled |
| busy in another tab | another tab holds the identity-provisioning/pairing lease; show “Meteor Mobile is busy in another tab” with automatic retry (rare after first pairing); legacy buttons remain enabled |
| waiting for wallet (sign-in) | desktop: QR + secondary deep-link button; mobile device: **Open in App** + QR toggle |
| push delivered (mobile-connected account) | show “Sent to Meteor Mobile” plus the same QR/deep-link fallback |
| push not delivered | show a concise reason and the same QR/deep-link fallback |
| wallet verification | lock execution to mobile; show 4-digit PIN input and optionally retain QR |
| PIN incorrect (attempts remain) | show error with remaining-attempt count; keep session and QR |
| PIN attempts exceeded | terminal bridge failure; offer “Create a new mobile QR” (restarts pairing) |
| wallet action | show “Complete this request in Meteor Mobile” |
| reconnecting | keep current content and show a non-destructive connection warning |
| identity/attach failure (`identity_pin_mismatch`) | distinct terminal error explaining recovery (reset identity, re-pair); never an endless spinner |
| nearing expiry | countdown from server `expiresAt`; offer one-tap refresh without rotating the visible QR mid-scan |
| completed | resolve the SDK action and let the existing popup cleanup run |
| failed/expired before claim | keep legacy options; offer “Create a new mobile QR” |
| failed after mobile commitment | show the mobile error and reject the action |

Expiry is checked lazily by the backend (only when something touches the bridge), so the popup must render its own countdown from the absolute server-provided `expiresAt` rather than waiting for a dead QR scan. Development expiry behavior should be forced with configurable test time/state rather than waiting for the configured TTL.

### 6.3 Target commitment

The first committed execution path wins:

- Clicking a legacy button asks the backend to cancel the prepared mobile bridge before opening the legacy wallet.
- A wallet claim (`wallet_verification` or `wallet_action`) commits the action to mobile and disables/hides legacy execution controls for that action.
- If cancel loses a race because the wallet already claimed the bridge, mobile wins and the SDK must not launch web/extension.
- After commitment, the same action cannot be executed through another target.

This preserves the old button behavior until a mobile wallet actually claims the request while preventing double signing. Because sign-in never pushes (5.6), a claim during sign-in can only originate from a QR scan or deep-link tap — genuine user intent — so committing on claim is safe.

## 7. Proposed SDK architecture

### 7.1 Replace the unused v2 stub with a bridge client

Add a new target client under:

```text
packages/meteor-sdk-v1/src/MeteorConnect/target_clients/mobile_bridge/
  MeteorConnectMobileBridgeClient.ts
  MeteorConnectMobileBridgeClient.types.ts
  MobileBridgeSession.ts
  mobileBridgeStorage.ts
  nearActionToMobileBridge.ts
  mobileBridgeResultToSdk.ts
```

Recommended execution target ID:

```ts
"v2_bridge_mobile"
```

Do not reuse `v2_rid_mobile_deep_link` or `v2_rid_qr_code`. Those names describe the abandoned request-ID protocol, while the new implementation is one bridge target with push, QR, and deep-link delivery modes.

Add a connection config containing enough durable routing information for later push:

```ts
interface IMeteorConnection_V2_BridgeMobile
  extends IMeteorConnection_Base<"v2_bridge_mobile"> {
  schemaVersion: 1;
  bridgeEnvironmentId: string;
  meteorAppId: EMeteorAppId.meteor_wallet_mobile | EMeteorAppId.meteor_wallet_mobile_dev;
  partnerClientId: string;
  walletVerifyPublicKey: string;
}
```

`bridgeEnvironmentId` is a stable normalized/hash identifier for the configured backend origin, not a user-facing URL. `partnerClientId` binds the record to the crypto identity that established trust. `walletVerifyPublicKey` is an opaque routing handle, not an account key, and must never be presented as the NEAR account public key. All fields are mandatory on newly written records; older incomplete records are migration inputs that may use QR/re-pair but may not push.

Remove `MeteorConnectV2MessengerClient` from the active client map after all references and tests move to the bridge client. The old stub has no working behavior to preserve.

### 7.2 Configuration

Extend `MeteorConnect` configuration without breaking existing constructors:

```ts
interface IMeteorConnectMobileBridgeConfig {
  enabled?: boolean; // rollout default false until the 8.9 mobile/backend deployment gate; then eligible to default true
  backendUrl?: string; // default https://mc.meteorwallet.app
  meteorAppId?: EMeteorAppId.meteor_wallet_mobile | EMeteorAppId.meteor_wallet_mobile_dev;
  leaseProvider?: IMeteorConnectBridgeLeaseProvider; // advanced host integration; SDK default for direct browsers
  nativeAppOpener?: IMeteorConnectNativeAppOpener; // host integration; direct-browser default
  partnerMetadata?: {
    name?: string;
    description?: string;
    iconUrl?: string;
    originUrl?: string;
  };
}
```

The lease provider implements the named identity-provision, paired-wallet-mutation, first-pairing-window, and maintenance operations plus live-session registration from 5.8. A handle exposes a random owner/fencing token, `assertOwned()`, and idempotent `release()`. The direct-browser default uses Web Locks where possible and the storage-backed ticket fallback otherwise; the Near Connect executor injects the selector-storage ticket provider. Lease metadata is not persisted in account records and is not part of the wallet protocol. The native app opener implements 7.8.1; Near Connect injects its selector-host provider.

The shared NEAR key-store provider from 9.3 is injected through the existing `MeteorConnect`/client construction boundary rather than duplicated inside the mobile config. Direct consumers receive the v1-compatible browser default; NEAR Connect passes its selector-backed implementation.

Recommended defaults:

- production backend: `https://mc.meteorwallet.app`;
- production app ID unless `isDev` or an explicit config selects dev;
- origin: configured `originUrl`, otherwise `window.location.origin`;
- name: configured name, otherwise the origin hostname;
- bridge disabled during SSR or when required Web Crypto/WebSocket APIs are unavailable.

Do not rely on `frontend_env.METEOR_BRIDGE_BACKEND_URL` inside the distributable SDK. That helper expects build-time/global injection and can be `undefined` for third-party consumers.

Update `packages/meteor-near-connect/src/meteor-near-connect/nearConnectExecutor.ts` to pass the real dApp location from `window.selector.location` rather than identifying the sandboxed executor iframe as the partner origin. It must also inject the selector-backed key-store provider and selector-storage ticket lease provider required by 5.8/9.3; the latter may use `window.selector.storage.keys()` plus the known wallet storage namespace to enumerate contender records. If NEAR Connect later exposes dApp manifest name/icon metadata, pass it through as well.

### 7.3 Storage adaptation

`PartnerBridgeClient` requires `@nice-code/util`'s `StorageAdapter`. Add `@nice-code/util` as a direct SDK dependency at the same compatible version used by `@meteorwallet/connect`; do not rely on a transitive hoist.

Adapt the existing `ILocalStorageInterface` as string storage methods:

- `setItem`
- `getItem`
- `removeItem`

Cross-tab ticket coordination additionally needs prefix enumeration of unique contender/session records. Add a backward-compatible optional capability such as `getKeys(prefix?: string): Promise<string[]>`/`IEnumerableLocalStorageInterface`, and implement it in `webpage_local_storage` via indexed `localStorage.key(...)` enumeration and in the Near Connect adapter via `window.selector.storage.keys()`. Normalize/strip host prefixes before matching, as required by 5.8.

If Web Locks is unavailable and a custom direct-browser storage implementation has neither enumeration nor an injected `IMeteorConnectBridgeLeaseProvider`, fail mobile initialization with typed `mobile_bridge_coordination_unsupported`; never silently use an unsafe read-then-write lease or disable cross-tab protection. This extension is optional on the base storage interface so existing web/extension consumers remain source-compatible.

Use a prefix similar to:

```text
met_bridge_partner::<backend-environment>::
```

The backend portion must be normalized or hashed so dev and production never share `clientPerId`/crypto identity state by accident.

Route initialization through the process-wide coordinator from 5.8 and coalesce concurrent calls with the same configuration fingerprint. The fingerprint includes the original storage namespace, normalized backend/environment ID, app ID, and security-relevant partner identity configuration. `getMeteorConnect()` in the NEAR Connect executor currently calls `initialize` repeatedly, so an identical call is an idempotent no-op.

If an already initialized `MeteorConnect` or coordinator is called with a different fingerprint, reject with a typed `mobile_bridge_config_mismatch` error; never silently switch backend, storage, app ID, or identity underneath persisted accounts. Reconfiguration requires an explicit `disposeMobileBridge()`/equivalent after there is no active session, followed by a fresh initialize. Partner display metadata may be refreshed only through an explicitly supported metadata update that does not rotate crypto identity.

The SDK must document the storage scoping contract. In Near Connect, wallet storage is scoped by wallet manifest ID within the dApp's origin. Direct SDK callers must supply durable storage scoped to their own dApp/origin and coherently visible to same-origin tabs if they expect identity/pairing reuse across tabs; process-local/in-memory storage cannot provide that behavior. Sharing one backing namespace between unrelated partner identities is unsupported.

### 7.4 Mobile bridge session object

`MobileBridgeSession` should isolate the client store behind an SDK-local, action-specific state machine. If the recommended instance-scoped store (8.5) has landed, subscribe only to the store owned by the coordinator's client; otherwise the coordinator's one-client-per-realm guarantee means the global store *is* that client's store — still route all access through the session (with its token guard, below) rather than importing the store ad hoc.

Responsibilities:

- hold the expected SDK request and corresponding `act_impl_near` request;
- mint and retain one `partnerRequestId` plus the canonical prepared-action binding for idempotent create/push recovery (8.1.1); the connect client owns/reuses the partner secret because it currently generates that secret internally;
- subscribe to `PartnerBridgeStore` and unsubscribe deterministically;
- expose a read-only UI snapshot and change listener;
- create the bridge through QR or push;
- expose the finalized QR/deep link without logging its secret;
- submit the PIN, enforcing the SDK-side three-submission cap from 5.1, rendering the server attempt count when that surface exists and the capped local count otherwise;
- mark the session committed when the wallet claims;
- validate the completed Nice Action result and convert it to the existing SDK output type (section 10);
- run an expiry countdown from the server-provided absolute `expiresAt` value and offer the safe refresh flow defined below;
- support retry after pre-claim failure — always calling `disconnect_bridge()` **before** the replacement `create_bridge()` (the library documents that a leftover bridge connection can route the next bridge's traffic over the previous bridge's socket);
- cancel/abandon the backend bridge;
- disconnect the local bridge on teardown while retaining partner identity and pairings.

All network phases have explicit timeouts and share one session `AbortController` for local teardown. Aborting a wait never reclassifies an already-dispatched create, push, PIN, or cancel mutation as failed: an indeterminate mutation is reconciled by its idempotency key or authoritative bridge state before any retry or competing target is permitted. On full page unload, make no secret-bearing beacon and do not pretend synchronous cancellation is reliable; detach locally and rely on backend expiry/terminal state unless a normal asynchronous cancellation already completed.

Connection-state observation requires subclassing: because `PartnerBridgeStore` has no connection status (4.2), the SDK's client must extend `PartnerBridgeClient` and override the protected hooks —

- `onBridgeRealmStatus` / `onBridgeLinkEvent` → drive the "reconnecting" UI state;
- `onBridgeRealmAttachError` → surface attach failures; treat `identity_pin_mismatch` as terminal for the identity (parked redial ladder), presenting the user-confirmed comprehensive identity reset from 8.4 followed by re-pairing, instead of a spinner.

For the same-device mobile flow ("Open in App"), the browser tab is backgrounded while the user is in the wallet, and mobile browsers freeze/kill WebSockets in background tabs. On `visibilitychange` back to visible, the session must verify the bridge link and re-dial if needed (`connectBridgeLink()` is idempotent) so the result is not silently missed.

Only one active session is allowed per JavaScript realm — the existing singleton popup. Starting another action in the same realm must finish/cancel the old one first. Across tabs, sessions are concurrent after the 5.8 release gate; the coordinator serializes only the named short critical sections and it — rather than an individual `MeteorConnect` instance — enforces these invariants.

**Session token (the stale-event guard referenced throughout):** every `MobileBridgeSession` mints a unique token at creation, held by the coordinator as the current session. All store subscriptions, realm-hook callbacks, timers, and visibility handlers capture that token and are ignored/torn down when the coordinator's current token differs. This is the single mechanism behind "ignore late events from a superseded session" — no other staleness heuristic is used.

Suggested local phases:

```ts
type TMobileBridgePhase =
  | "initializing"
  | "busy_other_tab"
  | "creating_bridge"
  | "waiting_for_wallet"
  | "wallet_verification"
  | "wallet_action"
  | "completed"
  | "failed"
  | "cancelled";
```

Keep push delivery as orthogonal state (`not_attempted | delivered | not_delivered`) because it does not replace the bridge lifecycle.

Expiry is server-authoritative. Phase 0 adds `expiresAt` to the create response and `IPartnerBridgeInfo` (8.3). Store that absolute timestamp in the session, compute remaining time as `expiresAt - Date.now()`, and recompute on every render/visibility regain rather than decrementing a timer that can pause in a background tab. Never derive production behavior from hard-coded five-minute/one-day constants.

Do not silently rotate a visible QR while a camera may be scanning it. Only while the session is uncommitted in `waiting_for_wallet`, show a near-expiry countdown and explicit **Refresh mobile code** control. Once claim reaches `wallet_verification` or `wallet_action`, hide refresh and keep the claimed session. Safe pre-claim refresh is a state transition:

1. Request authenticated cancellation of the old bridge.
2. If cancellation succeeds, disconnect the old local link, create the replacement bridge, and then replace the displayed deep link/QR.
3. If cancellation reports an incompatible status because claim won, keep the old session, mark mobile committed, and do not create/display a replacement.
4. If cancellation is indeterminate, keep the old QR disabled with a retryable error; do not create a second live bridge for the same action.
5. After confirmed expiry, the same sequence may automatically prepare a replacement only when the target is still uncommitted and backend state proves the old bridge terminal and unexecutable.

### 7.5 Bridge preparation algorithm

For a mobile-eligible request:

1. Ensure `PartnerBridgeClient` is initialized.
2. Convert the expanded SDK action to one typed `act_impl_near` request JSON object.
3. Mint one high-entropy `partnerRequestId` for this session. Have `PartnerBridgeClient` create and retain the associated partner secret/signed salt binding so the identical secret is reused through unknown-outcome recovery (8.1.1); do not move raw-secret ownership into UI code.
4. Determine the configured app ID (`meteor_wallet_mobile` or dev).
5. Validate the targeted account's connection schema version, environment ID, app ID, and partner client ID against the active coordinator. Only on a complete match is its exact `walletVerifyPublicKey` a push target. Sign-in, incomplete/mismatched records, and non-mobile-contextual actions have no push target (5.6–5.7).
6. If there is a target, call `request_action_via_push` with that key, action request, `[configuredAppId]`, and the stable idempotency binding.
7. If there is no target, call `create_bridge` with the action request, `[configuredAppId]`, and the stable idempotency binding.
8. If dispatch has an indeterminate result, recover by retrying the identical operation with the same key/secret/binding; never mint a replacement session for that retry.
9. Read `bridge.info.walletLinks` from the session-owned store and select the entry matching the configured app ID.
10. Append `#partnerSecret=...` using `encodeURIComponent`.
11. Publish the same full deep link to both presentations — the QR renderer and the same-device **Open in App** button; `isMobile()` decides which is primary (6.1).
12. Start the server-authoritative expiry countdown from `bridge.info.expiresAt` (7.4).
13. Continue watching the store until completion, cancellation, expiry/failure, or UI teardown.

There is exactly one logical create/push and at most one notification per SDK action. Transport recovery may call the idempotent endpoint more than once, but only with the same `partnerRequestId`; a genuinely new key is used only after the prior bridge is proven terminal and non-executable.

### 7.6 Preparation timing

Recommended side-effect boundary:

- `createAction` remains a pure action-construction step.
- `promptForExecution` starts mobile preparation immediately before rendering the popup for actions with no contextual target.
- A contextual mobile account starts the bridge immediately through normal `execute("v2_bridge_mobile")`.
- A contextual web/extension account follows its current path and does not create a mobile bridge.

This meets the user-visible “immediate QR/push” requirement while avoiding live bridges for actions that a caller constructs but never requests from the user.

### 7.7 ExecutableAction coordination

Extend `ExecutableAction` with an explicit prepared-target lifecycle rather than starting a second independent `_execute` promise.

Required behavior:

- register one prepared mobile session;
- allow the UI to read it before target commitment;
- atomically commit a target;
- if a legacy target commits first, cancel the prepared mobile bridge, then run the existing `_execute` code unchanged;
- if the wallet claims first, commit mobile and call the mobile client's `makeRequest`, which awaits the already-prepared session rather than creating a second bridge;
- resolve/reject all existing `waitForExecutionOutput` listeners exactly once;
- preserve the existing idempotence of repeated `execute` calls;
- make cancellation terminal: today `cancelAction` only rejects registered listeners, and a later `execute()` would still run and broadcast — after cancel, `execute()` must refuse;
- invoke mobile teardown from `cancelAction` and popup cleanup;
- ignore late events from a superseded session.

Do not implement this as `Promise.race` between fully active mobile and legacy executions. A race resolves the caller but does not prevent the losing wallet from broadcasting a transaction.

Popup close is phase-dependent:

- before claim (`waiting_for_wallet`), close requests backend cancellation and does not resolve cleanup until cancellation has a terminal answer;
- during `wallet_verification`, close may cancel because the wallet has not entered action execution; both partner and wallet must receive the terminal cancellation state;
- during `wallet_action`, mobile is already committed and cancellation cannot guarantee that an on-chain broadcast has not begun. Closing the browser UI must not start a legacy target or report the request as cancelled. Show a confirmation that the request continues on the phone, then detach only the browser listener (never a non-dismissible popup — the user can close the tab regardless, so the design must tolerate detachment);
- after completion/failure/cancellation, close performs local teardown only.

`ExecutableAction.cancelAction()` must distinguish `cancelled_before_commit` from `target_already_committed`. The latter leaves the execution promise attached to the mobile session unless the caller explicitly abandons observation; it never authorizes a second target.

### 7.8 UI/controller integration

Add a focused Lit element:

```text
packages/meteor-sdk-v1/src/MeteorConnect/action_ui/lit_ui/meteor-mobile-bridge-panel.ts
```

It should receive the session through a property, subscribe on connect, unsubscribe on disconnect, and render only mobile-specific state.

Update `MeteorActionUiContainer` to:

- request preparation through `ActionUiController` as soon as the normal target chooser opens;
- keep the existing extension/web button markup and handlers intact;
- render `<meteor-mobile-bridge-panel>` below a **Meteor Mobile** label;
- adapt the panel to the browsing device (6.1): QR primary with a secondary deep-link button on desktop; **Open in App** primary with a QR-icon toggle on a mobile device;
- render only the mobile panel (no legacy buttons) for actions targeting a mobile-connected account (6.1.1);
- retain the panel instead of switching to the generic executing screen when mobile is committed, because first-time users still need PIN controls;
- keep the existing generic `meteor-action-ui-executing` behavior for v1 targets;
- add the mobile icon to `getIconSvgTextForTargetedPlatform` and `continue-action-screen`;
- clean up the existing `addExecutionStateListener` subscription, which is currently not retained on disconnect;
- remove or replace the hard-coded `meteorV2RequestIdTask` placeholder.

Popup layout needs internal scrolling and responsive bounds. The current overlay is fixed at `415 × 556` with `overflow: hidden`; a QR plus PIN/status content will otherwise clip. Preserve the legacy button styles, but change the content area to scroll inside a bounded modal such as:

- width: existing 415px maximum, responsive to viewport width;
- height: existing desktop target where possible, `max-height` based on viewport;
- fixed title bar;
- vertically scrollable content.

QR requirements:

- use the existing `qr-code-styling` dependency;
- update when the link changes;
- clear the prior SVG before appending;
- never put the partner secret in logs, analytics, errors, or visible copyable debug text;
- provide an accessible label and live status text;
- keep enough quiet-zone contrast for real camera scanning.

#### 7.8.1 Native-app opening contract — release blocker

The returned bridge link is a custom scheme (`meteorwallet://bridge_request?...` in production and `meteorwalletdev://bridge_request?...` in development). The SDK must not treat it as an ordinary web `window.open()` target. Near Connect's sandbox rewrites `window.open` through the host's web-opening path, while the host already exposes the distinct `window.selector.openNativeApp(url)` path for custom schemes.

Introduce an injected `IMeteorConnectNativeAppOpener` with one synchronous `open(fullLink)` operation:

- direct browser provider: invoke an anchor/location custom-scheme navigation from the original user click;
- Near Connect provider: call `window.selector.openNativeApp(fullLink)`;
- never `await`, schedule a task, or perform network work between the **Open in App** click and the provider call, because mobile browsers require transient user activation;
- pass the complete opaque link, including its fragment/secret, without parsing, re-encoding, logging, or copying it into an error;
- do not apply web-window `noopener`/`noreferrer` mechanics to the custom-scheme path; those remain required for legacy HTTP(S) windows only;
- treat an opener return value as “launch attempted,” not proof that an app opened. Keep the QR/status surface usable and allow explicit repeat attempts.

Add the exact allowed native targets to all three checked-in host/test surfaces:

- `near-connect/manifest.json`;
- `packages/meteor-sdk-v1-test-web/app/pages/near-connect/dev-manifest.ts`; and
- `packages/meteor-sdk-v1-test-web/public/manifest.json`.

The allowed targets are:

- `meteorwallet://bridge_request`
- `meteorwalletdev://bridge_request`

Verify the host's `allowsOpen` parser against these exact protocol/host/path values. Do not broaden the allowlist to arbitrary paths or schemes. Test the built package inside the real Near Connect sandbox as well as direct Android and iOS browsers; a jsdom click test is insufficient for this release gate.

PIN requirements:

- 4-digit numeric input without coercing away leading zeroes;
- explicit submit button rather than verifying on each keystroke;
- disabled state while verification is running;
- wrong-PIN errors shown with the remaining-attempt count (server-authoritative when that surface exists, otherwise the SDK's capped local count — 5.1), without discarding the QR/session;
- a terminal attempts-exceeded state after the third incorrect submission (see 5.1) that offers a new QR instead of further submits; the SDK never sends a fourth submission;
- no PIN logging.

Expiry/refresh requirements:

- visible countdown computed from server `expiresAt`;
- explicit one-tap refresh before expiry so a visible QR never rotates mid-scan;
- cancel-old-first refresh ordering from 7.4, creating a replacement only after terminal cancellation/expiry proves the old bridge cannot execute.

### 7.9 Partner metadata in the popup/backend

The mobile wallet uses the partner metadata to tell the user which dApp is asking for an action. The SDK must send meaningful data and avoid the executor iframe's origin.

Validation rules:

- normalize `originUrl` to its URL origin;
- encode it as `${EPartnerOrigin.web_url}::<origin>`;
- use hostname only as a fallback display name;
- reject malformed configured URLs early;
- permit optional description/icon URL but do not fetch or transform the icon in the SDK.

## 8. Required upstream bridge additions

These changes belong in `mc_backend` and must be published/deployed before the safe eager SDK flow ships.

### 8.1 Partner cancellation action — release blocker

Add a partner-authenticated action such as `cancel_bridge`/`abandon_bridge` to:

- `packages/meteor-connect-shared/src/nice_action/actions/act_pairing_api.ts`
- the relevant pairing schemas;
- `packages/meteor-connect-backend/src/durable_object/bridge/pairing/PairingBridgeDO.ts`
- `packages/meteor-connect-client/src/clients/partner/act_partner_bridge_client.ts`
- `PartnerBridgeClient`

Semantics:

- accepted only from the bridge's authenticated partner;
- atomically transitions the bridge out of a claimable/executable state;
- produces a terminal realm update for partner and wallet;
- idempotent if already cancelled;
- does not delete the durable partner↔wallet pairing or push token.

Required status contract:

| Current bridge state | Cancellation result | SDK consequence |
| --- | --- | --- |
| `waiting_for_wallet` | atomically transition to `cancelled` | legacy target/close may continue after observing success |
| `wallet_verification` | atomically transition to `cancelled`; wallet must leave PIN flow | popup close may finish; a legacy target is not offered after claim |
| `wallet_action` | `incompatible_status` / mobile committed | keep/reattach to mobile execution; never start legacy |
| `completed` | return completed terminal result idempotently | consume existing result |
| `failed` | return failed terminal result idempotently | surface existing failure |
| `cancelled` | return cancelled terminal result idempotently | cleanup may finish |

Cancel-versus-claim and cancel-versus-complete are resolved by one Durable Object transaction/state check. A partner must never infer the winner from WebSocket event ordering. Cancellation success is the authorization for legacy execution; a timeout, transport error, or unknown response is not success and must not start another target.

Add backend race tests for cancel-versus-claim, cancel-versus-PIN verification, cancel-versus-wallet-action entry, and cancel-versus-complete.

#### 8.1.1 Idempotent bridge preparation and push — release blocker

Eager preparation is unsafe unless an ambiguous network outcome can be recovered without creating a second executable action. For example, the backend may create a bridge and send a push while the response is lost; retrying with a new bridge would produce two valid prompts/actions, and the SDK could not safely authorize a legacy target because it does not yet know which bridge to cancel.

Add a high-entropy, client-generated `partnerRequestId` (idempotency key) to create/request-via-push input. Its contract is:

- scoped to the authenticated partner and retained through the bridge TTL/terminal-retention window;
- bound to a canonical action hash, network/app environment, target wallet handle when present, and the partner-secret commitment;
- a retry with the same key and identical binding returns the same bridge ID, link material, `expiresAt`, current terminal result/state, and original push outcome;
- reuse with conflicting binding returns an explicit `idempotency_conflict` and never mutates or pushes;
- `request_action_via_push` records push intent/outcome atomically enough that retrying the same key never sends a second notification;
- refreshing after confirmed cancellation/expiry creates a new session generation and a new idempotency key.

Define the binding schema and hash in `connect-shared` with an explicit version/domain separator and canonical serialization; do not compare ad hoc `JSON.stringify` output whose object-key or app-ID ordering may differ. At minimum bind the validated Nice Action request, normalized/sorted app IDs, required wallet protocol/capabilities, target wallet verify key (or explicit no-target), partner verify/exchange identity, salt hash, and relevant connection info. The same canonical helper is used by client and backend, with conflict tests for each bound field.

The idempotency decision must occur before the current `action_api.ts` path calls `DO_PAIRING_BRIDGE.newUniqueId()`. Prefer routing to a deterministic pairing DO derived from a domain-separated hash of authenticated partner verify key plus `partnerRequestId`, or use an equally atomic idempotency-index DO; do not use a race-prone KV read-then-write mapping. On a repeated `create_bridge`, that DO verifies the stored canonical binding and reconstructs the same response rather than returning `bridge_already_exists`.

`MobileBridgeSession` creates the key once and reuses the same prepared action for every retry/recovery call. `PartnerBridgeClient` must retain/reuse the key's internally generated partner secret, salt hash/signature, and create inputs rather than generating the current fresh `nanoid(32)` on each retry. The raw secret remains client-owned and is returned to the SDK only through the normal successful create result. Persisting this pending retry context across a full page reload is not required; if the page unloads after an unknown mutation, the abandoned bridge expires and the SDK must not send a competing action during that vanished page lifetime.

On timeout or disconnect after dispatch, the outcome is `unknown`, not failed: recover with the same key, then attach or cancel the recovered bridge. A request to choose a legacy target during an unknown create outcome waits for recovery and terminal cancellation; it must never start legacy immediately. Make `notify_wallet` idempotent for the same bridge/wallet as well—the composite client method alone cannot guarantee one notification when its response is lost after the notify call.

Add backend/client tests that deliberately drop the response (a) after bridge creation and (b) after push send. A retry must return the same bridge and produce exactly one notification and one executable action. Also test conflicting-key reuse, concurrent identical retries, and retry after a terminal result.

### 8.2 Expose the active paired-wallet handle and serialize its persistence — release blocker

After `initializePartnerVerified`, expose the exact current `TPartnerPairedWallet` through a safe getter or the partner store/session state. This lets the SDK store the correct `walletVerifyPublicKey` on the returned mobile account connection.

The exposed record must be tied to the current authenticated bridge/claim and include the verify key, Meteor app ID, and any exchange-key data already present in `TPartnerPairedWallet`. Do not expose `walletPerId`; the verify key remains the intended partner-facing routing handle. The SDK must not choose from `get_paired_wallets()` by recency or array order.

Also inject a `withPairedWalletMutationLock(fn)` hook (or an equivalent truly atomic storage primitive) into `PartnerBridgeClient`, and execute every `persistPairedWallet()` fresh read plus write inside it. This includes trusted reconnections as well as newly PIN-verified wallets. The SDK provides the direct-browser or selector-storage implementation described in 5.8. Test two concurrent trusted reconnections for different wallet keys and prove both records survive.

### 8.3 Expose absolute bridge expiry — release blocker

The backend state already has an absolute `expiresAt`, but the create response and `IPartnerBridgeInfo` omit it. Add `expiresAt` to:

- `vPairing_Create_Output` and generated/inferred types;
- `PartnerBridgeClient.create_bridge` / `request_action_via_push` results;
- `IPartnerBridgeInfo` and every relevant store variant; and
- mocked/demo clients and tests.

The server timestamp is authoritative. Test production/dev TTL configuration without baking those durations into SDK control flow. A recreated bridge must receive a new `expiresAt`; an old session token must not be allowed to update the new countdown.

### 8.4 Comprehensive partner-identity reset — release blocker

Add a partner-specific reset API such as `reset_partner_identity()` that clears every identity-bound namespace, not only the base adapter index:

- base client identity and crypto material;
- bridge/create-channel identity state;
- separately prefixed `paired_wallets::` records;
- current bridge/session bindings and redial state; and
- instance store state.

The operation must require no active executable bridge (cancel first where possible), be serialized against initialization, and leave the client ready to provision one clean replacement identity. Test that no stale paired wallet can be returned or pushed after reset.

The SDK exposes this only from the explicit `identity_pin_mismatch` recovery UI with confirmation that mobile pairings for this dApp/environment will be reset. It must invalidate the old `partnerClientId` binding in stored mobile connection records. Those accounts may remain visible, but they are QR/re-pair-only until a successful action refreshes their connection record under the new identity.

### 8.5 Instance-scoped partner store — strongly recommended, not blocking

The store is realm-scoped and the SDK coordinator guarantees exactly one partner client per realm (5.8), so same-realm contamination cannot occur in the shipped SDK without this refactor. It remains the right upstream shape and should ride the Phase 0 release if convenient, but it must not gate it.

Refactor `PartnerBridgeClient` so each client owns or receives a `Store<IPartnerBridgeStore>` instance. Export a factory/default state if useful, but do not force every client to publish to the module-global `PartnerBridgeStore`. Preserve a deprecated global export only if existing demos need a migration window.

All internal client updates must target `this.store`; callers must be able to subscribe to the exact store associated with the client. Add a test with two clients in one JavaScript realm proving that bridge creation, realm patches, completion, reset, and disconnect on one client do not alter the other store.

### 8.6 Correct and persist PIN attempts — core semantics release-blocking; attempts surface recommended

Update `PairingBridgeDO.verify_pin` to implement the 5.1 core semantics (**release blocking**):

- exactly three submitted attempts;
- correct PIN on the third attempt succeeds;
- third incorrect PIN fails terminally;
- every attempt is persisted before returning; and
- replay/reconnect/DO eviction cannot restore attempts.

Exposing authoritative `attemptsUsed`/`attemptsRemaining` through the response and realm/store state is **recommended, not blocking** — it touches shared schemas and client state types, and the SDK operates without it via its own three-submission cap plus the terminal `failed` step (5.1).

Include unit and Durable Object lifecycle tests, including eviction/rehydration between each wrong submission and concurrent duplicate submissions.

### 8.7 Make account-targeted NEAR actions account-explicit — release blocker

The SDK cannot safely claim account-specific routing when the wallet request omits the target account. Current shared inputs make `signerId` optional on several signing actions, omit it from `verify_owner`, and give `sign_out` only a network while returning `null`. That permits the wallet to act on whichever account is locally selected and makes sign-out impossible to validate.

Update the shared action contracts and production wallet/demo resolvers so:

- `sign_message`, `sign_transactions`, and `sign_delegate_actions` always receive the SDK target account as required `signerId` for bridge-originated requests;
- `verify_owner` receives a required target `signerId`/`accountId` and the wallet verifies that exact account;
- `sign_out` receives a required target account and returns the account ID it actually signed out, rather than `null`; the SDK validates it and then preserves the existing public SDK return shape;
- the wallet returns a typed `account_unavailable`/mismatch error instead of silently substituting its currently selected account; and
- `sign_in_and_sign_message` returns internally consistent pairs: each `NearAccount.accountId` must equal its associated `signedMessage.accountId`.

If the shared package must retain optional fields for non-bridge compatibility, enforce their presence at the partner converter boundary and in the mobile resolver for this protocol version. Add schema, hydration, wallet resolver, and mismatch tests before publishing.

#### 8.7.1 Wallet protocol/capability handshake — release blocker

A store rollout does not mean every installed wallet has updated. An older build could accept an account-targeted action yet ignore the new target field, broadcast from its selected account, and only then have the SDK reject the wrong-account result. Result validation is necessary but cannot undo that broadcast.

Add a versioned, authenticated capability gate before wallet commitment:

- create input declares a stable `requiredWalletProtocolVersion` and/or explicit required capability IDs; include these in the canonical idempotency binding;
- generated wallet links carry the required version as non-secret routing metadata so a compatible app can show update guidance early;
- wallet claim sends its supported protocol version/capabilities as signed claim data; do not infer compatibility from app ID or user agent;
- backend validates compatibility before transitioning out of claimable state or exposing the action for execution, and returns a typed `wallet_update_required`/`wallet_capability_missing` terminal result to both sides;
- authenticated paired-wallet records persist the compatible version/capabilities. Push is attempted only for a record satisfying this bridge's requirements; legacy records with no capability proof are QR/re-pair-only;
- the browser does not mark mobile committed for a rejected incompatible claim. It shows update-app guidance and may offer legacy targets only after backend cancellation/terminal state proves the bridge non-executable;
- the production wallet and Expo demo both implement and test the final handshake.

Define version compatibility in shared code (not string comparison in the SDK), document its evolution rules, and test downgrade/upgrade, missing capability, forged/unsigned capability, stale paired record, and compatible push paths.

### 8.8 Optional upstream improvements — nice to have, not blocking

- **Connection status in the instance store.** Mirroring link/realm status (connecting, reconnecting, attach-failed with reason) into the client-owned store would let partners render reconnect UX without subclassing `PartnerBridgeClient` for protected hooks (4.2, 7.4).
- **Wallet-side pushed-claim confirmation.** The production wallet should require a user tap before acting on a pushed request. With push restricted to mobile-connected accounts (5.6) this is no longer load-bearing for SDK correctness, but remains the right wallet behavior.

No new result-hydration helper is required: the installed Nice Action domain already exposes `hydrateResultPayload(...)` and the SDK will use it directly (section 10).

### 8.9 Version and deployment order

0. Refresh and verify `mc_backend`'s installed dependencies first. The current checkout exposes `hydrateResultPayload`, but a same-version stale `@nice-code/action` build was observed previously; verify package contents and lockfile integrity so upstream work cannot compile against the wrong API surface.
1. Implement and test the release blockers in `mc_backend`: cancellation and idempotent preparation/push (8.1), active-wallet exposure plus atomic paired-wallet persistence (8.2), `expiresAt` (8.3), comprehensive reset (8.4), PIN-attempt core semantics (8.6), account-explicit actions, and the pre-commit wallet capability gate (8.7). The instance-scoped store (8.5), attempts-remaining surface (8.6), and 8.8 improvements are recommended riders, not gates.
2. Deploy the compatible backend and a production mobile-wallet build that supports the final action schemas, custom schemes, cancellation states, and idempotent retry behavior. Complete mobile-store rollout before enabling the SDK path by default; until then keep the SDK rollout flag off.
3. Publish new `@meteorwallet/connect-shared` and `@meteorwallet/connect` versions as a maintainer-run release.
4. Update the SDK dependency range to the first versions containing all release blockers.
5. Implement and validate the SDK against those exact APIs; do not carry temporary private patches into the published SDK.
6. Validate the built SDK and published Near Connect manifest against production/staging, then enable the rollout flag progressively. Document the minimum compatible Meteor Mobile version and the update-app recovery message for an unclaimed/unsupported link.

If cancellation is intentionally deferred, eager push/QR and simultaneously active legacy buttons must not ship for transaction-capable actions. The only safe fallback would be to create the bridge after the user explicitly selects Meteor Mobile, which does not satisfy the requested immediate behavior.

## 9. NEAR request conversion design

Create one exhaustive converter from `TMCActionRequestUnionExpandedInput<TMCActionRegistry>` to a typed `act_impl_near` request. Keep it independent of the UI and bridge transport.

| SDK action | Shared action | Conversion |
| --- | --- | --- |
| `near::sign_in` | `sign_in` | `target.network`; normalized function-call key |
| `near::sign_in_and_sign_message` | `sign_in_and_sign_message` | sign-in fields; nonce bytes → base64; omit local-only callback; retain state locally |
| `near::sign_out` | `sign_out` | required target account ID and network; identifier retained locally for SDK output/removal |
| `near::sign_message` | `sign_message` | message/recipient; nonce bytes → base64; account ID → signer ID; network; retain `state` locally |
| `near::sign_transactions` | one item → `sign_and_send_transaction`; multiple → `sign_and_send_transactions` | required target signer ID/network plus JSON connector actions; reject an empty array |
| `near::sign_delegate_actions` | `sign_delegate_actions` | signer ID, network, delegate receiver/actions |
| `near::verify_owner` | `verify_owner` | required target signer/account ID, account network, and message |

Use `act_impl_near.action.<id>.request(...).toJsonObject()` for final serialization. Do not hand-construct the Nice Action envelope.

Preserve action cardinality without an external wallet-UX decision: reject zero transactions before bridge creation; map exactly one to `sign_and_send_transaction`; map two or more to `sign_and_send_transactions`. Normalize the singular success to a one-element `FinalExecutionOutcome[]` so the public SDK output remains unchanged. The production wallet must support both shared actions under the capability gate in 8.7.1.

### 9.1 Nonce conversion

Use `@scure/base`'s base64 codec, already present in the SDK, for deterministic browser-safe conversion. Do not depend on `Buffer` or `btoa(String.fromCharCode(...largeArray))` in library code.

### 9.2 NEAR action conversion

Factor and complete a converter from `@near-js/transactions` `Action` instances to connector `{ type, params }` values.

The existing `nearActionToSdkV1Action` is a useful starting point, but it currently leaves some action variants commented out or unsupported. Tests must cover every action variant the SDK publicly accepts, including at least:

- CreateAccount
- DeployContract
- FunctionCall, including JSON and byte/base64 args
- Transfer
- Stake
- AddKey (full access and function-call access)
- DeleteKey
- DeleteAccount

If the main mobile wallet does not support an action type, fail before bridge creation with a precise unsupported-action error rather than sending a request the wallet cannot resolve.

### 9.3 Function-call access key generation

`act_impl_near` requires `addFunctionCallKey.publicKey`, while the SDK deliberately permits it to be omitted and currently generates a key inside the v1 path.

For mobile:

1. Normalize deprecated `contract` input to `addFunctionCallKey` exactly as v1 does.
2. If `publicKey` is absent, generate an Ed25519 key pair before creating the Nice Action.
3. Send only the public key to the wallet.
4. Keep the private key local in the action session.
5. After a successful sign-in, persist it to the same browser key store used by the SDK for that network/account.
6. Add the public key and function-call-key metadata to the resulting `IMeteorConnectAccount.publicKeys`.
7. Delete/forget the pending key if the request is cancelled or rejected.

This must be covered by a test proving that no private key enters the bridge request or QR/deep link.

Key-store ownership must be explicit. The current v1 client privately constructs `BrowserLocalStorageKeyStore(window.localStorage, "_meteor_wallet")`; the mobile client cannot reach it safely. Extract a shared `MeteorConnectNearKeyStoreProvider`/factory owned by `MeteorConnect` and inject it into both v1 and mobile clients. The default direct-browser implementation must preserve the exact existing `_meteor_wallet` prefix and network/account key format so v1 behavior has no data migration. NEAR Connect may inject its selector-backed key store through the same interface.

Required provider operations are at least `getKey`, `setKey`, and `removeKey` by network/account, plus a testable failure surface. Do not create a second key-store namespace for mobile. The refactor must be behavior-neutral for web/extension and covered by regression tests against pre-existing stored keys.

If the wallet successfully adds the function-call key but local private-key persistence fails, the chain-side operation cannot be rolled back. Reject with a specific `local_key_persistence_failed` partial-success error, do not store a connection record that claims the local key is usable, retain no private key in logs/errors, and tell the caller that sign-in/key setup must be retried or the orphaned key revoked. Do not silently return a successful account with unusable function-call-key metadata.

## 10. NEAR result conversion design

On `EPartnerBridgeStep.completed`, `bridge.actionResult.result` holds an `IActionPayload_Result_JsonObject`. The installed Nice Action `ActionDomain` exposes `hydrateResultPayload(...)`; use it instead of manually deserializing output or reconstructing wire errors:

1. Require `signatureVerified === true`. Treat a missing/invalid wallet signature as a security error, not a warning.
2. Confirm the payload shape with the `isActionPayload_Result_JsonObject` guard from `@nice-code/action`.
3. Verify the payload's domain/action ID matches the request the converter produced.
4. Call `act_impl_near.hydrateResultPayload(...)`. This validates/deserializes the schema output, re-derives expected-error classification, and reconstructs a live Nice Error.
5. Compare the hydrated payload's recomputed `outputHash` with the signed serialized `outputHash`; reject a mismatch as a security/integrity error. The current hydrator recomputes but does not itself compare the wire value.
6. If the hydrated result is not `ok`, reject with its hydrated Nice Error while preserving the SDK's established error boundary.
7. For account-targeted actions, validate the result's account identity against the requested account (10.4); reject a mismatch and do not refresh the routing record.
8. Convert the hydrated typed success output as follows.

Scope of the `outputHash` comparison: it applies **only** to the wallet's E2E-decrypted result JSON — the library's compact wire codec legitimately emits empty hashes on other transport paths, so the check must not be generalized to other payload sources. For `ok:false` results the hash covers the error message rather than an output; tests must cover both the success and error branches.

| Shared result | Existing SDK result |
| --- | --- |
| `NearAccount[]` | one `IMeteorConnectAccount` with mobile connection config |
| accounts + signed messages | one `IMeteorConnectAccount & { signedMessage }` |
| signed-out account ID | validate it, then return the original target `IMeteorConnectAccountIdentifier` |
| signed message strings | `PublicKey`, decoded signature bytes, and locally retained `state` |
| single transaction outcome | one-element `FinalExecutionOutcome[]` |
| transaction outcome array | `FinalExecutionOutcome[]` |
| `signedDelegateActions: string[]` | decoded `SignedDelegate` objects plus canonical delegate hashes |
| verify-owner object | existing `IODappAction_VerifyOwner_Output` |

### 10.1 Sign-in account result

The current `MeteorConnect` model stores one account per sign-in action even though the shared result is an array. Require at least one account and select the first until the public SDK account model is redesigned for multi-account sign-in.

`vNearAccount.publicKey` is optional on the wire, while `IMeteorConnectAccount.publicKeys` is required. When the wallet returns no public key: store an empty `publicKeys` array plus any locally generated function-call key (9.3); never fabricate a key. Add a conversion test for this case and confirm downstream callers tolerate an empty array.

For `sign_in_and_sign_message`, validate every returned entry before selecting the SDK's first account: `NearAccount.accountId` must exactly equal its associated signed-message `accountId`. Reject an internally inconsistent response and write no account/connection record.

The stored connection must be `v2_bridge_mobile` and include all required routing fields from 5.7: schema version, active environment ID, configured app ID, current partner client ID, and exact active paired-wallet verify key. If the active wallet record is unavailable, treat completion as an integration error rather than writing a partially routable mobile connection.

### 10.2 Signed messages

Convert:

- public key string → `PublicKey.fromString(...)`;
- base64 signature → `Uint8Array`;
- request-local `state` → returned state.

`callbackUrl` and `state` are not sent to the wallet in the shared schema. Preserve only the state locally for compatibility; do not ask the mobile wallet to navigate a callback URL.

### 10.3 Delegate actions

Decode each base64 string as `SCHEMA.SignedDelegate`, reconstruct the `SignedDelegate`, and derive `delegateHash` from the canonical encoded delegate action using the same SHA-256 process as `@near-js/signers`.

Do not invent an empty hash or change `IORequestSignDelegateActions_Output`; the NEAR Connect executor currently relies on the existing `signedDelegatesWithHashes` shape before reserializing the signed delegates for newer NEAR Connect versions.

### 10.4 Account-identity validation for account-targeted results

The wallet-identity signature proves **which paired wallet** answered — not **which NEAR account** it used. Two realistic paths return a result from the wrong account: a mismatched/legacy routing record falls back to QR under 5.7 and *any* wallet/device can scan that QR, completing the action with whatever account the user picks on the phone; and even on the push path a buggy wallet can answer with a different account than the requested `signerId`. Without this check the SDK would resolve the dApp's promise for account X with a result produced by account Y — and 5.7 would then "refresh" account X's routing record from the wrong wallet session.

For every action with `executionTargetSource: "targeted_account"`, verify the hydrated success output against `request.target.accountId`:

| Action | Field checked |
| --- | --- |
| `sign_message` | direct success output `accountId` |
| `verify_owner` | output `accountId` |
| `sign_and_send_transaction(s)` | string `transaction.signer_id` of the singular/every plural execution outcome; missing/malformed transaction data is also rejection |
| `sign_delegate_actions` | `senderId` of every decoded `SignedDelegate` delegate action |
| `sign_out` | returned signed-out account ID |

A missing/malformed identity field or mismatch rejects the SDK action with a distinct integration error, is logged without secrets, and must never refresh/remove the account's connection record. Compare validated NEAR account IDs exactly; do not case-fold them. Sign-in is exempt because returned accounts define new records. Sign-in-and-sign-message accepts any returned account but is still subject to the internal pair-consistency check in 10.1.

## 11. File-level implementation plan

### Phase 0 — upstream safety and identity support

Release blockers:

- [x] Refresh/verify `mc_backend`'s installed dependencies before starting — the current checkout exposes `hydrateResultPayload`, but a stale same-version build was observed previously (8.9 step 0).
- [x] Add the partner cancel/abandon action to shared schemas/domain.
- [x] Implement the authenticated backend cancellation state table and atomic race semantics from 8.1.
- [x] Add `PartnerBridgeClient.cancel_bridge`.
- [x] Add `partnerRequestId` idempotency to create/push, including same-bridge recovery and at-most-once push dispatch with durable outcome recovery (8.1.1).
- [x] Expose the active paired-wallet verify-key handle after claim and inject atomic paired-wallet persistence around every trusted/new-wallet map update (8.2).
- [x] Add server `expiresAt` to bridge-create output and all partner client/store states.
- [x] Add `reset_partner_identity()` that clears every identity-bound namespace, including paired wallets, without relying on `__usedKeys__` indexes (5.8, 8.4).
- [x] Correct PIN attempt core semantics: exactly three, persisted before returning, correct third succeeds, third incorrect terminal (8.6).
- [x] Make bridge account-targeted NEAR actions account-explicit, return a verifiable account from sign-out, and add the signed pre-commit wallet protocol/capability handshake (8.7); update the demo resolvers. Production-wallet deployment remains part of the rollout gate.
- [x] Add unit/integration/race tests in `mc_backend`.
- [ ] Deploy the compatible backend and mobile wallet, then publish compatible package versions through the maintainer release process and satisfy the rollout gate in 8.9.

Recommended riders (do not gate the release — 8.5, 8.6, 8.8):

- [ ] Instance-scoped, client-owned partner store.
- [ ] Authoritative `attemptsUsed`/`attemptsRemaining` surface.
- [ ] Connection status mirrored into the store; wallet-side pushed-claim confirmation.

### Phase 1 — SDK dependencies and configuration

- [x] Update `packages/meteor-sdk-v1/package.json` to the compatible connect package versions.
- [x] Add direct `@nice-code/util` dependency.
- [x] Add the mobile bridge config types and production constants.
- [x] Add the required wallet protocol/capability constant from shared code; include it in create/idempotency binding and never reimplement compatibility comparison locally.
- [x] Add partner metadata normalization.
- [x] Add storage adaptation with environment-specific prefixing.
- [x] Add optional prefix key enumeration to the storage capability and implement it for webpage localStorage and selector storage; require an injected lease provider when Web Locks and enumeration are both unavailable (5.8, 7.3).
- [x] Add the process-wide coordinator, live-session registry, and named identity/pairing-map/first-pairing/reset lease operations (5.8): Web Locks plus storage-backed fallback for direct same-origin use, and selector-storage ticket/fencing for the opaque-origin Near Connect executor.
- [ ] Pass the 5.8 concurrent-channel isolation gate with two real partner clients, or split durable shared storage from tab-namespaced ephemeral channel storage before enabling concurrency.
- [x] Make `MeteorConnect.initialize` fingerprinted/idempotent/coalesced and reject incompatible reconfiguration.
- [x] Add explicit bridge disposal/reinitialization behavior.
- [x] Extract/inject the shared NEAR key-store provider while preserving the v1 storage format.
- [x] Add/inject the synchronous native-app opener and exact production/dev custom-scheme manifest allowlist (7.8.1).
- [x] Add the `openNativeApp` selector typing/guard; fail as mobile-unavailable when an older host does not expose it, while leaving QR and legacy buttons usable.
- [x] Pass actual dApp origin metadata from `meteor-near-connect`.

### Phase 2 — typed request/result adapters

- [x] Add exhaustive SDK request → `act_impl_near` conversion, including zero-transaction rejection and the singular-one/plural-many split from section 9.
- [x] Add nonce/base64 helpers.
- [x] Complete connector-action conversion and unsupported-action errors.
- [x] Add function-call-key generation/persistence lifecycle.
- [x] Add result validation via shape/domain/action checks, `act_impl_near.hydrateResultPayload(...)`, signed `outputHash` comparison, and hydrated Nice Error handling (section 10).
- [x] Always send the requested account in account-targeted actions and add strict account-identity validation for their results (8.7, 10.4).
- [x] Validate sign-in-and-sign-message account/message pair consistency (10.1).
- [x] Add SDK result conversion for all actions, including missing-`publicKey` sign-in accounts (10.1).
- [x] Add conversion unit tests before transport integration.

### Phase 3 — partner bridge client

- [x] Add `MeteorConnectMobileBridgeClient` and `v2_bridge_mobile` types.
- [ ] Construct/initialize the coordinator-owned durable `PartnerBridgeClient` subclass with its instance store and protected connection hooks (7.3–7.4).
- [x] Implement connection-record schema version/environment/app/partner-ID validation and exact-wallet push targeting (5.5–5.7); no sign-in push.
- [x] Require authenticated compatible-wallet capability before push or mobile commitment; legacy/missing capability records fall back to QR/re-pair and incompatible claims surface update guidance (8.7.1).
- [x] Implement QR/deep-link creation path.
- [x] Implement push path for mobile-connected accounts with QR/deep-link fallback.
- [x] Implement one-key idempotent create/push and unknown-outcome recovery; retrying transport must never create a second logical bridge or push (8.1.1).
- [x] Append the partner-secret fragment safely.
- [x] Implement `MobileBridgeSession`, its session-token stale-event guard (7.4), store subscription, and coordinated ownership.
- [x] Add per-operation timeouts and one session `AbortController`; reconcile dispatched mutations from authoritative/idempotent state rather than treating local abort as remote failure (7.4).
- [x] Implement PIN submission with the three-submission cap, terminal-on-third-wrong behavior, and reconciliation to the server attempt surface when present (5.1).
- [x] Implement server-`expiresAt` countdown and the cancel-old-first explicit refresh flow (7.4).
- [x] Implement completion/result conversion.
- [x] Implement retry (`disconnect_bridge()` before replacement `create_bridge()`), cancel, disconnect, and stale-event guards.
- [x] Implement `identity_pin_mismatch` detection, confirmation, comprehensive reset, stale partner-binding invalidation by identity generation, and re-pair recovery (7.4, 8.4).
- [x] Register live tab/session heartbeats, fence stale writers, and refuse comprehensive reset while another tab is active (5.8).
- [x] Implement visibility-regain link verification for the same-device mobile flow (7.4).
- [x] Store every mandatory mobile routing field, including the exact active wallet handle, on sign-in results and refresh a mismatched targeted account after successful authenticated non-sign-out completion.

### Phase 4 — action arbitration

- [x] Add prepared-target state to `ExecutableAction`.
- [x] Start mobile preparation at popup request time for sign-in actions (QR/deep-link bridge only — never push).
- [x] Reuse the prepared bridge when mobile commits.
- [x] Cancel mobile before starting v1 web/extension.
- [x] Treat cancel/claim conflicts deterministically.
- [x] Make cancellation terminal — after `cancelAction`, `execute()` must refuse to run (7.7).
- [x] Ensure resolve/reject/account bookkeeping runs once.
- [x] Implement the phase-dependent popup close/cancel contract, including “continues on phone” after `wallet_action` commitment.
- [x] Keep contextual v1 account execution unchanged.

### Phase 5 — popup UI

- [x] Add `meteor-mobile-bridge-panel`.
- [x] Render it under the **Meteor Mobile** heading.
- [x] Implement device-adaptive presentation via `isMobile()` — QR primary on desktop; **Open in App** primary with QR-icon toggle on mobile devices (6.1).
- [x] Route **Open in App** synchronously through the direct-browser or Near Connect native opener; never through ordinary sandbox `window.open` (7.8.1).
- [x] Render only the mobile panel for actions targeting mobile-connected accounts (6.1.1).
- [x] Retain the exact current extension/web button handlers and URLs.
- [x] Render loading, other-tab ownership, QR, deep-link, push status, wallet-update-required, PIN attempts, action, expiry countdown/refresh, reconnect, identity-reset confirmation, error, and retry states.
- [x] Keep mobile UI visible after target commitment.
- [x] Add mobile icons to executing/continue screens.
- [x] Replace the hard-coded old request-ID QR task.
- [x] Make the modal responsive and internally scrollable.
- [x] Add accessibility labels/live regions and keyboard-focus behavior.
- [x] Fix controller/store/listener cleanup.

### Phase 6 — validation and rollout

- [x] Run SDK type check and build.
- [x] Run focused MeteorConnect mobile adapter and coordination unit tests. The older broad Bun test file remains blocked by its existing Lit decorator harness configuration.
- [ ] Add browser UI tests and local backend integration tests.
- [ ] Test against the real mobile dev build and production-like backend.
- [ ] Test the exact built/generated Near Connect manifests and custom-scheme opening path in the real sandbox host.
- [ ] Run web/extension regression matrix.
- [x] Inspect ESM/CJS bundles and package tarball contents; test-only source paths are excluded from the publish tarball.
- [x] Update SDK and MeteorConnect documentation.
- [x] Keep the mobile-enabled rollout default off until the compatible backend/mobile-store deployment gate passes; then enable progressively and record the minimum supported app version.

## 12. Test plan

### 12.1 Unit tests

Request conversion:

- every `MCNearActions` ID maps to the expected `act_impl_near` ID;
- mainnet/testnet and signer IDs are preserved;
- nonce base64 round-trip;
- zero transactions reject before bridge creation; one produces `sign_and_send_transaction`; multiple produce `sign_and_send_transactions` with the right shapes;
- every supported NEAR action serializes without bigint, class instance, or raw byte leakage;
- deprecated contract input normalizes correctly;
- generated access-key private material never appears in serialized request data;
- the shared key-store provider reads existing v1 `_meteor_wallet` entries unchanged;
- key persistence failure produces `local_key_persistence_failed` and no falsely usable connection record.

Native opening and host permissions:

- a direct-browser click invokes the custom scheme synchronously with the full fragment unchanged;
- the Near Connect provider calls `window.selector.openNativeApp`, never ordinary `window.open`;
- no promise/microtask/network operation is inserted before the opener call;
- generated production/dev manifests contain the two exact allowed bridge targets and no broader custom-scheme permission.

Result conversion:

- every shared success output maps to the current SDK type;
- signed message key/signature/state conversion;
- one/many transaction result normalization;
- sign-in accounts without a wire `publicKey` convert per 10.1;
- sign-in-and-sign-message rejects any entry whose account and signed-message account IDs differ;
- signed delegate Borsh decode and canonical hash;
- sign-out validates the returned account ID before returning/removing the original account identifier;
- mismatched domain/action ID is rejected;
- malformed output is rejected by `hydrateResultPayload`;
- mismatched signed wire versus recomputed `outputHash` is rejected, covering both `ok` and error results (10);
- account-targeted results with a mismatched account identity are rejected per 10.4 and never refresh a routing record;
- non-`ok` wire results hydrate to Nice Errors and reject the SDK action;
- invalid wallet result signature is rejected.

Session lifecycle:

- initialization is coalesced;
- repeated initialization with an identical fingerprint is a no-op, while a different backend/storage/app fingerprint is rejected;
- storage prefix remains stable across reload;
- a browser with neither Web Locks nor enumerable storage fails mobile initialization with `mobile_bridge_coordination_unsupported`, while web/extension remain usable;
- dev/prod backend storage is isolated;
- incomplete, wrong-environment, wrong-app, or old-partner-identity account records never push and instead require QR/re-pair;
- missing/stale/incompatible authenticated wallet capability records never push or commit mobile; a compatible re-pair refreshes them;
- successful QR re-pair refreshes the targeted account connection record; sign-out removes rather than refreshes it only after validating the returned signed-out account ID;
- sign-in and non-mobile-contextual actions never call `request_action_via_push`;
- a mobile-connected account uses exactly one `request_action_via_push` call with its stored verify key;
- a lost create/push response retries with the same `partnerRequestId`, recovers the same bridge, and never starts legacy while the result is unknown;
- every push failure retains QR/deep link;
- PIN verification progresses to wallet action;
- wrong PIN on attempt 1 or 2 stays retryable, rendering the server attempt surface when present and the capped local count otherwise;
- correct PIN on attempt 3 succeeds; third incorrect PIN is terminal; the SDK never sends a fourth submission for one bridge;
- local PIN state reconciles to a differing server count when the attempt surface exists;
- countdown uses absolute server `expiresAt` and recomputes after tab suspension;
- refresh never replaces a visible QR until cancellation/expiry proves the old bridge non-executable;
- cancel losing to claim keeps the old session and creates no replacement bridge;
- `identity_pin_mismatch` produces confirmation, comprehensive reset, routing-record invalidation, and re-pair—not a spinner or stale push;
- the coordinator never constructs two partner clients in one JavaScript realm; with the 8.5 refactor landed, two clients additionally have independent stores;
- two dApp tabs—including opaque-origin Near Connect executors coordinating through selector storage—cannot concurrently provision identity, lose paired-wallet map updates, run overlapping first-pairing windows, or reset while another tab is active; fencing prevents a stale-owner write and lease expiry permits crash recovery;
- the same concurrency/crash-recovery cases pass in a direct browser with Web Locks deliberately unavailable, using the storage-backed fallback;
- two trusted reconnections for different wallet keys retain both paired-wallet records;
- the channel-isolation gate proves that, with identity established, two tabs can run different bridges concurrently (sign-in QR in one, contextual push in the other) without channel-state interference or broad lease contention;
- completed state unsubscribes and resolves once;
- retry ignores prior-session store events;
- pre-claim and PIN-screen close cancel safely without clearing pairings;
- close during `wallet_action` never reports cancellation or starts legacy execution and communicates that the request continues on the phone.
- local timeout/abort tears down listeners and timers, but a dispatched mutation remains unknown until idempotent/authoritative reconciliation; page unload sends no secret-bearing beacon.

Action arbitration:

- web click cancels prepared bridge before existing v1 execution;
- extension click does the same;
- wallet claim first commits mobile;
- cancel/claim race never starts both target clients;
- cancellation timeout/unknown result never authorizes legacy execution;
- choosing legacy while create/push outcome is unknown first recovers the same idempotent bridge and obtains terminal cancellation;
- repeated execute calls return the same result;
- `execute()` after `cancelAction` refuses to run;
- contextual mobile accounts push immediately;
- contextual web/extension accounts preserve existing automatic behavior.

### 12.2 Backend/connect integration tests

Against a local `mc_backend`:

- QR → claim → PIN → action → signed result;
- trusted reconnection skips PIN;
- paired-wallet lookup survives page reload;
- push request creates one bridge and retains its QR metadata;
- dropping a response after create or after push and retrying with the same `partnerRequestId` returns the same bridge; concurrent identical retries still produce exactly one bridge and one notification;
- conflicting reuse of an idempotency key fails without bridge mutation or push;
- cancel before claim prevents claim;
- simultaneous cancel/claim has one terminal winner;
- cancel during wallet verification terminates the wallet PIN flow;
- cancel after `wallet_action` commitment returns incompatible status and cannot authorize legacy execution;
- PIN attempt 1/2 failures persist across DO eviction/rehydration, a correct third attempt succeeds, and an incorrect third attempt fails terminally;
- concurrent/duplicate PIN submissions cannot exceed or reset the authoritative attempt state;
- create/push outputs expose the configured absolute `expiresAt`;
- expired bridge produces a retryable UI state using server time (force expiry rather than waiting for the dev TTL);
- comprehensive identity reset removes separately prefixed paired-wallet data and provisions a clean identity;
- reset refuses while another tab/session heartbeat is live, increments the fencing generation when it proceeds, and prevents an obsolete tab from restoring old state;
- concurrent trusted reconnections for two different wallet keys preserve both records;
- account-targeted wallet resolvers reject missing/wrong account requests, and sign-out returns the account actually signed out;
- missing, forged, or insufficient wallet capability claims are rejected before action exposure/commitment; compatible claims and push records succeed;
- WebSocket drop/reconnect continues realm state and result delivery.

### 12.3 Real device tests

Android and iOS where supported:

- scan production/dev QR scheme;
- same-device **Open in App** deep link from a mobile browser, including: leave to the wallet, complete the action, return to the (previously backgrounded) browser tab, and receive the result after the visibility-regain link check (7.4);
- invoke both custom schemes from the built SDK inside the real Near Connect sandbox host, proving the exact manifest allowlist and `openNativeApp` path preserve the full secret fragment; repeat taps remain available if launch cannot be observed;
- mobile-browser layout shows **Open in App** as primary with the QR reachable via the toggle;
- first pairing and PIN, including a wrong attempt and the attempts-exceeded terminal path;
- scanning an account-targeted QR (5.7 re-pair fallback) with a different wallet/account than the stored one is rejected by the 10.4 account-identity validation with a clear error and no routing-record refresh;
- foreground push (mobile-connected account);
- background notification tap;
- killed/cold-start notification tap;
- denied notification permission → QR/deep-link fallback;
- missing/stale token → QR/deep-link fallback;
- stale/revoked partner trust → QR and re-pair;
- mobile completion returns each NEAR action output to the dApp.
- an outdated/incompatible mobile build is rejected before action execution, produces the documented update-app/retry guidance, and cannot cause the SDK rollout flag to be enabled prematurely.

### 12.4 Legacy regression matrix

For both mainnet and testnet where applicable:

- v1 Web App sign-in;
- v1 extension sign-in;
- sign-in with function-call key;
- sign-in and sign message;
- sign message;
- sign transaction(s);
- delegate actions;
- verify owner;
- sign out;
- localhost dev target;
- Safari/mobile user-gesture continue screen;
- popup close/cancel behavior.

The existing v1 target client files should have no behavioral diff unless a narrowly scoped shared helper is extracted with equivalent tests.

## 13. Build and packaging checks

The SDK's `tsdown` config bundles monorepo/package dependencies except an explicit set of UI externals. Adding the connect stack materially increases the browser bundle and introduces NiceCode action/state/realm/wire code.

Before release:

- inspect output size by module;
- confirm one bundled copy of `@meteorwallet/connect-shared`/NiceCode domains and exactly one partner client (and store) per realm; if the 8.5 refactor has landed, additionally no import of the deprecated package-global store;
- confirm Web Crypto and WebSocket references are runtime-safe and not evaluated during SSR import;
- confirm `frontend_env` is not relied upon for the production URL;
- build both ESM and CJS outputs;
- test the ESM output in the NEAR Connect sandbox;
- inspect the generated/public Near Connect manifests and prove they contain only the exact production/dev native bridge targets from 7.8.1;
- test a direct browser consumer;
- inspect generated declarations for leaked private/internal types;
- inspect the package tarball for required source/dist files and absence of secrets/test fixtures.

Commands to run during implementation:

```powershell
# SDK package
cd C:\d\meteor_wallet_sdk\packages\meteor-sdk-v1
bun run type-check
bun run build

# All SDK workspaces
cd C:\d\meteor_wallet_sdk
bun run type-check-all

# Connect packages while developing upstream changes
cd C:\d\mc_backend
bun run type-check-all
bun run build-all
```

Use the repository's local-package linking workflow while the required connect changes are unpublished. Do not publish from an automated implementation session.

## 14. Security and privacy checklist

- [x] Partner secret appears only in the deep-link fragment and in memory required by the bridge client.
- [x] Partner secret is absent from query strings, logs, analytics, error text, and persisted account data.
- [x] PIN is never logged or persisted by the SDK/browser. Backend retention is limited to the expiring bridge state required for verification and is deleted with bridge cleanup.
- [x] Pending access-key private key never crosses the bridge.
- [x] Wallet result must have a valid identity signature.
- [x] Nice Action result must hydrate against the expected domain/action schema.
- [x] Hydrated recomputed `outputHash` must equal the signed serialized `outputHash`.
- [x] The selected wallet is addressed only by its verify-key handle; `walletPerId` remains backend-only.
- [x] Push routing requires a supported connection schema, matching environment/app/partner identity/exact wallet handle, and authenticated proof of required wallet capabilities.
- [x] Wallet protocol/capability data is signed and backend-validated before action exposure/commitment; app ID/user agent is never used as proof of compatibility.
- [x] Account-targeted results are accepted only when the result's account identity matches the targeted account (10.4); mismatches never resolve the action or refresh routing records.
- [x] Partner origin metadata identifies the real dApp, not the executor iframe.
- [ ] Legacy HTTP(S) windows use `noopener`/`noreferrer`; native custom schemes use only the injected opener, preserve the full fragment, and are restricted by the exact manifest allowlist in 7.8.1.
- [x] `partnerRequestId` is a high-entropy idempotency identifier bound to authenticated partner/action/secret commitment, never treated as authorization, and never reused for a different logical session.
- [x] No mobile error silently falls through to an unsafe duplicate legacy execution.
- [x] Cancel-versus-claim is resolved by backend state, not timing assumptions in the UI.
- [x] Development and production identities/backends are storage-isolated.
- [x] Cross-tab lease/ticket records contain only random ownership, ordering, heartbeat, and expiry metadata—never partner secrets, PINs, wallet keys, or access-key material.
- [x] Identity reset requires confirmation and an exclusive maintenance lease, refuses while another tab is active, clears all paired-wallet state, and fences stale writers/old partner-identity bindings.

## 15. Observability and error handling

Add bridge logs through `MeteorLogger` using phase and bridge-safe identifiers only. Never log the full QR value.

Useful events:

- partner initialized/restored;
- ownership lease acquired/contended/recovered (random owner correlation only);
- bridge creation started/succeeded/failed;
- idempotent create/push recovery started/resolved/conflicted, using only a short one-way correlation hash rather than the raw key/secret;
- push attempted/delivered/not delivered with reason;
- wallet claimed (without keys/secrets);
- PIN verification started/succeeded/failed with attempts remaining, never the PIN;
- mobile target committed;
- realm reconnect/attach diagnostic;
- wallet result signature validated;
- action completed/cancelled/expired;
- legacy target won and bridge cancellation succeeded;
- identity reset requested/confirmed/completed;
- key persistence partial failure (without key/account secrets).

User-facing errors should distinguish:

- mobile temporarily unavailable while web/extension remain usable;
- this host lacks safe cross-tab coordination (`mobile_bridge_coordination_unsupported`) — inject a lease provider or use enumerable durable storage; web/extension remain usable;
- bridge preparation outcome unknown — safely recovering the same request before retry/cancellation;
- push unavailable but QR usable;
- invalid PIN, retry in same session, with remaining attempts;
- PIN attempts exceeded — terminal for this bridge, create a new QR and re-pair;
- bridge nearing expiry, explicitly refresh the mobile code; or expired bridge, create a new QR;
- connection reconnecting;
- Meteor Mobile briefly busy in another tab (identity setup or pairing in progress there);
- identity reset blocked because another tab is actively using Meteor Mobile;
- installed Meteor Mobile version is unsupported — update the app and retry;
- identity pin mismatch — terminal for the identity; confirm comprehensive reset and re-pair (never an indefinite spinner);
- wrong account answered — the wallet completed the request with a different account than this action targets;
- mobile already committed — closing the popup does not cancel the phone action;
- local function-call-key persistence failed after wallet success — partial success requiring retry/revocation guidance;
- security validation failure, terminal;
- target race resolved to mobile, do not open legacy wallet.

## 16. Documentation updates

Update:

- `packages/meteor-sdk-v1/src/MeteorConnect/Readme.md` with architecture and configuration;
- root `readme.md` with mobile bridge capability and backend configuration;
- public API docs for mobile config/connection type;
- Near Connect executor notes explaining partner metadata origin, native-app opener injection, and exact manifest allowlist;
- test/demo instructions for first QR pairing and subsequent push;
- migration note that the old unimplemented request-ID v2 target IDs are replaced by `v2_bridge_mobile`.

Document that:

- push happens only for accounts that signed in through the mobile wallet; sign-in always presents QR/deep-link;
- push is best-effort and QR/deep-link is always the fallback;
- an ambiguous create/push response is recovered idempotently and never creates a second executable request;
- notification delivery is not action approval;
- first pairing requires a 4-digit PIN with a 3-attempt limit; exceeding it requires a fresh QR;
- PIN attempts are limited to three and the third incorrect submission is terminal;
- on a mobile-device browser the primary affordance is **Open in App**, with the QR available via a toggle;
- an account remains associated with the wallet target through which it signed in;
- mobile routing records are bound to backend environment, app, partner identity, and exact wallet handle;
- an installed wallet must prove the required protocol capabilities before it can claim/execute or receive contextual push;
- account-targeted requests must be completed by the targeted account; a different account's answer is rejected;
- same-origin tabs may run mobile requests concurrently after the channel-isolation gate; identity setup, paired-wallet writes, first pairing, and reset use the narrow cross-tab coordination in 5.8;
- a visible QR is never silently rotated near expiry; refresh cancels the old bridge first;
- clearing site storage resets the durable partner identity and requires re-pairing; and
- the minimum supported Meteor Mobile version and staged feature-flag rollout order from 8.9.

## 17. Acceptance criteria

Implementation is complete only when all of the following are true:

1. A sign-in prompt immediately displays a **Meteor Mobile** loading state and then, on desktop, a real scannable production/dev QR; on a mobile-device browser, a working **Open in App** button with the QR reachable via the toggle.
2. Both exact production/dev custom schemes open the new mobile app with the bridge ID and partner secret parsed correctly in direct browsers and the real Near Connect sandbox; the opener is invoked synchronously from the click and the generated manifest allowlist is no broader than required.
3. First-time pairing reaches a 4-digit PIN UI and resolves the original SDK promise. Attempts 1/2 can retry, a correct third attempt succeeds, an incorrect third attempt is terminal using persisted server state, and the SDK never sends a fourth submission.
4. An action targeting a mobile-connected account pushes only when schema version, environment, app, partner identity, exact wallet handle, and authenticated required wallet capabilities match; otherwise it uses QR/re-pair. Sign-in never pushes, and every push failure retains the same QR/deep-link bridge. Lost responses recover that same idempotent bridge and never send a second push.
5. Foreground, background-tap, and cold-start push flows complete on a real device, and the same-device **Open in App** flow delivers the result after returning to the backgrounded browser tab.
6. All currently exposed NEAR actions use the final account-explicit `act_impl_near` contracts, hydrate signed results through the domain API, verify the recomputed output hash, and return the existing SDK public output shapes.
7. Account-targeted results are rejected if their account identity is missing, malformed, or different from the requested account (10.4); a rejected result never resolves, refreshes, or removes an account record. Sign-in-and-sign-message also rejects internally mismatched account/message pairs.
8. Mobile sign-in writes a complete `v2_bridge_mobile` connection record with schema version, environment ID, app ID, partner client ID, and exact active wallet verify key; it never writes a partial push-capable record. A later QR re-pair refreshes the targeted account only after successful, account-validated non-sign-out completion.
9. Selecting Web App or Chrome Extension waits for recovery of any unknown create/push outcome and confirmed backend cancellation before running unchanged v1 code. Unknown/failed recovery or cancellation never authorizes legacy execution.
10. A claim/cancel/complete race has exactly one backend-authoritative winner, cannot produce two broadcasts, and a cancelled `ExecutableAction` can never execute afterwards.
11. The coordinator constructs at most one partner client per JavaScript realm; cross-tab coordination serializes identity provisioning, every paired-wallet map update, first-pairing windows, and destructive reset. Trusted concurrent reconnections lose no records, stale owners are fenced, and the channel-isolation gate proves separate-tab bridges run concurrently without runtime-state interference.
12. Popup close follows the phase contract: pre-action states cancel safely, while close after `wallet_action` commitment never claims cancellation or opens legacy and clearly states that the phone request continues.
13. Countdown uses server `expiresAt`; refresh never rotates a visible QR until old-bridge cancellation/expiry is terminal, and a claim winning refresh keeps the original session.
14. `identity_pin_mismatch` offers a confirmed comprehensive reset that refuses while another tab is live, then clears all identity/pairing namespaces, advances the fencing generation, invalidates old routing bindings, provisions a new identity, and requires re-pair instead of hanging or using stale push state.
15. Generated function-call private keys stay local, use the shared v1-compatible key-store provider, and a post-wallet persistence failure returns the documented partial-success error without a false usable account record.
16. Existing web/extension behavior, URLs, stored keys, and contextual routing pass the full regression matrix.
17. Retry, expiry, reconnect, push failure, ownership contention, and terminal cleanup remove listeners/sockets/leases without unintentionally deleting pairings.
18. No partner secret, PIN, or private key appears in logs, server-visible URLs, analytics, error payloads, or persisted account metadata.
19. SDK type check, build, unit tests, connect/backend integration tests, packaging checks, and real-device tests all pass against the released compatible packages/backend and production mobile build.
20. Incompatible/missing wallet capabilities are rejected before action exposure or mobile commitment with update guidance; the mobile feature remains disabled by default until the 8.9 backend/mobile/store rollout gate is recorded as passed, and progressive enablement can be rolled back without changing web/extension behavior.

## 18. Key risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| no backend cancel for eager bridge | duplicate transactions | implement Phase 0 cancel action before release |
| create/push succeeds but its response is lost | retry creates a second bridge/push; legacy cannot safely cancel the unknown first bridge | partner-scoped idempotency binding, same-bridge recovery, exactly-once push tests (8.1.1) |
| wallet auto-claims pushed bridges without a user tap | involuntary mobile commitment locks the user out of their chosen target | push only for mobile-connected accounts (5.6); sign-in is QR/deep-link only, so a claim always reflects user intent |
| global `PartnerBridgeStore` | same-page clients overwrite each other | coordinator guarantees one client per realm; session-token stale-event guards; recommended 8.5 instance-store refactor |
| concurrent tabs race identity provisioning, trusted pairing-map writes, or reset | key/client ID corruption, dropped wallet records, or stale identity resurrection | named narrow locks, paired-wallet mutation hook, live-session registry, maintenance lease, and fencing; Web Locks with storage-ticket fallback (5.8) |
| concurrent clients share NiceCode ephemeral channel keys | messages/state cross between otherwise independent bridge IDs | two-client channel-isolation release gate; split durable shared and tab-namespaced ephemeral storage if it fails |
| multiple paired wallets | push sent to wrong device | route only by the exact verify key stored on the account connection; no heuristics, no fan-out |
| wallet request omits target account or response uses another account | wallet acts on local selection; dApp resolves/removes/refreshes the wrong account | account-explicit schemas/resolvers (8.7) plus strict result validation (10.4) |
| an older installed wallet ignores new account-targeting semantics | wrong-account transaction can broadcast before result rejection | signed protocol/capability claim rejected before action exposure; missing legacy capability records cannot push (8.7.1) |
| PIN attempts are unpersisted/currently fail on call 4 | limit can reset after DO eviction and UI/server disagree | Phase 0 exactly-three atomic persistence; SDK three-submission cap; recommended remaining-attempt surface; eviction/concurrency tests |
| lazy expiry and client-hard-coded TTL | user scans a dead QR or SDK diverges from backend config | expose absolute server `expiresAt`; recompute after suspension; force time in tests |
| automatic QR rotation near expiry | camera claims an old bridge while UI displays a new one | explicit refresh; authenticated cancel-old-first; create only after terminal non-executable result |
| no connection status in `PartnerBridgeStore` | reconnects and attach failures are invisible; `identity_pin_mismatch` hangs forever | subclass the protected hooks (7.4); dedicated reset-and-re-pair recovery state |
| mobile browser suspends WS while user is in the wallet app | same-device flow appears stuck on return | visibility-regain link verification and idempotent re-dial |
| unstable/mismatched partner storage identity | push unavailable or sent using dev/old trust context | durable caller storage, fingerprinted initialization, environment/app/partner-ID account binding |
| base `reset_client()` leaves prefixed paired wallets | stale local wallet records and `link_not_found` push attempts | comprehensive partner reset clearing all namespaces plus routing-record invalidation |
| wrong iframe origin metadata | misleading wallet approval screen | pass `window.selector.location`/explicit metadata |
| ordinary `window.open` handles a custom scheme inside the Near Connect sandbox | Open in App is blocked or routed through the wrong host permission path | synchronous injected native opener plus exact production/dev manifest allowlist (7.8.1) |
| omitted access-key public key | invalid shared action or unusable local key | generate locally, send public only, persist private only after success |
| wallet succeeds but local private-key persistence fails | orphaned on-chain access key and false successful local state | shared injected key store; explicit partial-success error; no connection/key metadata stored as usable |
| wallet returns accounts without a public key | required `publicKeys` field cannot be populated | defined empty-array conversion (10.1) with tests |
| delegate result shape mismatch | breaks NEAR Connect callers | decode signed delegates and compute canonical hashes |
| popup fixed height | clipped QR/PIN controls | responsive container and internal scrolling |
| bundle growth/duplicate domains | load/runtime problems | bundle analysis, dedupe verification, ESM/CJS smoke tests |
| push delivery interpreted as approval | premature SDK resolution | resolve only from signed `completed` bridge result |
| manually rebuilding Nice Action output/errors | schema drift or incorrect Nice Error behavior | use `act_impl_near.hydrateResultPayload`, verify expected ID and recomputed signed output hash |
| stale dependency builds in `mc_backend` | upstream code written against an API surface that no longer exists | refresh/verify `node_modules` before Phase 0 (8.9 step 0); a stale same-version `@nice-code/action` build was observed previously |
| SDK enabled before compatible mobile/backend rollout | QR opens an app that cannot understand final schemas/cancellation | default-off rollout gate, mobile-first deployment, minimum-version documentation, progressive enablement (8.9) |
| stale push/expired bridge | confusing or unsafe action | backend TTL, terminal failed state, explicit QR retry |
| cancelled action executes later | duplicate/unwanted broadcast | terminal cancelled state in `ExecutableAction` (7.7) |
| popup closes after mobile action starts | caller believes action cancelled while phone may broadcast | phase-specific close contract; never authorize legacy; communicate that mobile continues |

## 19. Recommended implementation order summary

1. Refresh/verify `mc_backend` dependencies, then complete every Phase 0 upstream blocker: cancellation, idempotent create/push, active-wallet exposure and atomic paired-wallet persistence, `expiresAt`, comprehensive reset, exactly-three persisted PIN attempts, account-explicit NEAR actions, and the signed pre-commit wallet capability gate (recommended riders may travel with the release).
2. Deploy the compatible backend and production mobile build, publish the shared/connect packages, and lock the SDK to those exact APIs; keep the mobile flag off.
3. Build/test pure NEAR request/result converters, domain hydration/output-hash and strict account checks, and the shared v1-compatible key-store provider.
4. Add fingerprinted configuration/storage, environment/identity-bound connection records, the process coordinator, named cross-tab coordination, live-session reset fencing, and the native opener/manifest integration.
5. Pass the two-client channel-isolation gate; split durable and ephemeral storage namespaces if required.
6. Add the coordinator-owned mobile client and isolated session state machine with idempotent unknown-outcome recovery, authoritative PIN, expiry, refresh, reset, reconnect, and stale-event handling.
7. Add backend-authoritative target arbitration and phase-specific cancellation/close behavior to `ExecutableAction`.
8. Add the device-adaptive Meteor Mobile popup panel (QR-first on desktop, Open-in-App-first on mobile devices) while leaving v1 controls intact.
9. Validate QR/PIN/idempotency/cancel/expiry/reset/concurrency end to end against the local backend.
10. Validate contextual push and both custom-scheme/same-device flows in the real Near Connect host and on Android/iOS devices.
11. Run the complete legacy regression, bundle/package/manifest checks, and migration tests.
12. Update docs, satisfy the 8.9 rollout gate, and hand progressive enablement/release steps to maintainers.
