# SDK Plan — Transfer Accounts via Meteor Connect

**Status:** Proposed implementation plan
**Repository:** `meteor_wallet_sdk` — `packages/meteor-sdk-v1/src/MeteorConnect`
**Protocol source of truth:** `@meteorwallet/connect` / `@meteorwallet/connect-shared` **0.7.0** (already installed) and the completed backend implementation in `mc_backend` (`PLAN-account-transfer.md` — phases 1–5b done, audited)
**Reference implementations:** `mc_backend/packages/demo-partner-web` (partner side — the flow we are productizing), `meteor_wallet/web/packages/meteor-frontend` (the first real receiving wallet), `mc_backend/packages/demo-wallet-web` + `demo-wallet-expo` (receiver references)
**Prepared:** 2026-08-04

---

## 1. Objective and scope

Give partner wallet applications a production SDK flow to transfer their users' accounts into Meteor Wallet:

1. **Import/stage** accounts (account ID + mnemonic or private key) into the SDK with validation and normalization.
2. **Store** the staged set so the partner app can build up / review the list before transferring.
3. **Transfer** the accounts through the Meteor Connect bridge backend in a dedicated popup UI that follows the proven `demo-partner-web` flow: encrypt locally → create bridge → QR / open link → PIN verification → reveal decrypt key → signed `{ success }` result.

Receiving wallets, in order: **Meteor Wallet web** (`meteor-frontend`, live now), then **Meteor Mobile** (developed in the `meteor-v2-apps-windows` repo), which already receives regular Meteor Connect actions from this SDK via QR/deep link — the transfer receiver pattern for it is proven in `demo-wallet-expo`.

Out of scope here: any backend or shared-package changes (the protocol is complete and audited in `mc_backend`), and wallet-side receiving code (already implemented in `meteor-frontend`).

---

## 2. Protocol facts this plan builds on (verified against 0.7.0 sources)

These are settled decisions from `mc_backend/PLAN-account-transfer.md` (D1–D9) and the shipped 0.7.0 packages — the SDK must consume them, not re-implement them:

### 2.1 Action contract

- Domain `"meteor_wallet_core"`, action id `"transfer_accounts"` — `act_impl_meteor_wallet_core` (child of root `"meteor_connect"`).
- Input = `vAllAccountsTransferDataEncrypted`:
  ```ts
  {
    formatVersion: 1,
    allAccountsBasicInfo: Array<{ blockchainId: "near"; networkId: "mainnet" | "testnet"; accountId: string }>, // 1..50, no dupes — plaintext "unverified" preview
    encryptedData: { nonce: string; ciphertext: string }, // AES-256-GCM, 12-byte nonce, ciphertext ≤ 350k base64 chars
  }
  ```
- Output = `{ success: boolean }`. **Wallet-authored and unverifiable — a `success: true` must never trigger destructive source-side behavior (e.g. deleting the partner's accounts).**
- All bounds are exported constants (`TRANSFER_ACCOUNTS_MAX_ACCOUNTS = 50`, `TRANSFER_ACCOUNTS_MAX_SECRETS_PER_ACCOUNT = 10`, `TRANSFER_ACCOUNTS_ACCOUNT_ID_PATTERN = /^[a-z0-9._-]+$/`, etc.) — import them, never re-declare.

### 2.2 Crypto profile and the transfer key

- `buildAccountsTransferRequestData({ decrypted })` (connect-shared) does everything: validates the decrypted payload, generates a fresh random AES-256-GCM key, encrypts, and derives `allAccountsBasicInfo` by explicit allowlist. Returns `{ transferKeyString, actionInput }`.
- Key string format: `` `mck1.<43 chars base64url-nopad of 32 key bytes>.<6-char checksum>` `` (`TMeteorConnectKeyString`). Display grouped in 4s; QR content is the raw key string verbatim; wallet-side import strips all whitespace and returns typed failure reasons (never throws).
- **The key must never travel on the bridge, be persisted, be logged, or enter any serializable store.** In `demo-partner-web` it lives only in React `useState` correlated to `partnerRequestId`; `mc_backend` enforces this with a CI script (`scripts/check-key-confinement.ts`) pinning the exact files allowed to mention `transferKeyString`. The SDK adopts the same discipline (§7).

### 2.3 Server-side action policy (automatic — the SDK must align with it, not implement it)

`transfer_accounts` policy: `{ requiresFreshPinVerification: true, requiredWalletCapabilities: [transfer_accounts_v1], delivery: "post_pin_wallet_encrypted" }`. Consequences:

- **Every transfer bridge passes through the PIN stage** (`wallet_verification`) — the trusted-pairing fast path is denied server-side. Our popup will always show PIN entry.
- The action request is **not** in the claim response; it is delivered to the wallet post-PIN as a claimant-encrypted envelope, only while status is `wallet_action`.
- The server **unions** `getServerRequiredWalletCapabilities()` into whatever the partner sends before idempotency-hashing — but the SDK should still send `[...REQUIRED_METEOR_WALLET_CAPABILITIES, transfer_accounts_v1]` explicitly so wallet filtering and `wallet_update_required` failures are accurate.
- `create_bridge` can fail with `invalid_action_request` (400k canonical-JSON cap / schema failure) and `idempotency_conflict` — both need handling.
- `partnerRequestId` must be ≥16 chars and **unguessable** (CSPRNG) — it is a DO-addressing input.

### 2.4 The first receiving wallet (meteor-frontend) — realities to tolerate

- Claims via URL only: `https://<wallet-origin>/bridge_request?bridgeId=<id>#partnerSecret=<secret>` (secret in the **fragment**). **No QR scanner, no push support** — the partner popup must present a scannable QR of that URL and/or an open-link button.
- Identifies as `EMeteorAppId.meteor_bridge_test_web` — **no `meteor_wallet_web` app id exists yet** (explicit in-code TODO). The SDK's transfer `meteorAppIds` must include `meteor_bridge_test_web` until a real id ships.
- Advertises `transfer_accounts_v1`; key entry is a plain input (paste/type); decrypt → on-chain FullAccess access-key verification per secret → import.
- **Never sends a failure result** (`errorResult` unused; no decline button). User rejection, decrypt failure, verification failure, and import failure all look like *silence* to the partner — the failure path is bridge expiry. (The demo wallet, by contrast, declines with `{ success: false }`.)
- Import is **non-atomic** (`Promise.all`, no rollback): a retry after partial failure can hit "already in this Meteor wallet". The SDK flow must therefore be idempotent-friendly and never assume all-or-nothing on the wallet side.

---

## 3. Current SDK state and gap summary

The SDK has **zero** transfer code today. The registry is NEAR-only (`TMCActionDomainId = "near"`), mobile-bridge request/result adapters are hard-coded to `act_impl_near`, capabilities sent to `create_bridge` are the hard-coded base set, and the popup has one container (`meteor-action-ui-container`) with the sign-in/wallet-picker layout. Exact touch points are listed in §8.

What we reuse as-is:

- `PartnerBridgeClient` (0.7.0) — `create_bridge` / `verify_pin` / `cancel_bridge` already accept per-action capabilities; no transfer-specific client APIs exist or are needed.
- `MobileBridgeSession` — its phase machine (`creating_bridge → waiting_for_wallet → wallet_verification → wallet_action → completed|failed|cancelled`) is exactly the transfer lifecycle; `wallet_action` is the authoritative reveal gate.
- `meteor-mobile-bridge-panel` — the QR/countdown/PIN/status UI binds only to `IMobileBridgeSnapshot` and is action-agnostic.
- `MeteorActionUiOverlay` — the 415×556 popup shell is fully action-agnostic (slot-based).

---

## 4. End-to-end flow

```mermaid
sequenceDiagram
    participant P as Partner app (SDK consumer)
    participant S as SDK (staging + popup)
    participant B as Connect backend
    participant W as Meteor Wallet (web / mobile)

    P->>S: stageTransferAccount({ accountId, secretInput }) ×N
    S->>S: validate + normalize → TAccountTransferDataDecrypted, store staged set
    P->>S: createTransferAccountsAction() + promptForExecution()
    S->>S: buildAccountsTransferRequestData() → { transferKeyString, actionInput }
    Note over S: key held in-memory only, bound to partnerRequestId
    S->>B: create_bridge(actionRequest, caps ∪ transfer_accounts_v1, meteorAppIds)
    S-->>P: popup: review summary → QR / Open link (secret in URL fragment)
    W->>B: claim_bridge (capability-checked)
    B-->>S: wallet_verification
    W-->>W: display 4-digit PIN
    S-->>S: popup PIN entry → verify_pin
    B-->>S: wallet_action
    B-->>W: encrypted action envelope (post-PIN)
    S-->>S: popup: "Connection verified" → Reveal decrypt key (text + QR + copy)
    W->>W: user enters/scans mck1 key → decrypt → verify keys on-chain → import
    W->>B: signed { success: boolean }
    B-->>S: E2E-encrypted, signature-verified result
    S->>S: wipe key, resolve action
    S-->>P: TTransferAccountsOutcome
```

---

## 5. Public SDK API

### 5.1 Staging (import) API

New methods on `MeteorConnect` (implementation in a new `MeteorConnect/transfer_accounts/` module):

```ts
// Raw partner input — the SDK owns validation + encoding
interface IStageTransferAccountInput {
  accountId: string;                       // trimmed + lowercased; 2..64; must match shared pattern
  network: "mainnet" | "testnet";
  secretInput: string;                     // mnemonic phrase OR "ed25519:<base58>" private key
  derivationPath?: string;                 // default "m/44'/397'/0'" (NEAR_DEFAULT_DERIVATION_PATH)
}

type TStageResult = { ok: true } | { ok: false; error: string };

meteorConnect.stageTransferAccount(input: IStageTransferAccountInput): Promise<TStageResult>;
meteorConnect.getStagedTransferAccounts(): Promise<TAccountTransferDataDecrypted[]>; // full shape, secrets included — partner-side API
meteorConnect.getStagedTransferAccountSummaries(): Promise<TAccountBasicData[]>;     // safe shape for UI listing
meteorConnect.removeStagedTransferAccount(identifier: { network; accountId }): Promise<void>;
meteorConnect.clearStagedTransferAccounts(): Promise<void>;
```

Validation/encoding rules mirror `demo-partner-web`'s `transfer_accounts_store.ts` exactly (they are proven against the wallet-side decoder):

- Secret type detection: trimmed input starting `ed25519:` → private key (reject embedded whitespace and a bare prefix); otherwise mnemonic with **12 or 24** whitespace-collapsed words.
- Mnemonic encodes as `{ type: "mnemonic", encoding: "utf8_base64", derivationPath, prefixedBase64DataString: "utf8_base64::" + base64(lowercased phrase) }`.
- Private key encodes as `{ type: "private_key", encoding: "near_prefixed_utf8_base64", keyAlgorithm: "ed25519", prefixedBase64DataString: "near_prefixed_utf8_base64::" + base64("ed25519:…") }` — the wallet feeds the decoded `ed25519:<base58>` string straight into `KeyPair.fromString`, so the NEAR prefix must be preserved inside the encoding.
- Re-staging the same `(network, accountId)` replaces the prior entry. `blockchainId` is always `"near"` for v1.
- Enforce shared bounds at staging time (≤50 accounts, secret ≤16 KiB, etc.) so failures happen early with good messages instead of at `create_bridge`.

### 5.2 Transfer action API

```ts
const action = await meteorConnect.createTransferAccountsAction(options?: {
  /** Override the staged set for this transfer (bypasses storage entirely). */
  accounts?: TAccountTransferDataDecrypted[];
});

const outcome = await action.promptForExecution();
// outcome: TTransferAccountsOutcome
type TTransferAccountsOutcome =
  | { status: "imported" }                    // wallet returned signed { success: true }
  | { status: "declined" }                    // wallet returned signed { success: false }
  | { status: "cancelled" }                   // user cancelled before commitment
  | { status: "expired" };                    // bridge expired with no result (meteor-frontend's only failure signal)
```

Internals of `createTransferAccountsAction`:

1. Load staged accounts (or use `options.accounts`); throw `transfer_accounts_nothing_staged` if empty.
2. `buildAccountsTransferRequestData({ decrypted: { formatVersion: 1, accounts } })`.
3. Create the registry action with **only** the encrypted input: `{ id: "meteor_wallet_core::transfer_accounts", input: built.actionInput }`.
4. Attach a `TransferKeyHandle` (§7) carrying `{ transferKeyString, partnerRequestId }` to the `ExecutableAction` — outside `request`/`expandedInput`, non-enumerable, non-serializable.
5. On successful `{ success: true }`, optionally clear the staged set (config flag, default **true** — the transfer's purpose is fulfilled; the secrets came from the partner app which still holds its own copies).

Errors thrown before any bridge exists: `transfer_accounts_invalid_input` (schema/bounds), `transfer_accounts_backend_rejected` (`invalid_action_request` / `idempotency_conflict` mapped), `transfer_accounts_unavailable` (mobile-bridge client unconfigured).

### 5.3 Exports

`src/index.ts` re-exports the input/outcome types and the safe summary type. It must **not** export `TransferKeyHandle` or anything carrying `transferKeyString`.

---

## 6. Staged-account storage

**Decision needed (recommendation included).** Staged accounts contain plaintext secrets. `demo-partner-web` persists them in plaintext localStorage deliberately (testnet harness); a production SDK should not silently do that.

Recommended design:

- **Default: in-memory staging only.** The staged set lives in the `MeteorConnect` instance; a page reload loses it. This is safe-by-default and matches how a real partner wallet would use the flow (stage → transfer in one session, sourced from its own secure storage).
- **Opt-in persistence** via config: `transferAccounts: { persistStagedAccounts: true }` on `IMeteorConnect_Initialize_Input` — stores under a new typed-storage key `stagedTransferAccounts` on `IMeteorConnectTypedStorage` (prefix `met_data_`, NOT the `met_bridge_partner::` namespace, which is wiped wholesale by identity reset). On load, re-validate with `v.safeParse(v.array(vAccountTransferDataDecrypted))` and drop on failure — same defensive pattern as the demo store.
- Document plainly (readme + jsdoc): persisted staging is plaintext-at-rest in the partner origin's storage; recommended only for development/testnet integration. The staged set is cleared by `clearStagedTransferAccounts()` and (by default) after a successful transfer.

The typed-storage helper (`meteorConnect.storage`, `createTypedStorageHelper`) already gives us get/set/remove — no new storage machinery needed.

---

## 7. Transfer key lifecycle and confinement

The single most security-sensitive element. Rules (all enforced structurally, then tested):

1. `TransferKeyHandle` is a tiny class holding `transferKeyString` + `partnerRequestId` in private fields; `toJSON()` and `[Symbol.for("nodejs.util.inspect.custom")]`/`toString()` return `"[REDACTED]"`. It exposes exactly two methods:
   - `getRevealPayload(session: MobileBridgeSession): { grouped: string; raw: string } | null` — returns non-null **only** while `session.getSnapshot().phase === "wallet_action"` **and** the session's bridge `partnerRequestId` matches the handle's. This is the same two-condition gate as `demo-partner-web` (`App_Partner.tsx:383-393`, audit finding #9).
   - `wipe(): void` — idempotent; clears the string field.
2. Wipe triggers (mirroring the demo's `useEffect`/clear points): terminal phases (`completed` / `failed` / `cancelled`), `cancelAction()`, `refreshMobileBridge()` (a refreshed bridge is a **new** `partnerRequestId` — a stale key must never meet a new bridge), `resetMobileIdentityAndRePair()`, popup close, `ExecutableAction` disposal, `MeteorConnect.dispose()`, and `create_bridge`/push failure.
3. A refresh or retry re-runs `buildAccountsTransferRequestData` from staged data — **new key, new nonce, new ciphertext** every time. Never rebind an old key to a new bridge.
4. The key never enters: the action `request`/`expandedInput`, `MobileBridgeSession` snapshots, typed storage, bridge storage, lease records, logger calls, thrown errors, Lit reactive properties before the reveal gate, or any URL/QR except the dedicated key QR rendered post-reveal.
5. **Key-confinement check:** port `mc_backend/scripts/check-key-confinement.ts` — a repo script that pins the exact SDK files allowed to reference `transferKeyString`/`TransferKeyHandle` internals (expected: the transfer module, the reveal-card element, and their tests) and greps for forbidden patterns (`console.*`, storage APIs). Wire into `bun run lint`/CI.
6. Canary test: create a transfer action with a distinctive key, then assert its absence from `JSON.stringify(request)`, every mocked bridge call body, the deep link, the bridge QR payload, snapshots, storage contents, and the DOM before reveal (see §12).

---

## 8. Bridge integration changes (file-level)

### 8.1 Action registry

- `action/mc_action.types.ts` — widen `TMCActionDomainId` to `"near" | "meteor_wallet_core"`.
- New `action/mc_action.meteor_wallet_core.ts`:
  ```ts
  export const MCMeteorWalletCoreActions = {
    "meteor_wallet_core::transfer_accounts": {
      input: {} as TAllAccountsTransferDataEncrypted,
      expandedInput: {} as TAllAccountsTransferDataEncrypted,
      output: {} as { success: boolean },
      meta: { executionTargetSource: "on_execution" },   // meta is mandatory — ExecutableAction reads it unconditionally
    },
  } as const satisfies Record<TMCActionId<"meteor_wallet_core">, IMCActionSchema>;
  ```
- `action/mc_action.combined.ts` — spread `MCMeteorWalletCoreActions` into `MCActionRegistryMap`.
- Audit `ExecutableAction`'s `near::`-prefixed special cases (`:192` sign-in, `:212` sign-out, `:271` local sign-out, `:298-311` post-execute account refresh) — all are id-equality checks, so the new action flows past them safely; add a test proving it.

### 8.2 Execution-target gating

- `MeteorConnectMobileBridgeClient.getExecutionTargetConfigs` (`:225-240`): add `request.id === "meteor_wallet_core::transfer_accounts"` → `[this.connectionShell()]`. (Transfer has no account target; without this, `createAction` throws "No execution clients found".)
- `MeteorConnectV1Client.getExecutionTargetConfigs` (`:81-123`): currently offers `v1_web`/`v1_ext` targets for **any** action id and would fall through in `makeRequest`. Gate to the `near::` domain (`request.id.startsWith("near::")` or a domain check) — this is a correctness fix independent of transfer.
- `MeteorConnectV2MessengerClient`: its execution body is entirely commented out today; no change, but the same domain gate should land when it is revived.
- Result: for a transfer action, `allExecutionTargets` contains exactly `v2_bridge_mobile` → the popup naturally renders in single-target (`contextual`/platform-locked) mode with no wallet picker.

### 8.3 Prepared-action shape + request adapter

- `MeteorConnectMobileBridgeClient.types.ts` — replace the flat NEAR-only `sharedActionId` with a domain-discriminated shape:
  ```ts
  export type TMobileBridgePreparedActionKind =
    | { domain: "near"; sharedActionId: TMobileNearActionId; pendingFunctionCallKey?: KeyPair; retainedMessageState?: string }
    | { domain: "meteor_wallet_core"; sharedActionId: "transfer_accounts" };
  export interface IMobileBridgePreparedAction {
    sdkRequest: ...;
    actionRequest: IActionPayload_Request_JsonObject;
    kind: TMobileBridgePreparedActionKind;
  }
  ```
- Rename/split `nearActionToMobileBridge.ts` → `sdkActionToMobileBridge.ts` dispatching by domain: NEAR cases unchanged; transfer case is one line — `act_impl_meteor_wallet_core.action.transfer_accounts.request(sdkRequest.expandedInput).toJsonObject()`. Keep `normalizeFunctionCallKey` inside the NEAR branch only.

### 8.4 Per-action capabilities and app ids

- `MobileBridgeSession.prepare()` (`:136-166`): compute `requiredWalletCapabilities` as
  `sort(unique([...REQUIRED_METEOR_WALLET_CAPABILITIES, ...getServerRequiredWalletCapabilities({ domain, id })]))` from the prepared action instead of the hard-coded base set. (Server unions anyway; sending it makes wallet-link filtering and failure codes accurate, and keeps idempotency hashes consistent with what the server stores.)
- **App ids per action:** today the session sends `meteorAppIds: [this.input.meteorAppId]` (mobile app). Transfer must target the web wallet now and more apps later. Add to `IMeteorConnectMobileBridgeConfig`:
  ```ts
  transferAccounts?: {
    enabled?: boolean;                       // default false until rollout
    meteorAppIds?: EMeteorAppId[];           // default: [meteor_bridge_test_web] until a meteor_wallet_web id ships (tracked gap in meteor-frontend)
  };
  ```
  and plumb per-prepared-action `meteorAppIds` through `IMobileBridgePreparedAction` → `create_bridge`.
- **Push:** structurally unreachable for transfer (no account target ⇒ `selectPushWallet` is never consulted), and meteor-frontend cannot receive push at all. Explicitly assert in `prepareRequest` that the transfer path never calls `selectPushWallet` (test). Push-to-paired-mobile-wallet (still PIN-gated, proven in the demo) is a deliberate **later** enhancement once Meteor Mobile receives transfers (§14).

### 8.5 Wallet links, QR, and open-in-app

- `create_bridge` output `walletLinks` contains per-app links; the current session picks a link and appends `#partnerSecret=` (or `&`) — meteor-frontend parses the secret from the fragment, so the existing append logic is compatible. Verify link selection picks the right entry for web-wallet app ids (https `…/bridge_request?bridgeId=…` links) vs the custom-scheme mobile links, and that the QR encodes the full link with fragment.
- `openCurrentSessionInApp()` currently allowlists `meteorwallet:`/`meteorwalletdev:` schemes. For a web-wallet link, "Open in Meteor Wallet" is a plain `window.open`/anchor navigation to the https link — extend the opener to allow the configured wallet-web origins for transfer sessions (still an allowlist, never arbitrary URLs).

### 8.6 Result path

Split `mobileBridgeResultToSdk.ts` into shared verification + per-domain hydration:

1. Shared (unchanged): `signatureVerified === true`, result-shape guard, `serialized.domain/id === prepared.actionRequest.domain/id`.
2. Hydrate by domain: `act_impl_near` ↔ `act_impl_meteor_wallet_core.hydrateResultPayload(serialized)`; compare recomputed `outputHash`; `!hydrated.result.ok` → throw typed error.
3. **Branch transfer before `requireTargetAccount`** (transfer has no target account — today's code would throw `mobile_bridge_missing_target_account`).
4. Transfer mapping: `{ success: true }` → `{ status: "imported" }`; `{ success: false }` → `{ status: "declined" }` (the demo wallet's decline path — do **not** treat as a thrown error; it is a legitimate user decision). Bridge `failed`/expiry with no result → `{ status: "expired" }` (meteor-frontend's only failure signal — see §2.4); pre-commit cancel → `{ status: "cancelled" }`.

### 8.7 Session/action lifecycle notes

- `ExecutableAction.watchMobileSession()` auto-executes at `wallet_verification`/`wallet_action` — correct for transfer too (execution = awaiting the signed result), no change.
- `MobileBridgeSession.cancel()` already returns `"target_already_committed"` post-commitment; the popup close flow (`ActionUi.confirmCommittedMobileClose`) already warns — reuse, with transfer-specific copy ("the transfer may still complete on the other device; your decrypt key will be discarded from this page").
- Bridge expiry (`expiresAt`) is already surfaced in snapshots; for transfer, expiry after reveal is the *normal* failure path — the UI must present it as "transfer not completed" rather than an error.

---

## 9. Dedicated popup UI

### 9.1 Routing

`ActionUi._renderNormalActionUI` (`ActionUi.ts:169-188`) is the single place that instantiates `MeteorActionUiContainer`. Select the container element by action domain: `meteor_wallet_core::transfer_accounts` → new `<meteor-transfer-accounts-container>`. Everything else about `ActionUi` (singleton one-active-action guard, overlay creation, font injection, close/cancel plumbing, committed-close confirm) is reused unchanged. `MeteorActionUiOverlay` (415×556 shell) is reused verbatim.

### 9.2 Screens (`meteor-transfer-accounts-container`)

Follows `demo-partner-web`'s staged flow, restyled to the design system established in `meteor-mobile-bridge-panel` (same tokens as `meteor-action-button`: primary gradient `62,19,231 → 89,47,254`, radius .65rem, kicker/pill/stage-panel patterns):

1. **Review** (pre-bridge): "Transfer accounts to Meteor Wallet" — account list from `allAccountsBasicInfo` (accountId + `NEAR · <network>` rows; safe summaries only, never secrets), count, and a primary "Start secure transfer" button. Creating the bridge only on explicit click keeps the 5-minute bridge TTL from burning while the user reads.
2. **Connect** (`creating_bridge` → `waiting_for_wallet` → `wallet_verification`): **reuse `<meteor-mobile-bridge-panel>`** for QR (gradient-frame tile), countdown/refresh, deep-link/open button, and the segmented PIN stage — all already built and binding only to `IMobileBridgeSnapshot`. Device-adaptive: QR-primary on desktop; "Open in Meteor Wallet" primary + QR icon-toggle on mobile browsers (existing behavior).
3. **Reveal** (`wallet_action`): the new `<meteor-transfer-key-card>`:
   - "Connection verified" stage header (green pill), warning copy: *"This key unlocks your transferred accounts. Enter it only in Meteor Wallet on the connected device."*
   - Hidden-by-default: the key string is **not in the DOM at all** before the explicit "Reveal decrypt key" click (conditional render, not CSS).
   - After reveal: key grouped in 4s in a monospace tile, **Copy** button (flips to "Copied ✓", warns about clipboard history), **key QR** (via the already-bundled `qr-code-styling`, generated into component state — never via any cache/store), and a **Hide** button that removes both text and QR.
   - The card pulls the key exclusively through `TransferKeyHandle.getRevealPayload(session)` on each render — if the gate condition lapses (reconnect, phase regression), the render returns to hidden automatically.
   - Bridge expiry countdown stays visible; on expiry the card wipes and transitions to the terminal state.
4. **Terminal**: reuse the compact icon stages from the mobile panel — `imported` (green check, "Accounts transferred"), `declined`, `expired` ("The transfer wasn't completed on the other device"), `cancelled`.

Accessibility/privacy details carried over from the prior review work: no key in `aria-live`, tooltips, `<input value>`, or data attributes; reveal/copy/QR are deliberate clicks; reduced-motion respected; popup keyboard-navigable including the sandboxed-iframe Enter handling already solved for the PIN input.

### 9.3 Preview harness

Add transfer scenarios to `preview/action-ui/scenarios.mjs` + entry mocks (staged review, waiting, PIN, reveal-hidden, reveal-shown, each terminal state) so the screens are iterable without a live backend, same as the existing bridge panel previews.

---

## 10. Configuration and rollout gating

- `IMeteorConnectMobileBridgeConfig.transferAccounts.enabled` (default `false`): when off, `createTransferAccountsAction` throws `transfer_accounts_unavailable` and no UI/registry behavior changes for existing consumers. This is the SDK-side kill switch; the backend-side lever is the wallet-capability/app-id gate that already exists.
- The staging API works regardless of the flag (it is inert data handling); only the bridge flow is gated.
- Partner metadata requirements from 0.7.0 already handled in this repo (https-only icon, bounded name/description — `normalizePartnerMetadata`).

---

## 11. Error and cancellation semantics

| Situation | SDK behavior |
|---|---|
| Empty staged set / schema-invalid input | throw `transfer_accounts_invalid_input` pre-bridge; no key generated |
| `create_bridge` → `invalid_action_request` / `idempotency_conflict` | wipe key, throw `transfer_accounts_backend_rejected` with safe reason code |
| Wallet lacks capability (`wallet_update_required` failure code) | existing panel copy "Update Meteor Mobile…" generalized: "Update Meteor Wallet to receive account transfers" |
| Wrong PIN ×3 | existing terminal PIN semantics; key wiped; outcome `cancelled` |
| User closes popup pre-commitment | `cancel_bridge`, wipe key, outcome `cancelled` |
| User closes popup post-commitment | committed-close confirm; detach locally; wipe key; outcome `expired` unless a result already arrived |
| Bridge expires (incl. after reveal) | wipe key; outcome `expired` — presented as neutral "not completed", because meteor-frontend cannot signal failures |
| Signed `{ success: false }` | outcome `declined` (not an exception) |
| Signed `{ success: true }` | outcome `imported`; optionally clear staged set |
| Result signature/domain/id/hash mismatch | throw `mobile_bridge_action_result_mismatch` (existing error), wipe key |

Never delete or mutate partner source data on any outcome. Retries always regenerate key + ciphertext (§7.3); because the wallet-side import is idempotent per exact account and duplicate-rejecting otherwise, document that a retry after partial wallet-side import may report already-imported accounts as errors on the wallet — this is wallet-side UX debt (§14.2), not SDK-resolvable.

---

## 12. Test plan

**Unit (bun test, alongside existing mobile-bridge tests):**
- Staging: type detection (`ed25519:` vs 12/24-word mnemonic), rejection cases (word count, embedded whitespace in key, bad accountId charset/length, >50 accounts, oversized secret), replace-on-restage, encode→wallet-decode round trip (base64 → `parseSeedPhrase`/`KeyPair.fromString` compatible shapes).
- `buildAccountsTransferRequestData` integration: SDK action input validates against `vAllAccountsTransferDataEncrypted`; decrypt round trip with `decryptAccountsTransferRequestData` using the returned key; `preview_mismatch` triggers on tampered basic info.
- Registry/adapters: transfer action returns only `v2_bridge_mobile` targets; serializes via `act_impl_meteor_wallet_core`; result hydration verifies domain/id/outputHash; `{success:false}` → `declined`; NEAR adapters regression-tested unchanged.
- Capabilities: `create_bridge` input contains the base set ∪ `transfer_accounts_v1`; NEAR actions still send exactly the base set.
- **Key confinement canary** (§7.6) + the confinement lint script wired into CI.
- Lifecycle races: refresh regenerates key and old handle returns null; stale session cannot unlock a new handle; wipe on every terminal path is idempotent.

**Popup (preview + Playwright if available):** key absent from DOM/accessibility tree before reveal and after hide/terminal; reveal requires the gate; copy/QR require distinct clicks; committed-close confirm shows transfer copy.

**Manual E2E (release gate):** local `mc_backend` backend + `meteor-frontend` dev build: full desktop-QR flow and same-device link flow, wrong-PIN path, decline (once meteor-frontend has one) / silent-expiry path, duplicate-account retry behavior. Note: `mc_backend`'s own Phase 5 manual browser E2E is still marked pending — coordinate so one pass covers both.

---

## 13. Implementation order

1. **Registry + gating** (§8.1, §8.2) — including the V1-client domain gate fix. Type-check + regression tests green.
2. **Adapters + capabilities + app ids** (§8.3, §8.4, §8.6) — transfer action executable end-to-end headlessly against a local backend (result via demo-wallet-web).
3. **Staging API + storage** (§5.1, §6).
4. **`createTransferAccountsAction` + `TransferKeyHandle`** (§5.2, §7) + confinement script + canary tests.
5. **Popup UI** (§9) — container routing, review screen, panel reuse, reveal card, terminal states, previews.
6. **Wallet-link/opener work for web-wallet targets** (§8.5).
7. **Test suite completion + manual E2E vs meteor-frontend** (§12).
8. Flip `transferAccounts.enabled` default only after the E2E pass and the meteor-frontend gaps below are triaged.

---

## 14. Future steps and cross-repo asks

### 14.1 Meteor Mobile (`meteor-v2-apps-windows` repo)
Meteor Mobile is the same app this SDK already targets for regular Meteor Connect actions (QR/deep link/push via `meteor_wallet_mobile` / `meteor_wallet_mobile_dev`); it just doesn't handle the transfer action yet. The receiver pattern is already proven in `demo-wallet-expo` (QR key scanning via `looksLikeTransferKey`, sensitive-push variant landed in mc_backend Phase 6). When Meteor Mobile ships the transfer resolver + advertises `transfer_accounts_v1`:
- add `meteor_wallet_mobile` / `meteor_wallet_mobile_dev` (already existing `EMeteorAppId` values — no shared-package change needed) to `transferAccounts.meteorAppIds`;
- enable push-to-paired-wallet delivery for transfer (still PIN-gated by policy — the demo proved pushed transfers land on `wallet_verification`);
- the reveal card's key QR becomes the primary cross-device entry (the phone scans it), so desktop→phone UX should be re-checked then. The existing device-adaptive QR/open-link handling in the bridge panel carries over unchanged.

### 14.2 Upstream asks (tracked, not blockers)
- **Real web app id**: `meteor_wallet_web` in `EMeteorAppId` — until then the SDK ships with `meteor_bridge_test_web` and a documented migration. (Mobile app ids already exist.)
- **meteor-frontend gaps** (from review): send `errorResult`/decline results instead of silence; render `actionDeliveryError` and the `receiving_action` step; make multi-account import atomic (or per-account result reporting); retry-able `claim_bridge`; RPC-outage vs key-not-found distinction in verification. Each of these directly improves the SDK-side UX table in §11.
- **Cross-bridge PIN-attempt accounting** and PIN-freshness window — open items in mc_backend Phase 6; no SDK action needed, but the SDK's retry UX should not make brute-force easier (regenerating bridges is already rate-limited by user gesture in our flow).

---

## 15. Acceptance criteria

1. A partner can stage accounts via the SDK API with the exact encodings meteor-frontend decodes, bounded by the shared constants.
2. `createTransferAccountsAction().promptForExecution()` runs the full popup flow against the connect backend and resolves to one of the four outcomes; the NEAR action suite is behaviorally unchanged.
3. The transfer key exists only inside `TransferKeyHandle` + the reveal card; the canary suite and confinement lint prove it absent from wire, storage, logs, snapshots, URLs, and pre-reveal DOM.
4. Reveal requires authoritative `wallet_action` **and** matching `partnerRequestId`; every terminal/teardown path wipes the key idempotently; refresh regenerates key+ciphertext.
5. `create_bridge` carries `transfer_accounts_v1` and web-wallet app ids; capability-lacking wallets fail with the update message before any reveal.
6. Signed-result verification (domain/id/signature/outputHash) gates all outcomes; `success:false` and expiry map to `declined`/`expired` without exceptions; source data is never mutated by any outcome.
7. Manual E2E against local backend + meteor-frontend dev passes for QR and same-device link paths.
8. Feature is dark by default (`transferAccounts.enabled: false`) and enabling it requires no code changes for existing SDK consumers.
