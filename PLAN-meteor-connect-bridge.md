# Meteor Connect Mobile Bridge Integration Plan

**Status:** Proposed — implementation has not started  
**Last reviewed:** 2026-07-21  
**Primary scope:** `packages/meteor-sdk-v1/src/MeteorConnect` and its Meteor Connect popup  
**Reference implementation:** `../mc_backend/packages/demo-partner-web`, `../mc_backend/packages/demo-wallet-expo`, `../mc_backend/packages/meteor-connect-client`, and `../mc_backend/packages/meteor-connect-shared`

## 1. Objective

Add the new Meteor mobile wallet as a first-class MeteorConnect execution path by using the published `@meteorwallet/connect` and `@meteorwallet/connect-shared` packages.

For a mobile-eligible NEAR request, the SDK must:

1. Package the request as the matching typed `act_impl_near` Nice Action.
2. Create a Meteor bridge as soon as the action prompt starts.
3. Render the production Meteor mobile deep link as a QR code in a section labelled **Meteor Mobile**.
4. Keep that QR available as the fallback even when a push is attempted.
5. If the partner has already paired with a compatible Meteor mobile wallet, create the bridge through `request_action_via_push` so the backend attempts an immediate push notification.
6. Handle first-time QR pairing, including the mandatory PIN-verification step.
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
- Automatic push attempt for a known, compatible paired wallet.
- QR, deep-link, push outcome, PIN, progress, retry, expiry/failure, and completion states in the Lit popup.
- Correct result conversion back to the existing `@meteorwallet/sdk` public types.
- Regression coverage for current web and extension behavior.
- Small upstream additions to the bridge packages/protocol that are required to make eager mobile preparation safe.

### Out of scope

- Replacing `MeteorConnectV1Client`, `MeteorWallet`, or `MeteorPostMessenger`.
- Changing the existing Chrome Web Store URL or legacy web wallet URL.
- Implementing push registration or notification handling in the SDK. Those are wallet responsibilities and already exist in the Expo reference flow.
- Rebuilding the main mobile wallet action-resolution screens. The SDK will emit the shared `act_impl_near` contract the wallet already consumes.
- Supporting multiple simultaneous MeteorConnect action popups. The current SDK UI is singleton-based, and `PartnerBridgeStore` is also a package-level singleton.
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

On completion, the client has already:

- decrypted the wallet result end to end;
- verified the wallet identity signature when one is present; and
- placed the Nice Action result JSON in `bridge.actionResult.result`.

The SDK must still hydrate that Nice Action result, validate that it matches the expected NEAR action, and convert its output to the existing SDK type.

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

The popup therefore needs a first-pairing state with:

- a PIN input;
- an explicit Verify/Continue action;
- pending and validation error states; and
- an option to keep/show the QR while verification is pending.

### 5.2 Eager mobile preparation can race legacy execution

Creating the bridge and attempting push before a user clicks Web App or Chrome Extension means two independent wallet paths temporarily possess the same action. Today the bridge protocol has no partner-side cancel/abandon operation.

Without cancellation, this sequence is possible:

1. SDK creates bridge and sends a push.
2. User clicks Web App.
3. The web wallet executes the transaction.
4. The mobile wallet opens the still-live bridge and executes the same transaction again.

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

Selection policy:

1. For a mobile-connected account, use the wallet verify key stored in that account's mobile connection config.
2. For sign-in, filter to the configured Meteor mobile app ID and choose the most recently paired wallet.
3. If no compatible wallet is available, create a QR bridge without push.
4. If push to the selected wallet is not delivered, keep that bridge and show its QR; do not create another bridge automatically.

The preferred library enhancement is to expose the active paired-wallet record after claim, so the SDK can persist the exact verify key without relying on a “newest `pairedAt`” inference.

## 6. Recommended user experience

### 6.1 Initial sign-in popup

The existing top-level heading and legacy buttons remain:

```text
Choose your wallet
[Chrome Extension] [Web App] [Dev Web when applicable]

Meteor Mobile
[QR / status panel]

Don't have a wallet?
[Get Meteor Wallet]
```

The exact existing callbacks remain:

- Chrome Extension → `actionController.executeAction("v1_ext")`
- Web App → `actionController.executeAction("v1_web")`
- Dev Web → `actionController.executeAction("v1_web_localhost")`

The mobile panel starts in a loading state immediately while partner initialization and bridge creation run.

### 6.2 Mobile panel states

| State | Popup behavior |
| --- | --- |
| initializing | “Preparing Meteor Mobile…”; legacy buttons remain enabled |
| waiting for wallet, no paired target | show QR and “Open Meteor Mobile” deep-link button |
| push delivered | show “Sent to Meteor Mobile” plus the same QR fallback |
| push not delivered | show a concise reason and the same QR fallback |
| wallet verification | lock execution to mobile; show PIN input and optionally retain QR |
| wallet action | show “Complete this request in Meteor Mobile” |
| reconnecting | keep current content and show a non-destructive connection warning |
| completed | resolve the SDK action and let the existing popup cleanup run |
| failed/expired before claim | keep legacy options; offer “Create a new mobile QR” |
| failed after mobile commitment | show the mobile error and reject the action |

On a same-device browser, the deep-link button is essential even though the QR remains the canonical fallback.

### 6.3 Target commitment

The first committed execution path wins:

- Clicking a legacy button asks the backend to cancel the prepared mobile bridge before opening the legacy wallet.
- A wallet claim (`wallet_verification` or `wallet_action`) commits the action to mobile and disables/hides legacy execution controls for that action.
- If cancel loses a race because the wallet already claimed the bridge, mobile wins and the SDK must not launch web/extension.
- After commitment, the same action cannot be executed through another target.

This preserves the old button behavior until a mobile wallet actually claims the request while preventing double signing.

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
  meteorAppId: EMeteorAppId.meteor_wallet_mobile | EMeteorAppId.meteor_wallet_mobile_dev;
  walletVerifyPublicKey?: string;
}
```

The `walletVerifyPublicKey` is an opaque routing handle, not an account key. It must never be presented as the NEAR account public key.

Remove `MeteorConnectV2MessengerClient` from the active client map after all references and tests move to the bridge client. The old stub has no working behavior to preserve.

### 7.2 Configuration

Extend `MeteorConnect` configuration without breaking existing constructors:

```ts
interface IMeteorConnectMobileBridgeConfig {
  enabled?: boolean; // default true in a browser
  backendUrl?: string; // default https://mc.meteorwallet.app
  meteorAppId?: EMeteorAppId.meteor_wallet_mobile | EMeteorAppId.meteor_wallet_mobile_dev;
  partnerMetadata?: {
    name?: string;
    description?: string;
    iconUrl?: string;
    originUrl?: string;
  };
}
```

Recommended defaults:

- production backend: `https://mc.meteorwallet.app`;
- production app ID unless `isDev` or an explicit config selects dev;
- origin: configured `originUrl`, otherwise `window.location.origin`;
- name: configured name, otherwise the origin hostname;
- bridge disabled during SSR or when required Web Crypto/WebSocket APIs are unavailable.

Do not rely on `frontend_env.METEOR_BRIDGE_BACKEND_URL` inside the distributable SDK. That helper expects build-time/global injection and can be `undefined` for third-party consumers.

Update `packages/meteor-near-connect/src/meteor-near-connect/nearConnectExecutor.ts` to pass the real dApp location from `window.selector.location` rather than identifying the sandboxed executor iframe as the partner origin. If NEAR Connect later exposes dApp manifest name/icon metadata, pass it through as well.

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

Initialize the partner client exactly once per `MeteorConnect` instance and coalesce concurrent initialization calls. `getMeteorConnect()` in the NEAR Connect executor currently calls `initialize` repeatedly, so the SDK's initialization must become idempotent rather than recreating the bridge crypto runtime for every wallet API call.

### 7.4 Mobile bridge session object

`MobileBridgeSession` should isolate the global `PartnerBridgeStore` behind an SDK-local, action-specific state machine.

Responsibilities:

- hold the expected SDK request and corresponding `act_impl_near` request;
- subscribe to `PartnerBridgeStore` and unsubscribe deterministically;
- expose a read-only UI snapshot and change listener;
- create the bridge through QR or push;
- expose the finalized QR/deep link without logging its secret;
- submit the PIN;
- mark the session committed when the wallet claims;
- hydrate and validate the completed Nice Action result;
- convert it to the existing SDK output type;
- support retry after pre-claim failure;
- cancel/abandon the backend bridge;
- disconnect the local bridge on teardown while retaining partner identity and pairings.

Only one active session is allowed. Starting a new action must finish or cancel the old one before rebinding the singleton partner store.

Suggested local phases:

```ts
type TMobileBridgePhase =
  | "initializing"
  | "creating_bridge"
  | "waiting_for_wallet"
  | "wallet_verification"
  | "wallet_action"
  | "completed"
  | "failed"
  | "cancelled";
```

Keep push delivery as orthogonal state (`not_attempted | delivered | not_delivered`) because it does not replace the bridge lifecycle.

### 7.5 Bridge preparation algorithm

For a mobile-eligible request:

1. Ensure `PartnerBridgeClient` is initialized.
2. Convert the expanded SDK action to one typed `act_impl_near` request JSON object.
3. Determine the configured app ID (`meteor_wallet_mobile` or dev).
4. Determine a push target:
   - exact `walletVerifyPublicKey` from a mobile account connection; otherwise
   - most recent paired wallet with the configured app ID for sign-in; otherwise none.
5. If there is a target, call `request_action_via_push` with that key, the action request, and `[configuredAppId]`.
6. If there is no target, call `create_bridge` with the action request and `[configuredAppId]`.
7. Read `bridge.info.walletLinks` from `PartnerBridgeStore` and select the entry matching the configured app ID.
8. Append `#partnerSecret=...` using `encodeURIComponent`.
9. Publish the same full deep link to the QR renderer and same-device open button.
10. Continue watching the store until completion, cancellation, expiry/failure, or UI teardown.

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
- invoke mobile teardown from `cancelAction` and popup cleanup;
- ignore late events from a superseded session.

Do not implement this as `Promise.race` between fully active mobile and legacy executions. A race resolves the caller but does not prevent the losing wallet from broadcasting a transaction.

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

- numeric/text input matching backend PIN format without coercing away leading zeroes;
- explicit submit button rather than verifying on each keystroke;
- disabled state while verification is running;
- errors shown without discarding the QR/session;
- no PIN logging.

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
- accepted while the bridge is still cancellable;
- atomically transitions the bridge out of a claimable/executable state;
- produces a terminal realm update for partner and wallet;
- idempotent if already cancelled;
- rejects with an incompatible-status result when a wallet already committed, allowing the SDK to declare mobile the winner;
- does not delete the durable partner↔wallet pairing or push token.

Add backend race tests for cancel-versus-claim and cancel-versus-complete.

### 8.2 Expose the active paired-wallet handle — strongly recommended

After `initializePartnerVerified`, expose the exact current `TPartnerPairedWallet` through a safe getter or the partner store/session state. This lets the SDK store the correct `walletVerifyPublicKey` on the returned mobile account connection.

Do not expose `walletPerId`; the verify key remains the intended partner-facing routing handle.

### 8.3 Version and deployment order

1. Implement and test shared/backend/client additions in `mc_backend`.
2. Deploy the compatible backend.
3. Publish new `@meteorwallet/connect-shared` and `@meteorwallet/connect` versions as a maintainer-run release.
4. Update the SDK dependency range to the first version containing cancellation and active-wallet exposure.
5. Implement and validate the SDK against those exact APIs.

If cancellation is intentionally deferred, eager push/QR and simultaneously active legacy buttons must not ship for transaction-capable actions. The only safe fallback would be to create the bridge after the user explicitly selects Meteor Mobile, which does not satisfy the requested immediate behavior.

## 9. NEAR request conversion design

Create one exhaustive converter from `TMCActionRequestUnionExpandedInput<TMCActionRegistry>` to a typed `act_impl_near` request. Keep it independent of the UI and bridge transport.

| SDK action | Shared action | Conversion |
| --- | --- | --- |
| `near::sign_in` | `sign_in` | `target.network`; normalized function-call key |
| `near::sign_in_and_sign_message` | `sign_in_and_sign_message` | sign-in fields; nonce bytes → base64; omit local-only callback; retain state locally |
| `near::sign_out` | `sign_out` | account network; account identifier retained locally for SDK output/removal |
| `near::sign_message` | `sign_message` | message/recipient; nonce bytes → base64; account ID → signer ID; network; retain `state` locally |
| `near::sign_transactions` with one tx | `sign_and_send_transaction` | receiver and JSON connector actions |
| `near::sign_transactions` with multiple txs | `sign_and_send_transactions` | transaction array and JSON connector actions |
| `near::sign_delegate_actions` | `sign_delegate_actions` | signer ID, network, delegate receiver/actions |
| `near::verify_owner` | `verify_owner` | account network and message |

Use `act_impl_near.action.<id>.request(...).toJsonObject()` for final serialization. Do not hand-construct the Nice Action envelope.

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

## 10. NEAR result conversion design

On `EPartnerBridgeStep.completed`:

1. Require `signatureVerified === true`. Treat a missing/invalid wallet signature as a security error, not a warning.
2. Call `act_impl_near.hydrateResultPayload(...)`.
3. Verify the result action ID matches the request action selected by the converter.
4. If `result.ok` is false, reject using the hydrated Nice Error.
5. Convert the typed output as follows.

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

The stored connection must be `v2_bridge_mobile` and include the configured app ID plus exact paired-wallet verify key when available. This is what makes later account-targeted actions choose push to the same wallet.

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
- [ ] Implement the backend state transition and authentication.
- [ ] Add `PartnerBridgeClient.cancel_bridge`.
- [ ] Expose the active paired-wallet verify-key handle after claim.
- [ ] Add unit/integration/race tests in `mc_backend`.
- [ ] Deploy backend and publish compatible package versions through the maintainer release process.

### Phase 1 — SDK dependencies and configuration

- [ ] Update `packages/meteor-sdk-v1/package.json` to the compatible connect package versions.
- [ ] Add direct `@nice-code/util` dependency.
- [ ] Add the mobile bridge config types and production constants.
- [ ] Add partner metadata normalization.
- [ ] Add storage adaptation with environment-specific prefixing.
- [ ] Make `MeteorConnect.initialize` idempotent/coalesced.
- [ ] Pass actual dApp origin metadata from `meteor-near-connect`.

### Phase 2 — typed request/result adapters

- [ ] Add exhaustive SDK request → `act_impl_near` conversion.
- [ ] Add nonce/base64 helpers.
- [ ] Complete connector-action conversion and unsupported-action errors.
- [ ] Add function-call-key generation/persistence lifecycle.
- [ ] Add Nice Action result hydration and ID validation.
- [ ] Add SDK result conversion for all actions.
- [ ] Add conversion unit tests before transport integration.

### Phase 3 — partner bridge client

- [ ] Add `MeteorConnectMobileBridgeClient` and `v2_bridge_mobile` types.
- [ ] Construct/initialize one durable `PartnerBridgeClient` per MeteorConnect instance.
- [ ] Implement paired-wallet selection.
- [ ] Implement QR creation path.
- [ ] Implement push-first path with QR fallback.
- [ ] Append the partner-secret fragment safely.
- [ ] Implement `MobileBridgeSession` and global-store isolation.
- [ ] Implement PIN submission.
- [ ] Implement completion/result conversion.
- [ ] Implement retry, cancel, disconnect, and stale-event guards.
- [ ] Store the exact mobile wallet routing handle on sign-in results.

### Phase 4 — action arbitration

- [ ] Add prepared-target state to `ExecutableAction`.
- [ ] Start mobile preparation at popup request time for sign-in actions.
- [ ] Reuse the prepared bridge when mobile commits.
- [ ] Cancel mobile before starting v1 web/extension.
- [ ] Treat cancel/claim conflicts deterministically.
- [ ] Ensure resolve/reject/account bookkeeping runs once.
- [ ] Connect popup close/cancel to bridge cancellation and local teardown.
- [ ] Keep contextual v1 account execution unchanged.

### Phase 5 — popup UI

- [ ] Add `meteor-mobile-bridge-panel`.
- [ ] Render it under the **Meteor Mobile** heading.
- [ ] Retain the exact current extension/web button handlers and URLs.
- [ ] Render loading, QR, deep-link, push status, PIN, action, reconnect, error, and retry states.
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
- one versus many transactions select the correct shared action;
- every supported NEAR action serializes without bigint, class instance, or raw byte leakage;
- deprecated contract input normalizes correctly;
- generated access-key private material never appears in serialized request data.

Result conversion:

- every shared success output maps to the current SDK type;
- signed message key/signature/state conversion;
- one/many transaction result normalization;
- signed delegate Borsh decode and canonical hash;
- sign-out returns/removes the original account identifier;
- mismatched domain/action ID is rejected;
- malformed output is rejected by hydration;
- Nice Action errors reject the SDK action;
- invalid wallet result signature is rejected.

Session lifecycle:

- initialization is coalesced;
- storage prefix remains stable across reload;
- dev/prod backend storage is isolated;
- no paired wallet uses `create_bridge`;
- paired wallet uses exactly one `request_action_via_push` call;
- every push failure retains QR;
- PIN verification progresses to wallet action;
- completed state unsubscribes and resolves once;
- retry ignores prior-session store events;
- close/cancel tears down safely without clearing pairings.

Action arbitration:

- web click cancels prepared bridge before existing v1 execution;
- extension click does the same;
- wallet claim first commits mobile;
- cancel/claim race never starts both target clients;
- repeated execute calls return the same result;
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
- expired bridge produces a retryable UI state;
- WebSocket drop/reconnect continues realm state and result delivery.

### 12.3 Real device tests

Android and iOS where supported:

- scan production/dev QR scheme;
- same-device “Open Meteor Mobile” deep link;
- first pairing and PIN;
- foreground push;
- background notification tap;
- killed/cold-start notification tap;
- denied notification permission → QR fallback;
- missing/stale token → QR fallback;
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
- confirm one bundled copy of `@meteorwallet/connect-shared`/NiceCode domains and one `PartnerBridgeStore` singleton;
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
- [ ] PIN is never logged or persisted.
- [ ] Pending access-key private key never crosses the bridge.
- [ ] Wallet result must have a valid identity signature.
- [ ] Nice Action result must hydrate against the expected domain/action schema.
- [ ] The selected wallet is addressed only by its verify-key handle; `walletPerId` remains backend-only.
- [ ] Partner origin metadata identifies the real dApp, not the executor iframe.
- [ ] Deep-link button uses `noopener`/`noreferrer` where browser navigation creates a new context.
- [ ] No mobile error silently falls through to an unsafe duplicate legacy execution.
- [ ] Cancel-versus-claim is resolved by backend state, not timing assumptions in the UI.
- [ ] Development and production identities/backends are storage-isolated.

## 15. Observability and error handling

Add bridge logs through `MeteorLogger` using phase and bridge-safe identifiers only. Never log the full QR value.

Useful events:

- partner initialized/restored;
- bridge creation started/succeeded/failed;
- push attempted/delivered/not delivered with reason;
- wallet claimed (without keys/secrets);
- PIN verification started/succeeded/failed;
- mobile target committed;
- realm reconnect/attach diagnostic;
- wallet result signature validated;
- action completed/cancelled/expired;
- legacy target won and bridge cancellation succeeded.

User-facing errors should distinguish:

- mobile temporarily unavailable while web/extension remain usable;
- push unavailable but QR usable;
- invalid PIN, retry in same session;
- expired bridge, create a new QR;
- connection reconnecting;
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

- push is best-effort and QR is always the fallback;
- notification delivery is not action approval;
- first pairing requires PIN;
- an account remains associated with the wallet target through which it signed in;
- clearing site storage resets the durable partner identity and requires re-pairing.

## 17. Acceptance criteria

Implementation is complete only when all of the following are true:

1. A sign-in prompt immediately displays a **Meteor Mobile** loading state and then a real, scannable production/dev QR.
2. The QR opens the new mobile app with the bridge ID and partner secret parsed correctly.
3. First-time pairing reaches a PIN UI in the SDK, verifies, executes the wallet action, and resolves the original SDK promise.
4. A later request to the same paired mobile wallet attempts push immediately and still displays the QR fallback.
5. Foreground, background-tap, and cold-start push flows complete on a real device.
6. All currently exposed NEAR actions use `act_impl_near` and return the existing SDK public output shapes.
7. Mobile sign-in stores a mobile connection config, and later account actions route to that wallet's verify-key handle.
8. Selecting Web App or Chrome Extension cancels the prepared bridge before running the unchanged v1 path.
9. A wallet claim racing a legacy click has exactly one winner and cannot produce two broadcasts.
10. Existing web/extension behavior and URLs pass the full regression matrix.
11. Popup close, retry, expiry, network reconnect, and push failure clean up listeners/sockets without deleting pairings.
12. No secret, PIN, or private key appears in logs, URLs sent to servers, or persisted account metadata.
13. SDK type check, build, unit tests, connect integration tests, and real-device tests pass.

## 18. Key risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| no backend cancel for eager bridge | duplicate transactions | implement Phase 0 cancel action before release |
| global `PartnerBridgeStore` | cross-action state contamination | enforce one active session, snapshot/token stale events, deterministic unsubscribe |
| multiple paired wallets | push sent to wrong device | exact account routing handle; latest compatible wallet only for sign-in; no fan-out |
| unstable partner storage identity | push never becomes available | durable caller storage, stable environment prefix, idempotent initialization |
| wrong iframe origin metadata | misleading wallet approval screen | pass `window.selector.location`/explicit metadata |
| omitted access-key public key | invalid shared action or unusable local key | generate locally, send public only, persist private only after success |
| delegate result shape mismatch | breaks NEAR Connect callers | decode signed delegates and compute canonical hashes |
| popup fixed height | clipped QR/PIN controls | responsive container and internal scrolling |
| bundle growth/duplicate domains | load/runtime problems | bundle analysis, dedupe verification, ESM/CJS smoke tests |
| push delivery interpreted as approval | premature SDK resolution | resolve only from signed `completed` bridge result |
| stale push/expired bridge | confusing or unsafe action | backend TTL, terminal failed state, explicit QR retry |

## 19. Recommended implementation order summary

1. Add safe bridge cancellation and active-wallet exposure upstream.
2. Build and test pure NEAR request/result converters in the SDK.
3. Add durable partner configuration/storage and the new mobile client.
4. Add the isolated mobile session state machine.
5. Add target arbitration to `ExecutableAction`.
6. Add the Meteor Mobile popup panel and PIN flow while leaving v1 controls intact.
7. Validate local QR/PIN end to end.
8. Validate push on real devices.
9. Run the complete legacy regression and packaging checks.
10. Update docs and hand release steps to maintainers.
