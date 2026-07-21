# Meteor Connect Mobile Bridge Integration Plan

**Status:** Implementation-ready after the Phase 0 upstream release blockers in section 8 are complete<br>
**Last reviewed:** 2026-07-21 (revised after source-verification and implementation-readiness review against `mc_backend`, the installed packages, and the SDK)<br>
**Primary scope:** `packages/meteor-sdk-v1/src/MeteorConnect` and its Meteor Connect popup  
**Reference implementation:** `../mc_backend/packages/demo-partner-web`, `../mc_backend/packages/demo-wallet-expo`, `../mc_backend/packages/meteor-connect-client`, and `../mc_backend/packages/meteor-connect-shared`

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
- Supporting multiple simultaneous MeteorConnect action popups. The current SDK UI is singleton-based and the coordinated ownership policy deliberately permits one active mobile bridge per storage namespace/environment. Phase 0 still removes the package-global store so separate client instances cannot contaminate state.
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
- **`PartnerBridgeStore` is a module-global singleton.** Constructing one client per `MeteorConnect` instance does not isolate state: two clients in the same JavaScript realm still overwrite the same store. The upstream client should accept/own an instance-scoped store; until that exists, the SDK must use one process-wide coordinator and may not construct competing partner clients (see 7.3 and 8.5).
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

Required backend semantics after the Phase 0 fix:

- the PIN is **4 digits** (`generateClientSecurityPinCode(4)`);
- every submitted PIN is counted and persisted atomically before returning;
- a correct PIN on attempt 1, 2, or 3 succeeds;
- an incorrect PIN on attempt 1 or 2 remains retryable and returns authoritative `attemptsUsed`/`attemptsRemaining` data, also mirrored in realm/store state;
- an incorrect PIN on attempt 3 atomically transitions pairing and core status to terminal `failed` with the reason `PIN attempts exceeded`;
- attempts cannot be reset by Durable Object eviction, hibernation, reconnect, duplicate delivery, or page reload;
- recovery from the terminal state is a brand-new bridge/QR, restarting pairing.

The error ID may remain `pin_incorrect`, but the authoritative attempt count and terminal bridge state must distinguish retryable and terminal outcomes. The SDK may keep a local optimistic counter for immediate feedback, but it must reconcile it to server state and must never use the local count as the security boundary.

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

This is a release-blocking correctness issue for transaction and delegate-action requests. Section 8 defines the required cancellation addition.

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

1. Push only when the action targets an account whose stored connection is `v2_bridge_mobile`, using the exact `walletVerifyPublicKey` persisted in that connection config at sign-in. This is the mobile analogue of "the extension pops up straight away because the account signed in with the extension".
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

Before contextual routing, all four routing values must match the active bridge client. On a legacy/incomplete/mismatched record, do not push. Prepare a QR/deep-link bridge and require pairing again. After a successful authenticated non-sign-out action, update that targeted account's connection record from the current environment/partner identity and exact active wallet; successful sign-out removes the account as usual. Never silently reinterpret a development handle as production or infer a replacement wallet from `get_paired_wallets()`.

### 5.8 Same-page and cross-tab concurrency require an ownership policy

The durable partner identity is intentionally shared by same-origin tabs, but its initialization and active bridge session cannot be concurrently mutated without coordination. A test alone is not a concurrency design.

The implementation policy is:

1. One process-wide SDK coordinator owns partner-client construction for a storage namespace/environment.
2. Before `initialize_client()` or bridge creation, acquire a cross-context lease named from the normalized storage namespace/environment through an injected `IMeteorConnectBridgeLeaseProvider`.
3. For direct same-origin SDK consumers, the default provider may use the Web Locks API with `ifAvailable`. The NEAR Connect executor runs in a sandboxed `srcdoc` iframe with an opaque origin (`sandbox="allow-scripts"`), so iframe-local Web Locks, `BroadcastChannel`, and `storage` events cannot coordinate sibling dApp tabs reliably. Its provider must coordinate through `window.selector.storage`, using an adapter-backed mutual-exclusion protocol (for example a Lamport bakery/ticket lock): unique contender keys, choosing/ticket state, deterministic ticket+owner ordering, polling, heartbeat/expiry for crashed contenders, and ownership/fencing revalidation before every identity or bridge mutation. A simple read-then-write lease is insufficient because two tabs can both observe an empty key.
4. Hold the lease through the active bridge session, then release it on every terminal path. A TTL permits recovery after a crashed tab.
5. A non-owner tab must not initialize/mutate the partner identity or create a bridge. Show a deterministic “Meteor Mobile request is active in another tab” state with retry/focus guidance; legacy behavior may remain available only if no mobile claim has committed. The implementation must not depend on receiving a cross-tab event; polling/lease expiry is the correctness path.
6. Same-page `MeteorConnect` instances use the same coordinator/mutex and cannot bypass the lease.

Phase 0 should additionally make `PartnerBridgeStore` instance-scoped so independent clients no longer contaminate each other in one JavaScript realm (8.5). The coordinator and cross-tab lease are still required because instance-scoped stores do not make shared durable identity writes atomic.

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
  enabled?: boolean; // default true in a browser
  backendUrl?: string; // default https://mc.meteorwallet.app
  meteorAppId?: EMeteorAppId.meteor_wallet_mobile | EMeteorAppId.meteor_wallet_mobile_dev;
  leaseProvider?: IMeteorConnectBridgeLeaseProvider; // advanced host integration; SDK default for direct browsers
  partnerMetadata?: {
    name?: string;
    description?: string;
    iconUrl?: string;
    originUrl?: string;
  };
}
```

The lease provider returns either an exclusive handle or a typed contended result. A handle exposes a random owner/fencing token, `assertOwned()` (used before identity/bridge mutations), and idempotent `release()`. The direct-browser default uses Web Locks; the NEAR Connect executor injects the selector-storage ticket provider from 5.8. Lease implementation details are not persisted in account metadata and are not part of the wallet protocol.

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

Use a prefix similar to:

```text
met_bridge_partner::<backend-environment>::
```

The backend portion must be normalized or hashed so dev and production never share `clientPerId`/crypto identity state by accident.

Route initialization through the process-wide coordinator from 5.8 and coalesce concurrent calls with the same configuration fingerprint. The fingerprint includes the original storage namespace, normalized backend/environment ID, app ID, and security-relevant partner identity configuration. `getMeteorConnect()` in the NEAR Connect executor currently calls `initialize` repeatedly, so an identical call is an idempotent no-op.

If an already initialized `MeteorConnect` or coordinator is called with a different fingerprint, reject with a typed `mobile_bridge_config_mismatch` error; never silently switch backend, storage, app ID, or identity underneath persisted accounts. Reconfiguration requires an explicit `disposeMobileBridge()`/equivalent after there is no active session, followed by a fresh initialize. Partner display metadata may be refreshed only through an explicitly supported metadata update that does not rotate crypto identity.

The SDK must document the storage scoping contract. In NEAR Connect, wallet storage is scoped by wallet manifest ID within the dApp's origin. Direct SDK callers must supply durable storage scoped to their own dApp/origin; sharing one backing namespace between unrelated partner identities is unsupported.

### 7.4 Mobile bridge session object

`MobileBridgeSession` should isolate the client store behind an SDK-local, action-specific state machine. Once Phase 0 makes the store instance-scoped, subscribe only to the store owned by the coordinator's client; do not import the package-global store directly.

Responsibilities:

- hold the expected SDK request and corresponding `act_impl_near` request;
- subscribe to `PartnerBridgeStore` and unsubscribe deterministically;
- expose a read-only UI snapshot and change listener;
- create the bridge through QR or push;
- expose the finalized QR/deep link without logging its secret;
- submit the PIN, rendering the authoritative server attempt count from 5.1 and using any local optimistic count only until server state arrives;
- mark the session committed when the wallet claims;
- validate the completed Nice Action result and convert it to the existing SDK output type (section 10);
- run an expiry countdown from the server-provided absolute `expiresAt` value and offer the safe refresh flow defined below;
- support retry after pre-claim failure — always calling `disconnect_bridge()` **before** the replacement `create_bridge()` (the library documents that a leftover bridge connection can route the next bridge's traffic over the previous bridge's socket);
- cancel/abandon the backend bridge;
- disconnect the local bridge on teardown while retaining partner identity and pairings.

Connection-state observation requires subclassing: because `PartnerBridgeStore` has no connection status (4.2), the SDK's client must extend `PartnerBridgeClient` and override the protected hooks —

- `onBridgeRealmStatus` / `onBridgeLinkEvent` → drive the "reconnecting" UI state;
- `onBridgeRealmAttachError` → surface attach failures; treat `identity_pin_mismatch` as terminal for the identity (parked redial ladder), presenting the user-confirmed comprehensive identity reset from 8.4 followed by re-pairing, instead of a spinner.

For the same-device mobile flow ("Open in App"), the browser tab is backgrounded while the user is in the wallet, and mobile browsers freeze/kill WebSockets in background tabs. On `visibilitychange` back to visible, the session must verify the bridge link and re-dial if needed (`connectBridgeLink()` is idempotent) so the result is not silently missed.

Only one active session is allowed per coordinated storage namespace/environment across all same-page instances and tabs. Starting another action must finish/cancel the old one and acquire the ownership lease before creating a bridge. The coordinator, rather than an individual `MeteorConnect` instance, enforces this invariant.

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
3. Determine the configured app ID (`meteor_wallet_mobile` or dev).
4. Validate the targeted account's connection schema version, environment ID, app ID, and partner client ID against the active coordinator. Only on a complete match is its exact `walletVerifyPublicKey` a push target. Sign-in, incomplete/mismatched records, and non-mobile-contextual actions have no push target (5.6–5.7).
5. If there is a target, call `request_action_via_push` with that key, the action request, and `[configuredAppId]`.
6. If there is no target, call `create_bridge` with the action request and `[configuredAppId]`.
7. Read `bridge.info.walletLinks` from `PartnerBridgeStore` and select the entry matching the configured app ID.
8. Append `#partnerSecret=...` using `encodeURIComponent`.
9. Publish the same full deep link to both presentations — the QR renderer and the same-device **Open in App** button; `isMobile()` decides which is primary (6.1).
10. Start the server-authoritative expiry countdown from `bridge.info.expiresAt` (7.4).
11. Continue watching the store until completion, cancellation, expiry/failure, or UI teardown.

Never call `request_action_via_push` more than once for a single SDK action because each call creates a different bridge.

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
- during `wallet_action`, mobile is already committed and cancellation cannot guarantee that an on-chain broadcast has not begun. Closing the browser UI must not start a legacy target or report the request as cancelled. Show a confirmation that the request continues on the phone, then detach only the browser listener; alternatively keep the popup non-dismissible until the mobile result arrives;
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

PIN requirements:

- 4-digit numeric input without coercing away leading zeroes;
- explicit submit button rather than verifying on each keystroke;
- disabled state while verification is running;
- wrong-PIN errors shown with the server-authoritative remaining-attempt count, without discarding the QR/session;
- a terminal attempts-exceeded state after the third incorrect submission (see 5.1) that offers a new QR instead of further submits;
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

### 8.2 Expose the active paired-wallet handle — release blocker

After `initializePartnerVerified`, expose the exact current `TPartnerPairedWallet` through a safe getter or the partner store/session state. This lets the SDK store the correct `walletVerifyPublicKey` on the returned mobile account connection.

The exposed record must be tied to the current authenticated bridge/claim and include the verify key, Meteor app ID, and any exchange-key data already present in `TPartnerPairedWallet`. Do not expose `walletPerId`; the verify key remains the intended partner-facing routing handle. The SDK must not choose from `get_paired_wallets()` by recency or array order.

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

### 8.5 Instance-scoped partner store — release blocker

Refactor `PartnerBridgeClient` so each client owns or receives a `Store<IPartnerBridgeStore>` instance. Export a factory/default state if useful, but do not force every client to publish to the module-global `PartnerBridgeStore`. Preserve a deprecated global export only if existing demos need a migration window.

All internal client updates must target `this.store`; callers must be able to subscribe to the exact store associated with the client. Add a test with two clients in one JavaScript realm proving that bridge creation, realm patches, completion, reset, and disconnect on one client do not alter the other store.

### 8.6 Correct and persist PIN attempts — release blocker

Update `PairingBridgeDO.verify_pin` and shared/client error/state types to implement 5.1:

- exactly three submitted attempts;
- correct PIN on the third attempt succeeds;
- third incorrect PIN fails terminally;
- every failed attempt is persisted before returning;
- authoritative `attemptsUsed`/`attemptsRemaining` is observable by the partner; and
- replay/reconnect/DO eviction cannot restore attempts.

Include unit and Durable Object lifecycle tests, including eviction/rehydration between each wrong submission and concurrent duplicate submissions.

### 8.7 Optional upstream improvements — nice to have, not blocking

- **Connection status in the instance store.** Mirroring link/realm status (connecting, reconnecting, attach-failed with reason) into the client-owned store would let partners render reconnect UX without subclassing `PartnerBridgeClient` for protected hooks (4.2, 7.4).
- **Wallet-side pushed-claim confirmation.** The production wallet should require a user tap before acting on a pushed request. With push restricted to mobile-connected accounts (5.6) this is no longer load-bearing for SDK correctness, but remains the right wallet behavior.

No new result-hydration helper is required: the installed Nice Action domain already exposes `hydrateResultPayload(...)` and the SDK will use it directly (section 10).

### 8.8 Version and deployment order

1. Implement and test cancellation, active-wallet exposure, `expiresAt`, comprehensive reset, instance-scoped store, and PIN-attempt fixes in `mc_backend`.
2. Deploy the compatible backend.
3. Publish new `@meteorwallet/connect-shared` and `@meteorwallet/connect` versions as a maintainer-run release.
4. Update the SDK dependency range to the first versions containing all Phase 0 blockers.
5. Implement and validate the SDK against those exact APIs; do not carry temporary private patches into the published SDK.

If cancellation is intentionally deferred, eager push/QR and simultaneously active legacy buttons must not ship for transaction-capable actions. The only safe fallback would be to create the bridge after the user explicitly selects Meteor Mobile, which does not satisfy the requested immediate behavior.

## 9. NEAR request conversion design

Create one exhaustive converter from `TMCActionRequestUnionExpandedInput<TMCActionRegistry>` to a typed `act_impl_near` request. Keep it independent of the UI and bridge transport.

| SDK action | Shared action | Conversion |
| --- | --- | --- |
| `near::sign_in` | `sign_in` | `target.network`; normalized function-call key |
| `near::sign_in_and_sign_message` | `sign_in_and_sign_message` | sign-in fields; nonce bytes → base64; omit local-only callback; retain state locally |
| `near::sign_out` | `sign_out` | account network; account identifier retained locally for SDK output/removal |
| `near::sign_message` | `sign_message` | message/recipient; nonce bytes → base64; account ID → signer ID; network; retain `state` locally |
| `near::sign_transactions` (any count) | `sign_and_send_transactions` | transaction array and JSON connector actions |
| `near::sign_delegate_actions` | `sign_delegate_actions` | signer ID, network, delegate receiver/actions |
| `near::verify_owner` | `verify_owner` | account network and message |

Use `act_impl_near.action.<id>.request(...).toJsonObject()` for final serialization. Do not hand-construct the Nice Action envelope.

Use the plural `sign_and_send_transactions` for a single transaction as well: it accepts a one-element array, its output is already the `FinalExecutionOutcome[]` the SDK returns, and it removes a conversion branch plus the singular/plural test seam. This is a Phase 2 entry gate: record confirmation from the production mobile-wallet implementation that a one-element plural request has the same approval UX and result semantics as the singular action. The demo already handles both, but it is not the production-app authority. If production differs, restore the one-versus-many split before converter implementation.

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
7. Convert the hydrated typed success output as follows.

| Shared result | Existing SDK result |
| --- | --- |
| `NearAccount[]` | one `IMeteorConnectAccount` with mobile connection config |
| accounts + signed messages | one `IMeteorConnectAccount & { signedMessage }` |
| `null` sign-out | original target `IMeteorConnectAccountIdentifier` |
| signed message strings | `PublicKey`, decoded signature bytes, and locally retained `state` |
| single transaction outcome | one-element `FinalExecutionOutcome[]` |
| transaction outcome array | `FinalExecutionOutcome[]` |
| `signedDelegateActions: string[]` | decoded `SignedDelegate` objects plus canonical delegate hashes |
| verify-owner object | existing `IODappAction_VerifyOwner_Output` |

### 10.1 Sign-in account result

The current `MeteorConnect` model stores one account per sign-in action even though the shared result is an array. Require at least one account and select the first until the public SDK account model is redesigned for multi-account sign-in.

`vNearAccount.publicKey` is optional on the wire, while `IMeteorConnectAccount.publicKeys` is required. When the wallet returns no public key: store an empty `publicKeys` array plus any locally generated function-call key (9.3); never fabricate a key. Add a conversion test for this case and confirm downstream callers tolerate an empty array.

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

## 11. File-level implementation plan

### Phase 0 — upstream safety and identity support

- [ ] Add the partner cancel/abandon action to shared schemas/domain.
- [ ] Implement the authenticated backend cancellation state table and atomic race semantics from 8.1.
- [ ] Add `PartnerBridgeClient.cancel_bridge`.
- [ ] Expose the active paired-wallet verify-key handle after claim.
- [ ] Add server `expiresAt` to bridge-create output and all partner client/store states.
- [ ] Add `reset_partner_identity()` that clears every identity-bound namespace, including paired wallets.
- [ ] Make the partner store instance-scoped and client-owned.
- [ ] Correct PIN attempts to exactly three, persist every failure, and expose authoritative remaining attempts.
- [ ] Optional (8.7): connection status mirrored into the instance store and wallet-side pushed-claim confirmation.
- [ ] Add unit/integration/race tests in `mc_backend`.
- [ ] Deploy backend and publish compatible package versions through the maintainer release process.

### Phase 1 — SDK dependencies and configuration

- [ ] Update `packages/meteor-sdk-v1/package.json` to the compatible connect package versions.
- [ ] Add direct `@nice-code/util` dependency.
- [ ] Add the mobile bridge config types and production constants.
- [ ] Add partner metadata normalization.
- [ ] Add storage adaptation with environment-specific prefixing.
- [ ] Add the process-wide coordinator and injected lease provider: Web Locks for direct same-origin use, storage-backed ticket/fencing protocol for the opaque-origin NEAR Connect executor.
- [ ] Make `MeteorConnect.initialize` fingerprinted/idempotent/coalesced and reject incompatible reconfiguration.
- [ ] Add explicit bridge disposal/reinitialization behavior.
- [ ] Extract/inject the shared NEAR key-store provider while preserving the v1 storage format.
- [ ] Pass actual dApp origin metadata from `meteor-near-connect`.

### Phase 2 — typed request/result adapters

- [ ] Add exhaustive SDK request → `act_impl_near` conversion (plural transactions action for any count, pending wallet-UX confirmation — see section 9).
- [ ] Add nonce/base64 helpers.
- [ ] Complete connector-action conversion and unsupported-action errors.
- [ ] Add function-call-key generation/persistence lifecycle.
- [ ] Add result validation via shape/domain/action checks, `act_impl_near.hydrateResultPayload(...)`, signed `outputHash` comparison, and hydrated Nice Error handling (section 10).
- [ ] Add SDK result conversion for all actions, including missing-`publicKey` sign-in accounts (10.1).
- [ ] Add conversion unit tests before transport integration.

### Phase 3 — partner bridge client

- [ ] Add `MeteorConnectMobileBridgeClient` and `v2_bridge_mobile` types.
- [ ] Construct/initialize the coordinator-owned durable `PartnerBridgeClient` subclass with its instance store and protected connection hooks (7.3–7.4).
- [ ] Implement connection-record schema version/environment/app/partner-ID validation and exact-wallet push targeting (5.5–5.7); no sign-in push.
- [ ] Implement QR/deep-link creation path.
- [ ] Implement push path for mobile-connected accounts with QR/deep-link fallback.
- [ ] Append the partner-secret fragment safely.
- [ ] Implement `MobileBridgeSession`, instance-store subscription, session tokens, and coordinated ownership.
- [ ] Implement PIN submission using authoritative server attempt state and third-wrong terminal behavior (5.1).
- [ ] Implement server-`expiresAt` countdown and the cancel-old-first explicit refresh flow (7.4).
- [ ] Implement completion/result conversion.
- [ ] Implement retry (`disconnect_bridge()` before replacement `create_bridge()`), cancel, disconnect, and stale-event guards.
- [ ] Implement `identity_pin_mismatch` detection, confirmation, comprehensive reset, connection-record invalidation, and re-pair recovery (7.4, 8.4).
- [ ] Implement visibility-regain link verification for the same-device mobile flow (7.4).
- [ ] Store every mandatory mobile routing field, including the exact active wallet handle, on sign-in results and refresh a mismatched targeted account after successful authenticated non-sign-out completion.

### Phase 4 — action arbitration

- [ ] Add prepared-target state to `ExecutableAction`.
- [ ] Start mobile preparation at popup request time for sign-in actions (QR/deep-link bridge only — never push).
- [ ] Reuse the prepared bridge when mobile commits.
- [ ] Cancel mobile before starting v1 web/extension.
- [ ] Treat cancel/claim conflicts deterministically.
- [ ] Make cancellation terminal — after `cancelAction`, `execute()` must refuse to run (7.7).
- [ ] Ensure resolve/reject/account bookkeeping runs once.
- [ ] Implement the phase-dependent popup close/cancel contract, including “continues on phone” after `wallet_action` commitment.
- [ ] Keep contextual v1 account execution unchanged.

### Phase 5 — popup UI

- [ ] Add `meteor-mobile-bridge-panel`.
- [ ] Render it under the **Meteor Mobile** heading.
- [ ] Implement device-adaptive presentation via `isMobile()` — QR primary on desktop; **Open in App** primary with QR-icon toggle on mobile devices (6.1).
- [ ] Render only the mobile panel for actions targeting mobile-connected accounts (6.1.1).
- [ ] Retain the exact current extension/web button handlers and URLs.
- [ ] Render loading, other-tab ownership, QR, deep-link, push status, authoritative PIN attempts, action, expiry countdown/refresh, reconnect, identity-reset confirmation, error, and retry states.
- [ ] Keep mobile UI visible after target commitment.
- [ ] Add mobile icons to executing/continue screens.
- [ ] Replace the hard-coded old request-ID QR task.
- [ ] Make the modal responsive and internally scrollable.
- [ ] Add accessibility labels/live regions and keyboard-focus behavior.
- [ ] Fix controller/store/listener cleanup.

### Phase 6 — validation and rollout

- [ ] Run SDK type check and build.
- [ ] Run all MeteorConnect unit tests.
- [ ] Add browser UI tests and local backend integration tests.
- [ ] Test against the real mobile dev build and production-like backend.
- [ ] Run web/extension regression matrix.
- [ ] Inspect ESM/CJS bundles and package tarball contents.
- [ ] Update SDK and MeteorConnect documentation.
- [ ] Release behind a configurable mobile-enabled flag if production mobile rollout needs staging.

## 12. Test plan

### 12.1 Unit tests

Request conversion:

- every `MCNearActions` ID maps to the expected `act_impl_near` ID;
- mainnet/testnet and signer IDs are preserved;
- nonce base64 round-trip;
- one and many transactions both produce `sign_and_send_transactions` with the right array shape;
- every supported NEAR action serializes without bigint, class instance, or raw byte leakage;
- deprecated contract input normalizes correctly;
- generated access-key private material never appears in serialized request data.
- the shared key-store provider reads existing v1 `_meteor_wallet` entries unchanged;
- key persistence failure produces `local_key_persistence_failed` and no falsely usable connection record.

Result conversion:

- every shared success output maps to the current SDK type;
- signed message key/signature/state conversion;
- one/many transaction result normalization;
- sign-in accounts without a wire `publicKey` convert per 10.1;
- signed delegate Borsh decode and canonical hash;
- sign-out returns/removes the original account identifier;
- mismatched domain/action ID is rejected;
- malformed output is rejected by `hydrateResultPayload`;
- mismatched signed wire versus recomputed `outputHash` is rejected;
- non-`ok` wire results hydrate to Nice Errors and reject the SDK action;
- invalid wallet result signature is rejected.

Session lifecycle:

- initialization is coalesced;
- repeated initialization with an identical fingerprint is a no-op, while a different backend/storage/app fingerprint is rejected;
- storage prefix remains stable across reload;
- dev/prod backend storage is isolated;
- incomplete, wrong-environment, wrong-app, or old-partner-identity account records never push and instead require QR/re-pair;
- successful QR re-pair refreshes the targeted account connection record; sign-out removes rather than refreshes it;
- sign-in and non-mobile-contextual actions never call `request_action_via_push`;
- a mobile-connected account uses exactly one `request_action_via_push` call with its stored verify key;
- every push failure retains QR/deep link;
- PIN verification progresses to wallet action;
- wrong PIN on attempt 1 or 2 stays retryable using server-authoritative remaining attempts;
- correct PIN on attempt 3 succeeds; third incorrect PIN is terminal;
- local optimistic PIN state reconciles to a differing server count;
- countdown uses absolute server `expiresAt` and recomputes after tab suspension;
- refresh never replaces a visible QR until cancellation/expiry proves the old bridge non-executable;
- cancel losing to claim keeps the old session and creates no replacement bridge;
- `identity_pin_mismatch` produces confirmation, comprehensive reset, routing-record invalidation, and re-pair—not a spinner or stale push;
- two clients in one JavaScript realm have independent client-owned stores;
- two dApp tabs—including opaque-origin NEAR Connect executors coordinating through selector storage—cannot simultaneously initialize/mutate the shared identity or create bridges; fencing prevents a stale owner mutation and expiry permits crash recovery;
- completed state unsubscribes and resolves once;
- retry ignores prior-session store events;
- pre-claim and PIN-screen close cancel safely without clearing pairings;
- close during `wallet_action` never reports cancellation or starts legacy execution and communicates that the request continues on the phone.

Action arbitration:

- web click cancels prepared bridge before existing v1 execution;
- extension click does the same;
- wallet claim first commits mobile;
- cancel/claim race never starts both target clients;
- cancellation timeout/unknown result never authorizes legacy execution;
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
- cancel before claim prevents claim;
- simultaneous cancel/claim has one terminal winner;
- cancel during wallet verification terminates the wallet PIN flow;
- cancel after `wallet_action` commitment returns incompatible status and cannot authorize legacy execution;
- PIN attempt 1/2 failures persist across DO eviction/rehydration, a correct third attempt succeeds, and an incorrect third attempt fails terminally;
- concurrent/duplicate PIN submissions cannot exceed or reset the authoritative attempt state;
- create/push outputs expose the configured absolute `expiresAt`;
- expired bridge produces a retryable UI state using server time (force expiry rather than waiting for the dev TTL);
- comprehensive identity reset removes separately prefixed paired-wallet data and provisions a clean identity;
- WebSocket drop/reconnect continues realm state and result delivery.

### 12.3 Real device tests

Android and iOS where supported:

- scan production/dev QR scheme;
- same-device **Open in App** deep link from a mobile browser, including: leave to the wallet, complete the action, return to the (previously backgrounded) browser tab, and receive the result after the visibility-regain link check (7.4);
- mobile-browser layout shows **Open in App** as primary with the QR reachable via the toggle;
- first pairing and PIN, including a wrong attempt and the attempts-exceeded terminal path;
- foreground push (mobile-connected account);
- background notification tap;
- killed/cold-start notification tap;
- denied notification permission → QR/deep-link fallback;
- missing/stale token → QR/deep-link fallback;
- stale/revoked partner trust → QR and re-pair;
- mobile completion returns each NEAR action output to the dApp.

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
- confirm one bundled copy of `@meteorwallet/connect-shared`/NiceCode domains, no unintended import/use of the deprecated package-global partner store, and one client-owned store per constructed client;
- confirm Web Crypto and WebSocket references are runtime-safe and not evaluated during SSR import;
- confirm `frontend_env` is not relied upon for the production URL;
- build both ESM and CJS outputs;
- test the ESM output in the NEAR Connect sandbox;
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

- [ ] Partner secret appears only in the deep-link fragment and in memory required by the bridge client.
- [ ] Partner secret is absent from query strings, logs, analytics, error text, and persisted account data.
- [ ] PIN is never logged or persisted by the SDK/browser. Backend retention is limited to the expiring bridge state required for verification and is deleted with bridge cleanup.
- [ ] Pending access-key private key never crosses the bridge.
- [ ] Wallet result must have a valid identity signature.
- [ ] Nice Action result must hydrate against the expected domain/action schema.
- [ ] Hydrated recomputed `outputHash` must equal the signed serialized `outputHash`.
- [ ] The selected wallet is addressed only by its verify-key handle; `walletPerId` remains backend-only.
- [ ] Push routing requires matching environment, app, partner identity, and exact wallet handle.
- [ ] Partner origin metadata identifies the real dApp, not the executor iframe.
- [ ] Deep-link button uses `noopener`/`noreferrer` where browser navigation creates a new context.
- [ ] No mobile error silently falls through to an unsafe duplicate legacy execution.
- [ ] Cancel-versus-claim is resolved by backend state, not timing assumptions in the UI.
- [ ] Development and production identities/backends are storage-isolated.
- [ ] Cross-tab lease/ticket records contain only random ownership, ordering, heartbeat, and expiry metadata—never partner secrets, PINs, wallet keys, or access-key material.
- [ ] Identity reset requires confirmation, clears all paired-wallet state, and invalidates old partner-identity bindings.

## 15. Observability and error handling

Add bridge logs through `MeteorLogger` using phase and bridge-safe identifiers only. Never log the full QR value.

Useful events:

- partner initialized/restored;
- ownership lease acquired/contended/recovered (random owner correlation only);
- bridge creation started/succeeded/failed;
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
- push unavailable but QR usable;
- invalid PIN, retry in same session, with remaining attempts;
- PIN attempts exceeded — terminal for this bridge, create a new QR and re-pair;
- bridge nearing expiry, explicitly refresh the mobile code; or expired bridge, create a new QR;
- connection reconnecting;
- another tab owns the active Meteor Mobile request;
- identity pin mismatch — terminal for the identity; confirm comprehensive reset and re-pair (never an indefinite spinner);
- mobile already committed — closing the popup does not cancel the phone action;
- local function-call-key persistence failed after wallet success — partial success requiring retry/revocation guidance;
- security validation failure, terminal;
- target race resolved to mobile, do not open legacy wallet.

## 16. Documentation updates

Update:

- `packages/meteor-sdk-v1/src/MeteorConnect/Readme.md` with architecture and configuration;
- root `readme.md` with mobile bridge capability and backend configuration;
- public API docs for mobile config/connection type;
- NEAR Connect executor notes explaining partner metadata origin;
- test/demo instructions for first QR pairing and subsequent push;
- migration note that the old unimplemented request-ID v2 target IDs are replaced by `v2_bridge_mobile`.

Document that:

- push happens only for accounts that signed in through the mobile wallet; sign-in always presents QR/deep-link;
- push is best-effort and QR/deep-link is always the fallback;
- notification delivery is not action approval;
- first pairing requires a 4-digit PIN with a 3-attempt limit; exceeding it requires a fresh QR;
- PIN attempts are server-authoritative and the third incorrect submission is terminal;
- on a mobile-device browser the primary affordance is **Open in App**, with the QR available via a toggle;
- an account remains associated with the wallet target through which it signed in;
- mobile routing records are bound to backend environment, app, partner identity, and exact wallet handle;
- only one same-origin tab/storage namespace may own an active mobile bridge request;
- a visible QR is never silently rotated near expiry; refresh cancels the old bridge first;
- clearing site storage resets the durable partner identity and requires re-pairing.

## 17. Acceptance criteria

Implementation is complete only when all of the following are true:

1. A sign-in prompt immediately displays a **Meteor Mobile** loading state and then, on desktop, a real scannable production/dev QR; on a mobile-device browser, a working **Open in App** deep-link button with the QR reachable via the toggle.
2. The QR/deep link opens the new mobile app with the bridge ID and partner secret parsed correctly.
3. First-time pairing reaches a 4-digit PIN UI and resolves the original SDK promise. Attempts 1/2 can retry, a correct third attempt succeeds, and an incorrect third attempt is terminal using persisted server-authoritative state.
4. An action targeting a mobile-connected account pushes only when schema version, environment, app, partner identity, and exact wallet handle match; otherwise it uses QR/re-pair. Sign-in never pushes, and every push failure retains the same QR/deep-link bridge.
5. Foreground, background-tap, and cold-start push flows complete on a real device, and the same-device **Open in App** flow delivers the result after returning to the backgrounded browser tab.
6. All currently exposed NEAR actions use `act_impl_near`, hydrate signed results through the domain API, verify the recomputed output hash, and return the existing SDK public output shapes.
7. Mobile sign-in writes a complete `v2_bridge_mobile` connection record with schema version, environment ID, app ID, partner client ID, and exact active wallet verify key; it never writes a partial push-capable record. A later QR re-pair refreshes the targeted account after successful non-sign-out completion.
8. Selecting Web App or Chrome Extension waits for confirmed backend cancellation before running unchanged v1 code. Unknown/failed cancellation never authorizes legacy execution.
9. A claim/cancel/complete race has exactly one backend-authoritative winner, cannot produce two broadcasts, and a cancelled `ExecutableAction` can never execute afterwards.
10. The partner store is client-owned; two clients in one realm do not contaminate each other, while the coordinator/lease prevents concurrent mutation of one durable identity across instances or tabs and recovers after owner crash.
11. Popup close follows the phase contract: pre-action states cancel safely, while close after `wallet_action` commitment never claims cancellation or opens legacy and clearly states that the phone request continues.
12. Countdown uses server `expiresAt`; refresh never rotates a visible QR until old-bridge cancellation/expiry is terminal, and a claim winning refresh keeps the original session.
13. `identity_pin_mismatch` offers a confirmed comprehensive reset that clears all identity/pairing namespaces, invalidates old routing bindings, provisions a new identity, and requires re-pair instead of hanging or using stale push state.
14. Generated function-call private keys stay local, use the shared v1-compatible key-store provider, and a post-wallet persistence failure returns the documented partial-success error without a false usable account record.
15. Existing web/extension behavior, URLs, stored keys, and contextual routing pass the full regression matrix.
16. Retry, expiry, reconnect, push failure, ownership contention, and terminal cleanup remove listeners/sockets/leases without unintentionally deleting pairings.
17. No partner secret, PIN, or private key appears in logs, server-visible URLs, analytics, error payloads, or persisted account metadata.
18. SDK type check, build, unit tests, connect/backend integration tests, packaging checks, and real-device tests all pass against the released compatible packages/backend.

## 18. Key risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| no backend cancel for eager bridge | duplicate transactions | implement Phase 0 cancel action before release |
| wallet auto-claims pushed bridges without a user tap | involuntary mobile commitment locks the user out of their chosen target | push only for mobile-connected accounts (5.6); sign-in is QR/deep-link only, so a claim always reflects user intent |
| global `PartnerBridgeStore` | same-page clients overwrite each other | Phase 0 client-owned store; coordinator-owned client; session-token stale-event guards |
| concurrent tabs/instances share one durable identity | key/client ID corruption or competing bridges | injected lease provider: Web Locks for direct use; selector-storage ticket/fencing protocol for opaque-origin NEAR Connect; hold through initialization/session |
| multiple paired wallets | push sent to wrong device | route only by the exact verify key stored on the account connection; no heuristics, no fan-out |
| PIN attempts are unpersisted/currently fail on call 4 | limit can reset after DO eviction and UI/server disagree | Phase 0 exactly-three atomic persistence; authoritative remaining-attempt state; eviction/concurrency tests |
| lazy expiry and client-hard-coded TTL | user scans a dead QR or SDK diverges from backend config | expose absolute server `expiresAt`; recompute after suspension; force time in tests |
| automatic QR rotation near expiry | camera claims an old bridge while UI displays a new one | explicit refresh; authenticated cancel-old-first; create only after terminal non-executable result |
| no connection status in `PartnerBridgeStore` | reconnects and attach failures are invisible; `identity_pin_mismatch` hangs forever | subclass the protected hooks (7.4); dedicated reset-and-re-pair recovery state |
| mobile browser suspends WS while user is in the wallet app | same-device flow appears stuck on return | visibility-regain link verification and idempotent re-dial |
| unstable/mismatched partner storage identity | push unavailable or sent using dev/old trust context | durable caller storage, fingerprinted initialization, environment/app/partner-ID account binding |
| base `reset_client()` leaves prefixed paired wallets | stale local wallet records and `link_not_found` push attempts | comprehensive partner reset clearing all namespaces plus routing-record invalidation |
| wrong iframe origin metadata | misleading wallet approval screen | pass `window.selector.location`/explicit metadata |
| omitted access-key public key | invalid shared action or unusable local key | generate locally, send public only, persist private only after success |
| wallet succeeds but local private-key persistence fails | orphaned on-chain access key and false successful local state | shared injected key store; explicit partial-success error; no connection/key metadata stored as usable |
| wallet returns accounts without a public key | required `publicKeys` field cannot be populated | defined empty-array conversion (10.1) with tests |
| delegate result shape mismatch | breaks NEAR Connect callers | decode signed delegates and compute canonical hashes |
| popup fixed height | clipped QR/PIN controls | responsive container and internal scrolling |
| bundle growth/duplicate domains | load/runtime problems | bundle analysis, dedupe verification, ESM/CJS smoke tests |
| push delivery interpreted as approval | premature SDK resolution | resolve only from signed `completed` bridge result |
| manually rebuilding Nice Action output/errors | schema drift or incorrect Nice Error behavior | use `act_impl_near.hydrateResultPayload`, verify expected ID and recomputed signed output hash |
| stale push/expired bridge | confusing or unsafe action | backend TTL, terminal failed state, explicit QR retry |
| cancelled action executes later | duplicate/unwanted broadcast | terminal cancelled state in `ExecutableAction` (7.7) |
| popup closes after mobile action starts | caller believes action cancelled while phone may broadcast | phase-specific close contract; never authorize legacy; communicate that mobile continues |

## 19. Recommended implementation order summary

1. Complete every Phase 0 upstream blocker: cancellation, active-wallet exposure, `expiresAt`, comprehensive reset, instance-scoped store, and exactly-three persisted PIN attempts.
2. Deploy/publish the compatible backend and packages, then lock the SDK to those APIs.
3. Record the production-wallet decision for one-element plural transaction UX.
4. Build/test pure NEAR request/result converters, domain hydration/output-hash checks, and the shared v1-compatible key-store provider.
5. Add fingerprinted configuration/storage, environment/identity-bound connection records, the process coordinator, and cross-tab ownership lease.
6. Add the coordinator-owned mobile client and isolated session state machine with authoritative PIN, expiry, refresh, reset, reconnect, and stale-event handling.
7. Add backend-authoritative target arbitration and phase-specific cancellation/close behavior to `ExecutableAction`.
8. Add the device-adaptive Meteor Mobile popup panel (QR-first on desktop, Open-in-App-first on mobile devices) while leaving v1 controls intact.
9. Validate QR/PIN/cancel/expiry/reset/concurrency end to end against the local backend.
10. Validate contextual push and same-device deep-link flows on real Android/iOS devices.
11. Run the complete legacy regression, bundle/package checks, and migration tests.
12. Update docs and hand release steps to maintainers.
