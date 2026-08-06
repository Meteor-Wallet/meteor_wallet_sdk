# SDK Plan — Transfer Accounts via Meteor Connect

**Status:** IMPLEMENTED 2026-08-06 (§13 steps 1–7; branch `paul/meteor-connect-bridge`) — remaining: §12's manual E2E release gate against a local backend + meteor-frontend dev, then §13 step 8 (flip `transferAccounts.enabled` default). Playwright popup checks beyond the preview screenshots are also still open.
**Repository:** `meteor_wallet_sdk` — `packages/meteor-sdk-v1/src/MeteorConnect`
**Protocol source of truth:** `@meteorwallet/connect` / `@meteorwallet/connect-shared` **0.9.0** (already installed) and the completed backend implementation in `mc_backend` (the repo checked out at `../meteor-connect-bridge`; `PLAN-account-transfer.md` — phases 1–5b done, audited)
**Reference implementations:** `mc_backend/packages/demo-partner-web` (partner side — the flow we are productizing), `meteor_wallet/web/packages/meteor-frontend` (the first real receiving wallet), `mc_backend/packages/demo-wallet-web` + `demo-wallet-expo` (receiver references)
**Prepared:** 2026-08-04 · **Updated:** 2026-08-06 for 0.9.0 — all §14.2 asks resolved upstream: 0.8.0 brought real web app ids + the shared secret encoder and meteor-frontend now identifies as `meteor_wallet_web`/`meteor_wallet_web_dev`; 0.9.0 + the accompanying meteor-frontend work implemented the error-handling feedback (explicit declines, delivery-error surfacing, claim retry, sequential import). Only the richer per-account result shape remains tracked-later.

---

## 1. Objective and scope

Give partner wallet applications a production SDK flow to transfer their users' accounts into Meteor Wallet:

1. **Import/stage** accounts (account ID + mnemonic or private key) into the SDK with validation and normalization.
2. **Store** the staged set so the partner app can build up / review the list before transferring.
3. **Transfer** the accounts through the Meteor Connect bridge backend in a dedicated popup UI that follows the proven `demo-partner-web` flow: encrypt locally → create bridge → QR / open link → PIN verification → reveal decrypt key → signed `{ success }` result.

Receiving wallets, in order: **Meteor Wallet web** (`meteor-frontend`, live now), then **Meteor Mobile** (developed in the `meteor-v2-apps` sibling repo, checked out at `../meteor-v2-apps`), which already receives regular Meteor Connect actions from this SDK via QR/deep link — the transfer receiver pattern for it is proven in `demo-wallet-expo`.

Out of scope here: any backend or shared-package changes (the protocol is complete and audited in `mc_backend`), and wallet-side receiving code (already implemented in `meteor-frontend`).

---

## 2. Protocol facts this plan builds on (verified against 0.9.0 sources)

These are settled decisions from `mc_backend/PLAN-account-transfer.md` (D1–D9) and the shipped 0.9.0 packages — the SDK must consume them, not re-implement them. (0.9.0's only code delta over 0.8.0 is wallet-client-side — typed claim-failure classification for wallet UIs; every partner-side surface below is unchanged from 0.8.0.)

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
- Real web app ids exist as of 0.8.0: `EMeteorAppId.meteor_wallet_web` / `meteor_wallet_web_dev`, with backend wallet links registered (`https://wallet.meteorwallet.app/bridge_request?bridgeId=…&protocolVersion=…` and `wallet-dev.meteorwallet.app` respectively; `EBridgeLinkType.web_app_url`). **meteor-frontend now identifies with these ids** — `meteor_wallet_web_dev` on dev deploys, `meteor_wallet_web` on production (env-selected in `meteorConnectBridgeClient.ts`). `meteor_bridge_test_web` remains only for the `mc_backend` demo-wallet test harness; the SDK does not need it in its defaults.
- Advertises `transfer_accounts_v1`; key entry is a plain input (paste/type); decrypt → on-chain FullAccess access-key verification per secret → import.
- **Sends explicit decline/failure results** (since the 2026-08-06 feedback round — `mc_backend/FEEDBACK-meteor-frontend-transfer-gaps.md`): user cancel and import give-up send a signed `{ success: false }`, so the SDK's `declined` outcome is the *normal* negative ending. Silence → bridge expiry still happens (user closes the tab or walks away), so the `expired` outcome handling stays — it just now means "abandoned", not "declined-but-couldn't-say-so".
- Import is **sequential with per-account outcomes** (same feedback round): already-present accounts are skipped up front, partial failures offer retry-of-remainder, and exactly one signed result is sent per transfer (`success: true` only after every account lands). The SDK should still be idempotent-friendly and never assume all-or-nothing on the wallet side — but the old "retry hits 'already in this Meteor wallet'" trap is gone. Per-account reporting *to the partner* remains impossible (`{ success: boolean }` wire result — richer shape is a tracked-later protocol ask, §14.2).

---

## 3. Current SDK state and gap summary

The SDK has **zero** transfer code today. The registry is NEAR-only (`TMCActionDomainId = "near"`), mobile-bridge request/result adapters are hard-coded to `act_impl_near`, capabilities sent to `create_bridge` are the hard-coded base set, and the popup has one container (`meteor-action-ui-container`) with the sign-in/wallet-picker layout. Exact touch points are listed in §8.

What we reuse as-is:

- `PartnerBridgeClient` (0.9.0) — `create_bridge` / `verify_pin` / `cancel_bridge` already accept per-action capabilities; no transfer-specific client APIs exist or are needed.
- `MobileBridgeSession` — its phase machine (`initializing → creating_bridge → waiting_for_wallet → wallet_verification → wallet_action → completed|failed|cancelled`, plus `busy_other_tab` while the cross-tab lease is contended) is exactly the transfer lifecycle; `wallet_action` is the authoritative reveal gate. Snapshots are shallow-copied to every subscriber — nothing secret may enter them.
- `meteor-mobile-bridge-panel` — the QR/countdown/PIN/status UI is action-agnostic. (Correction from earlier drafts: it binds to a live `MobileBridgeSession` via its `.session` reactive property — `subscribe`/`getSnapshot`/`submitPin` — plus `.contextual` and `openInApp`/`refreshCode`/`resetIdentity` callbacks, not to a bare snapshot; §9.2 lists the exact inputs the transfer container must pass.)
- `MeteorActionUiOverlay` — the 415×556 popup shell is fully action-agnostic (slot-based).

### 3.1 Utility inventory — package-provided vs. new SDK code

Everything protocol- and crypto-level already ships in the installed packages (verified importable from this repo's `@meteorwallet/connect-shared` 0.9.0). **The SDK must import these, never re-implement them:**

| Concern | Provided by packages — use directly |
|---|---|
| Encrypt + key generation + preview derivation | `buildAccountsTransferRequestData({ decrypted })` — the entire partner-side crypto step in one call |
| Raw secret input → `TAccountSecretData` encoding | `buildAccountSecretData({ secretInput, derivationPath? })` (new in 0.8.0) — auto-detects `ed25519:` private key vs 12/24-word mnemonic, whitespace-normalizes, applies `NEAR_DEFAULT_DERIVATION_PATH` default, builds the `utf8_base64::`/`near_prefixed_utf8_base64::` encodings, schema-validates. Returns typed failures (`TBuildAccountSecretDataResult`): `empty_secret_input` / `invalid_private_key` / `invalid_mnemonic_word_count` (+`wordCount`) / `invalid_secret_data` (+`issueMessage`) — the SDK maps these to friendly copy, never re-implements detection |
| Decrypt + validate (tests / round-trip verification) | `decryptAccountsTransferRequestData`, `TAccountsTransferDecryptResult` |
| Action serialization / result hydration | `act_impl_meteor_wallet_core.action.transfer_accounts.request(...).toJsonObject()` / `act_impl_meteor_wallet_core.hydrateResultPayload(...)` |
| Payload schemas + every bound | `vAllAccountsTransferDataEncrypted`, `vAllAccountsTransferDataDecrypted`, `vAccountTransferDataDecrypted`, `vAccountSecretData` (+ mnemonic/private-key variants), `vAccountBasicData`, and all `TRANSFER_ACCOUNTS_*` constants |
| Key string format + parsing | `METEOR_CONNECT_KEY_PREFIX`, `TMeteorConnectKeyString`; `importPortableAesGcmKeyFromString` (wallet-side parse — the SDK never needs to parse a key it generated) |
| Capability / policy logic | `EWalletProtocolCapability.transfer_accounts_v1`, `REQUIRED_METEOR_WALLET_CAPABILITIES`, `getServerRequiredWalletCapabilities`, `getActionPolicy`, `hasRequiredWalletCapabilities`, `METEOR_WALLET_PROTOCOL_VERSION` |
| Bridge transport, PIN, per-action caps, result signature verification | `PartnerBridgeClient` + `PartnerBridgeStore` (already wrapped by `MobileBridgeSession`), incl. `IPartnerBridgeInfo.partnerRequestId` for the reveal gate |
| Base64/bytes helpers | `bytesToBase64` / `base64ToBytes` from `@nice-code/util` (not re-exported by connect-shared — import directly, as the demos do) |

What does **not** exist in the packages (demo-local code in `mc_backend`, to be written as SDK code mirroring the demos):

| Concern | Reference | Size |
|---|---|---|
| Key display grouping (groups of 4) | `RevealDecryptionKeyCard.tsx` (`groupKeyForDisplay`) | 1 line |
| Key QR rendering | demo uses `qrcode`; SDK already bundles `qr-code-styling` | existing dep |
| Staging storage, popup UI, `TransferKeyHandle` lifecycle, registry/adapter plumbing | this plan §5–§9 | the actual SDK work |

Bounds enforcement at staging time (§5.1) is done by running the shared schemas (`v.safeParse(vAccountTransferDataDecrypted, …)` per account, `vAllAccountsTransferDataDecrypted` for the set) — the SDK adds friendlier per-field error messages on top, not its own limit constants.

---

## 4. End-to-end flow

```mermaid
sequenceDiagram
    participant P as Partner app (SDK consumer)
    participant S as SDK (staging + popup)
    participant B as Connect backend
    participant W as Meteor Wallet (web / mobile)

    P->>S: transferAccounts.stage({ accountId, secretInput }) ×N
    S->>S: validate + normalize → TAccountTransferDataDecrypted, store staged set
    P->>S: transferAccounts.prompt()
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

The API speaks the shared schema's vocabulary directly — same field names (`blockchainId`/`networkId`/`accountId`), same account identity tuple, and the same one-account-many-secrets structure as `vAccountTransferDataDecrypted`:

```ts
import type {
  TAccountBasicData,            // { blockchainId; networkId; accountId } — the account identity tuple
  TAccountTransferDataDecrypted, // TAccountBasicData & { secret: TAccountSecretData[] } (1..10, deduped)
  TBlockchainId,                 // "near"
  TCryptoGenericNetworkId,       // "mainnet" | "testnet"
} from "@meteorwallet/connect-shared";

// Raw partner input — the SDK owns parsing + encoding into TAccountSecretData
interface IStageTransferAccountInput {
  /** Optional — defaults to "near", the only blockchainId in transfer v1. */
  blockchainId?: TBlockchainId;
  networkId: TCryptoGenericNetworkId;
  /** Trimmed + lowercased, then validated by vAccountBasicData (2..64, NEAR account grammar). */
  accountId: string;
  /** Mnemonic phrase (12/24 words) OR "ed25519:<base58>" private key. */
  secretInput: string;
  /** Mnemonic secrets only. Passed through to buildAccountSecretData; defaults to the shared NEAR_DEFAULT_DERIVATION_PATH ("m/44'/397'/0'"). */
  derivationPath?: string;
}

// Secret-free summary for partner UI listings — identity tuple + what kinds of secrets are staged
type TStagedTransferAccountSummary = TAccountBasicData & {
  secretTypes: Array<"mnemonic" | "private_key">;
};

// Typed reason codes, matching the shared result-shape convention (cf. TAccountsTransferDecryptResult).
// Secret-level reasons are passed through verbatim from the shared encoder's
// TBuildAccountSecretDataResult; account/set-level reasons are SDK-added.
type TStageTransferAccountResult =
  | { ok: true; account: TStagedTransferAccountSummary }  // summary, not secrets — no echoing secrets back out
  | {
      ok: false;
      reason:
        | "invalid_account_id"              // vAccountBasicData failure
        | "empty_secret_input"              // ┐
        | "invalid_private_key"             // │ passed through from
        | "invalid_mnemonic_word_count"     // │ buildAccountSecretData (0.8.0)
        | "invalid_secret_data"             // ┘ schema backstop (over-length secret, bad derivation path)
        | "duplicate_secret"                // canonical-JSON duplicate on the same account (schema check)
        | "too_many_secrets"                // > TRANSFER_ACCOUNTS_MAX_SECRETS_PER_ACCOUNT
        | "too_many_accounts";              // > TRANSFER_ACCOUNTS_MAX_ACCOUNTS
      message: string;
      /** Present for invalid_mnemonic_word_count — from the shared encoder. */
      wordCount?: number;
    };

// All transfer surface lives on one namespace object — the MeteorConnect class gains a single
// property instead of seven methods, and the feature reads as one unit at call sites.
const { transferAccounts } = meteorConnect;

/**
 * Stages a secret for an account. Staging the same (blockchainId, networkId, accountId) tuple
 * again ADDS the secret to that account's `secret` array (schema: 1..10, deduped) — it does not
 * replace the account. Use removeStaged to start an account over.
 */
transferAccounts.stage(input: IStageTransferAccountInput): Promise<TStageTransferAccountResult>;
transferAccounts.getStagedSummaries(): Promise<TStagedTransferAccountSummary[]>; // safe shape for UI listing
transferAccounts.getStagedWithSecrets(): Promise<TAccountTransferDataDecrypted[]>; // hazard is in the name — full shape incl. secrets
transferAccounts.removeStaged(identifier: TAccountBasicData): Promise<void>;
transferAccounts.clearStaged(): Promise<void>;
```

A pure helper `parseTransferSecretInput(secretInput): { type: "mnemonic" | "private_key" } | { type: "invalid"; reason: string }` is exported alongside, so partner UIs can render live "detected: mnemonic" feedback (as the demo's `TransferAccountsCard` does) without staging anything. It is a thin wrapper over `buildAccountSecretData` (inspect `result.secret.type` / failure reason) — no local detection logic.

Validation/encoding rules (matching the 0.8.0 `demo-partner-web` store, which now delegates too):

- **All secret parsing/encoding goes through the shared `buildAccountSecretData`** (§3.1) — the SDK contains zero encoding rules of its own. Its typed failure reasons pass through to `TStageTransferAccountResult`; the SDK only adds friendly `message` copy per reason (as the demo does).
- Account ID: trimmed + lowercased, length 2–64, charset via the shared `TRANSFER_ACCOUNTS_ACCOUNT_ID_PATTERN`, then `vAccountBasicData` — readable `invalid_account_id` messages instead of an opaque valibot failure at build time.
- Staging keys accounts by the schema's identity tuple `(blockchainId, networkId, accountId)`; re-staging the same tuple appends to that account's `secret` array (deduped by canonical JSON, exactly as `vAccountTransferDataDecrypted` enforces). This deliberately differs from the demo store's replace-on-restage (single-secret test harness) — the schema models one account with up to 10 secrets, and the merge semantics expose that properly.
- Bounds are enforced at staging time by validating each encoded entry with the **shared schemas** (`vAccountTransferDataDecrypted`, and the full set with `vAllAccountsTransferDataDecrypted`) so failures happen early with good messages instead of at `create_bridge` — the SDK adds the typed reason codes and friendly copy, not its own limit logic (§3.1).

### 5.2 Transfer flow API

The primary surface is a **one-shot flow method** that resolves to a typed outcome; the raw `ExecutableAction` remains available as an escape hatch:

```ts
const outcome = await meteorConnect.transferAccounts.prompt(options?: {
  /** Override the staged set for this transfer (bypasses staging storage entirely). */
  accounts?: TAccountTransferDataDecrypted[];
});

type TTransferAccountsOutcome =
  | { status: "imported" }   // wallet returned signed { success: true }
  | { status: "declined" }   // wallet returned signed { success: false } (demo-wallet decline path)
  | { status: "cancelled" }  // user closed/cancelled locally before commitment
  | { status: "expired" }    // bridge expired with no signed result (user abandoned the wallet-side flow)
  | { status: "failed"; reason: "pin_attempts_exhausted" | "wallet_update_required" | "bridge_failed" };
  // bridge_failed covers transport/realm failures too (session catch-all "mobile_bridge_failed")
```

**Contract: flow endings resolve; integration errors throw.** `prompt()` throws only for errors where no popup flow is possible or something is misconfigured (`transfer_accounts_nothing_staged`, `transfer_accounts_invalid_input`, `transfer_accounts_unavailable`, `transfer_accounts_backend_rejected` mapping `invalid_action_request`/`idempotency_conflict`, and result-verification failures like `mobile_bridge_action_result_mismatch`). Every user- or wallet-driven ending resolves, so partner code is one `switch (outcome.status)` instead of `try/catch` around "the user closed the popup".

The mapping is grounded in the session's actual settlement behavior (verified in `MobileBridgeSession`/`ExecutableAction`): the underlying action promise rejects with `"Action was cancelled"` / `"mobile_bridge_cancelled"` → `cancelled`; `"mobile_bridge_expired"` → `expired`; `"PIN attempts exceeded"` → `failed/pin_attempts_exhausted`; `"wallet_update_required"` → `failed/wallet_update_required`; other bridge failures → `failed/bridge_failed`. One verified path never settles the promise: `mobile_bridge_identity_pin_mismatch` only marks the snapshot `failed` + `identityResetRequired` — the flow ends when the user closes the popup (`"Action was cancelled"` → `cancelled`) or re-pairs; the key wipes on the `failed` phase either way. Wire output maps `{ success: true } → imported`, `{ success: false } → declined`. The **registry output stays wire-shaped `{ success: boolean }`** — outcome mapping lives entirely in the wrapper, so `ExecutableAction`/adapter semantics stay uniform with every other action.

Escape hatch for advanced integrations (custom lifecycle control):

```ts
const action = await meteorConnect.transferAccounts.createAction(options?);
// ExecutableAction with output { success: boolean }; rejects on cancel/expiry like every other action
```

Internals of `createAction` (`prompt()` = `createAction()` + `promptForExecution()` + outcome mapping):

1. Load staged accounts (or use `options.accounts`); throw `transfer_accounts_nothing_staged` if empty.
2. Retain a frozen **decrypted snapshot** of the account set for the action's lifetime — required for per-bridge payload regeneration (§7).
3. `buildAccountsTransferRequestData({ decrypted: { formatVersion: 1, accounts } })` for the initial build; create the registry action with **only** the encrypted input: `{ id: "meteor_wallet_core::transfer_accounts", input: built.actionInput }`.
4. Attach the **sensitive transfer attachment** (§7) to the `ExecutableAction` — the decrypted snapshot + per-session key handles — outside `request`/`expandedInput`, non-enumerable, non-serializable.
5. Force the standard popup: transfer rejects `strategy: "target_element"` (the reveal card must not be mountable into an arbitrary partner DOM subtree; the popup path also owns the committed-close confirm plumbing).
6. On `{ success: true }`, optionally clear the staged set (`clearStagedOnSuccess`, default **false** — staged accounts remain so the user can transfer them to other platforms too; silently emptying the partner's working set after one transfer is surprising, and keeping copies never blocks a retry since the receiving wallet skips already-imported accounts). The decrypted snapshot is dropped on every terminal outcome and on disposal regardless.

### 5.3 Exports

`src/index.ts` re-exports the input/outcome types, `TStagedTransferAccountSummary`, and `parseTransferSecretInput`. It must **not** export `TransferKeyHandle`, the sensitive attachment, or anything carrying `transferKeyString`.

---

## 6. Staged-account storage

**Decision needed (recommendation included).** Staged accounts contain plaintext secrets. `demo-partner-web` persists them in plaintext localStorage deliberately (testnet harness); a production SDK should not silently do that.

Recommended design:

- **Default: in-memory staging only.** The staged set lives in the `MeteorConnect` instance; a page reload loses it. This is safe-by-default and matches how a real partner wallet would use the flow (stage → transfer in one session, sourced from its own secure storage).
- **Opt-in persistence** via `persistStagedAccounts: true` on the single `transferAccounts` config block — which lives on `IMeteorConnectMobileBridgeConfig` alongside `enabled`/`meteorAppIds` (§8.4, §10): one namespace for the whole feature, not two config locations. Stores under a new typed-storage key `stagedTransferAccounts` added to `IMeteorConnectTypedStorage` (prefix `met_data_`; verified NOT the `met_bridge_partner::` namespace — that entire prefix is deleted wholesale by `resetPartnerIdentity()` / the panel's "reset pairing" button). On load, re-validate with `v.safeParse(v.array(vAccountTransferDataDecrypted))` and drop on failure — same defensive pattern as the demo store.
- Document plainly (readme + jsdoc): persisted staging is plaintext-at-rest in the partner origin's storage; recommended only for development/testnet integration. The staged set is cleared only by `transferAccounts.clearStaged()` (or the opt-in `clearStagedOnSuccess`); the in-memory set is also dropped on `MeteorConnect.dispose()`.

The typed-storage helper (`meteorConnect.storage`, `createTypedStorageHelper`) already gives us get/set/remove — no new storage machinery needed.

---

## 7. Transfer key lifecycle and confinement

The single most security-sensitive element. Rules (all enforced structurally, then tested):

1. `TransferKeyHandle` is a tiny class holding `transferKeyString` in a private field, **bound to exactly one `MobileBridgeSession` instance** (the one whose `create_bridge` carried its ciphertext); `toJSON()` and `toString()`/inspect return `"[REDACTED]"`. It exposes exactly two methods:
   - `getRevealPayload(session: MobileBridgeSession): { grouped: string; raw: string } | null` — non-null **only** while `session` is the bound instance **and** its snapshot phase is `"wallet_action"` **and** the handle is unwiped. Instance binding is the SDK-native equivalent of `demo-partner-web`'s `partnerRequestId` correlation (`App_Partner.tsx:383-393`, audit finding #9) — the demo needed the id because React state and mutations interleave; here the SDK owns both sides, and `partnerRequestId` is a private field of the session anyway. A key generated for one bridge can never meet another bridge's `wallet_action`, by construction.
   - `wipe(): void` — idempotent; clears the string field.
2. Wipe triggers (mirroring the demo's `useEffect`/clear points): terminal phases (`completed` / `failed` / `cancelled`), `cancelAction()`, `refreshMobileBridge()`, `resetMobileIdentityAndRePair()`, popup close, session disposal, `ExecutableAction` disposal, `MeteorConnect.dispose()`, and `create_bridge`/push failure. The retained decrypted snapshot (§5.2) is dropped at the same terminal/disposal points.
3. **Per-bridge regeneration mechanics** (new key, nonce, and ciphertext for every bridge — never rebind an old key to a new bridge). Verified seams: `prepareMobileBridge()` takes no parameters today; the adapter receives the full `sdkRequest` (`{ id, expandedInput }`, holding the *initial* ciphertext); and `makeRequest` reuses an existing session only when `prepared.sdkRequest.expandedInput` is **reference-identical** to the action's `expandedInput` (`MeteorConnectMobileBridgeClient.ts:439-442`). So: thread an optional **sensitive transfer attachment** parameter through `prepareMobileBridge → prepareRequest → adapter` (and through `refreshRequest`, which cancels the old session and re-runs `prepareRequest`); the transfer branch of the adapter calls `attachment.buildFreshBridgePayload()` — re-runs `buildAccountsTransferRequestData` on the retained decrypted snapshot, wipes the previous handle, creates a new `TransferKeyHandle` bound to the new session, and returns the fresh `actionInput` for the wire `actionRequest`. Keep `expandedInput` the same object (initial build) so the reference-identity session-reuse check keeps working; the per-bridge `prepared.actionRequest` is authoritative, and result matching already compares against exactly that (`serialized.domain/id` vs `prepared.actionRequest`). Note each new session mints its own `partnerRequestId` (`crypto.randomUUID()` per instance), so refreshed bridges are never idempotency-deduped — exactly what per-bridge key regeneration requires.
4. The key never enters: the action `request`/`expandedInput`, `MobileBridgeSession` snapshots, typed storage, bridge storage, lease records, logger calls, thrown errors, Lit reactive properties before the reveal gate, or any URL/QR except the dedicated key QR rendered post-reveal. The attachment/handle must also never live on `IMobileBridgePreparedAction` — `session.prepared` and `client.getCurrentSession()` are publicly reachable.
5. **Key-confinement check:** port `mc_backend/scripts/check-key-confinement.ts` — a repo script that pins the exact SDK files allowed to reference `transferKeyString`/`TransferKeyHandle` internals (expected: the transfer module, the reveal-card element, and their tests) and greps for forbidden patterns (`console.*`, storage APIs). Wire into `bun run lint`/CI.
6. Canary test: create a transfer action with a distinctive key, then assert its absence from `JSON.stringify(request)`, every mocked bridge call body, the deep link, the bridge QR payload, snapshots, storage contents, and the DOM before reveal (see §12).

Related logging hygiene (not a key leak, but worth fixing in the same pass): `MeteorConnect.createAction` logs the full `expandedInput` via `jsonStringifyCompat` — for transfer that would dump the account list plus up to 350k chars of ciphertext to the console. Special-case the transfer id to log a summary (`accounts: N, ciphertext: N bytes`) instead.

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
      meta: { executionTargetSource: "on_execution" },   // meta is optional on IMCActionSchema, but MeteorConnect.createAction dereferences .meta unconditionally (MeteorConnect.ts:309-311) — always supply it. No inputTransform: "targeted_account" would force single-target expansion via request.input.target (:317-320), which transfer doesn't fit.
    },
  } as const satisfies Record<TMCActionId<"meteor_wallet_core">, IMCActionSchema>;
  ```
- `action/mc_action.combined.ts` — spread `MCMeteorWalletCoreActions` into `MCActionRegistryMap`.
- Audit `ExecutableAction`'s NEAR special cases. The *positive* id-equality checks (`:192` sign-in, `:212` sign-out, `:272` local sign-out, plus `createAction:359`'s local-sign-out bypass) are safe — transfer flows past them. **Exception (verified): the post-execute block (`ExecutableAction.ts:296-312`) uses *negative* id checks** (`id !== "near::sign_in"` …), so transfer falls *into* it — and it calls `mobileBridgeClient.getActiveConnection()` (which **throws `mobile_bridge_active_wallet_unavailable`** when no paired wallet exists; the `account != null` guard only runs after) before attempting an account-connection rewrite. Gate this block to the `near` domain (or a positive id allowlist) and add a test proving a successful transfer settles cleanly.

### 8.2 Execution-target gating

- `MeteorConnectMobileBridgeClient.getExecutionTargetConfigs` (`:225-240`): add `request.id === "meteor_wallet_core::transfer_accounts"` → `[this.connectionShell()]`. (Transfer has no account target; without this, `createAction` throws "No execution clients found".)
- `MeteorConnectV1Client.getExecutionTargetConfigs` (`:81-123`): currently offers `v1_web`/`v1_ext` targets for **any** action id and would fall through in `makeRequest`. Gate to the `near::` domain (`request.id.startsWith("near::")` or a domain check) — this is a correctness fix independent of transfer.
- `MeteorConnectTestClient` (dev only): `MeteorConnect.getClients()` swaps to the test client *alone* when `isDev` — it offers its targets for **any** id and its `makeRequest` handles only 3 NEAR ids before throwing. Give it the same domain gate so dev-mode transfer fails fast at target selection, and note the consequence: the mobile-bridge client doesn't participate in dev mode at all, so transfer flow testing runs non-dev (the §9.3 preview harness covers UI iteration).
- `MeteorConnectV2MessengerClient`: its execution body is entirely commented out today (and the client isn't even registered in `getClients()`); no change, but the same domain gate should land when it is revived.
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
- Rename/split `nearActionToMobileBridge.ts` → `sdkActionToMobileBridge.ts` dispatching by domain (the adapter receives the full `sdkRequest` `{ id, expandedInput }` — it switches on `sdkRequest.id` and stores the whole request on the prepared object): NEAR cases unchanged; transfer case is one line — `act_impl_meteor_wallet_core.action.transfer_accounts.request(…).toJsonObject()` over the attachment's fresh payload (§7.3). Move `normalizeFunctionCallKey` inside the NEAR branch — today it runs unconditionally *before* the switch.

### 8.4 Per-action capabilities and app ids

- Capabilities: compute `requiredWalletCapabilities` as
  `sort(unique([...REQUIRED_METEOR_WALLET_CAPABILITIES, ...getServerRequiredWalletCapabilities({ domain, id })]))` from the prepared action instead of the hard-coded base set. (Server unions anyway; sending it makes wallet-link filtering and failure codes accurate, and keeps idempotency hashes consistent with what the server stores.) **Three hard-coded sites, not one** (verified): `MobileBridgeSession.prepare()`'s `create_bridge` branch (`:162`) and push branch (`:146`), plus the push-eligibility filter in `MeteorConnectMobileBridgeClient.selectPushWallet` (`:266-273`).
- **App ids per action:** today the session sends `meteorAppIds: [this.input.meteorAppId]` (mobile app). Transfer must target the web wallet now and more apps later. Add to `IMeteorConnectMobileBridgeConfig`:
  ```ts
  transferAccounts?: {
    enabled?: boolean;                       // default false until rollout
    meteorAppIds?: EMeteorAppId[];           // ordered preference; default derived from config.meteorAppId (see below)
  };
  ```
  and plumb per-prepared-action `meteorAppIds` through `IMobileBridgePreparedAction` → `create_bridge`.
  Default derivation: the popup's destination screen (§9.2 step 1b) picks the platform per transfer — "web" → `[meteor_wallet_web_dev]` when `config.meteorAppId` is the `_dev` mobile id, else `[meteor_wallet_web]` (matching meteor-frontend's env-based identity, §2.4); "mobile" → `[config.meteorAppId]`. `transferAccounts.meteorAppIds` overrides the web list (e.g. `[meteor_bridge_test_web]` against the `mc_backend` demo wallet). Ordering is link-selection preference.
- **Wallet-link selection must follow the per-action app ids** — this is a hard-fail trap, not a nicety: `MobileBridgeSession.applyPartnerState()` picks the deep link via `bridge.info.walletLinks.find((l) => l.appId === this.input.meteorAppId)` (the single configured *mobile* app id) and fails the session with `mobile_bridge_app_link_missing` when no link matches. A transfer bridge created for `meteor_wallet_web` would die right there. The session input gains `targetMeteorAppIds: EMeteorAppId[]` (ordered preference); link selection takes the first match from that list, and the same list is what `create_bridge`/push receives. NEAR actions pass `[config.meteorAppId]` — behavior unchanged.
- **Push:** structurally unreachable for transfer (no account target ⇒ `selectPushWallet` is never consulted), and meteor-frontend cannot receive push at all. Explicitly assert in `prepareRequest` that the transfer path never calls `selectPushWallet` (test). Push-to-paired-mobile-wallet (still PIN-gated, proven in the demo) is a deliberate **later** enhancement once Meteor Mobile receives transfers (§14).

### 8.5 Wallet links, QR, and open-in-app

- `create_bridge` output `walletLinks` contains per-app links; the current session picks a link and appends `#partnerSecret=` (or `&`) — meteor-frontend parses the secret from the fragment, so the existing append logic is compatible. Verify link selection picks the right entry for web-wallet app ids (https `…/bridge_request?bridgeId=…` links) vs the custom-scheme mobile links, and that the QR encodes the full link with fragment.
- `openCurrentSessionInApp()` currently computes a **single expected scheme from the configured mobile `meteorAppId`** (`meteorwalletdev:` for the dev id, else `meteorwallet:`) and throws `mobile_bridge_native_scheme_not_allowed` for anything else (`MeteorConnectMobileBridgeClient.ts:394-405`) — a web-wallet https link is structurally blocked today (and a transfer session would fail even earlier at link selection, §8.4). Extend: derive the expectation from the session's *selected wallet link* — every backend-issued link carries `linkType` (`EBridgeLinkType.web_app_url` vs `app_deep_link`), a field the SDK currently ignores; for `web_app_url` links allow exactly that link's https URL (opened via `window.open`/anchor). The check stays an allowlist derived from the backend-issued `walletLinks`, never partner-supplied URLs.

### 8.6 Result path

Split `mobileBridgeResultToSdk.ts` into shared verification + per-domain hydration:

1. Shared (unchanged): `signatureVerified === true`, result-shape guard, `serialized.domain/id === prepared.actionRequest.domain/id`.
2. Hydrate by domain: `act_impl_near` ↔ `act_impl_meteor_wallet_core.hydrateResultPayload(serialized)`; compare recomputed `outputHash`; `!hydrated.result.ok` → throw typed error.
3. **Branch transfer before `requireTargetAccount`** (transfer has no target account — today's code would throw `mobile_bridge_missing_target_account`).
   Also add a `default:` throw to the per-action switch — verified: today an unknown `sharedActionId` silently resolves `undefined` (the request adapter throws on unknown ids; the result adapter must too), and hydration currently calls `act_impl_near.hydrateResultPayload` unconditionally regardless of the domain-equality check.
4. Transfer mapping: `{ success: true }` → `{ status: "imported" }`; `{ success: false }` → `{ status: "declined" }` (the standard wallet decline/give-up path — do **not** treat as a thrown error; it is a legitimate user decision). Bridge `failed`/expiry with no result → `{ status: "expired" }` (the user abandoned the wallet-side flow — see §2.4); pre-commit cancel → `{ status: "cancelled" }`.

### 8.7 Session/action lifecycle notes

- `ExecutableAction.watchMobileSession()` auto-executes at `wallet_verification`/`wallet_action` — correct for transfer too (execution = awaiting the signed result), no change.
- `MobileBridgeSession.cancel()` already returns `"target_already_committed"` post-commitment; the popup close flow (`ActionUi.confirmCommittedMobileClose`) already warns — reuse, with transfer-specific copy ("the transfer may still complete on the other device; your decrypt key will be discarded from this page").
- Bridge expiry (`expiresAt`) is already surfaced in snapshots; for transfer, expiry after reveal is the *normal* failure path — the UI must present it as "transfer not completed" rather than an error.
- One live session per client: `prepareRequest` throws `mobile_bridge_session_already_active` while a non-terminal session exists. The popup path is already covered by `ActionUi`'s one-active-action guard; document that the `createAction()` escape hatch inherits the same constraint.

---

## 9. Dedicated popup UI

### 9.1 Routing

`ActionUi._renderNormalActionUI` (`ActionUi.ts:169-188`) is the single place that instantiates the container — via `new MeteorActionUiContainer()` (a class constructor, not a tag string). Route by action id: `meteor_wallet_core::transfer_accounts` → `new MeteorTransferAccountsContainer()`; widen the `actionUiComponent` field type and satisfy the same property contract (`.action`, `.pendingKnownExecutionTarget`, `.closeAction` — `ActionUi.ts:175-183`). Everything else about `ActionUi` (singleton one-active-action guard, overlay creation, font injection, close/cancel plumbing, committed-close confirm) is reused unchanged; `MeteorActionUiOverlay` (415×556, viewport-clamped) is reused verbatim.

Verified integration requirements for the new container: register it via the repo's HMR-safe `customElement` wrapper (`lit_ui/custom-element.ts`), not Lit's; `@consume` the overlay's `overlayCloseTriggerContext` so its close button animates instead of hard-removing; reuse `ActionUiController` for `prepareMobileBridge`/`refreshMobileBridge`/`resetMobileIdentityAndRePair` (the existing container triggers `prepareMobileBridge` from `connectedCallback` — the transfer container instead defers it to the Review screen's explicit start click, §9.2); set its own `font-family: 'Gilroy', …` on its modal root (the injected font is only consumed via each container's own CSS); and redeclare the surface/text custom properties (`--meteor-dark-gray-*`, `--meteor-text-on-dark-*`) — the "design tokens" are per-element `:host` declarations, not shared exports (the primary gradient is hand-duplicated with a keep-in-sync comment).

Two fixes to land in `ActionUi` while in there: the transfer rejection of `strategy: "target_element"` goes **early in `prompt()`**, before container resolution (`ActionUi.ts:138-143`); and fix the latent stale-container bug — `cleanup()` only nulls `this.container` when it was the popup parent, so one `target_element` prompt permanently hijacks every later popup (a pre-existing correctness fix, like §8.2's V1 gate).

### 9.2 Screens (`meteor-transfer-accounts-container`)

Follows `demo-partner-web`'s staged flow, restyled to the design system established in `meteor-mobile-bridge-panel` (same tokens as `meteor-action-button`: primary gradient `62,19,231 → 89,47,254`, radius .65rem, kicker/pill/stage-panel patterns):

1. **Review** (pre-bridge): "Transfer accounts to Meteor Wallet" — account list from `allAccountsBasicInfo` (accountId + `NEAR · <network>` rows; safe summaries only, never secrets), count, and a primary "Start secure transfer" button. Creating the bridge only on explicit click keeps the 5-minute bridge TTL from burning while the user reads.
1b. **Choose destination** (post-review, pre-bridge): the user picks the receiving wallet platform — **Meteor Web** or **Meteor Mobile**. The choice sets `TTransferTargetPlatform`, threaded `prepareMobileBridge({ transferTargetPlatform }) → prepareRequest → targetMeteorAppIdsFor` — "web" targets `meteor_wallet_web(_dev)`, "mobile" targets the configured mobile app id — and drives the bridge panel's `walletLabel` copy. The action retains the choice so refresh/re-pair rebuild bridges for the same platform. (A mobile wallet without `transfer_accounts_v1` surfaces the standard update message.)
2. **Connect** (`creating_bridge` → `waiting_for_wallet` → `wallet_verification`, incl. `busy_other_tab`): **reuse `<meteor-mobile-bridge-panel>`** for QR (gradient-frame tile), countdown/refresh, deep-link/open button, and the segmented PIN stage — all already built. Its actual reactive inputs (verified): `.session` (live `MobileBridgeSession` — PIN entry calls `session.submitPin` directly), `.contextual`, and the `.openInApp`/`.refreshCode`/`.resetIdentity` callbacks — wire them exactly as `meteor-action-ui-container.ts:566-576` does, backed by `ActionUiController`. Device-adaptive: QR-primary on desktop; "Open in Meteor Wallet" primary + QR icon-toggle on mobile browsers (existing behavior).
3. **Reveal** (`wallet_action`): the new `<meteor-transfer-key-card>`:
   - "Connection verified" stage header (green pill), warning copy: *"This key unlocks your transferred accounts. Enter it only in Meteor Wallet on the connected device."*
   - Hidden-by-default: the key string is **not in the DOM at all** before the explicit "Reveal decrypt key" click (conditional render, not CSS).
   - After reveal: key grouped in 4s in a monospace tile, **Copy** button (flips to "Copied ✓", warns about clipboard history), **key QR** (via the already-bundled `qr-code-styling`, generated into component state — never via any cache/store; follow the bridge panel's `drawQr` settings — `type: "svg"` with `roundSize: false`, which is load-bearing for dense payloads like the key string), and a **Hide** button that removes both text and QR.
   - The card pulls the key exclusively through `TransferKeyHandle.getRevealPayload(session)` on each render — if the gate condition lapses (reconnect, phase regression), the render returns to hidden automatically.
   - Bridge expiry countdown stays visible; on expiry the card wipes and transitions to the terminal state.
4. **Terminal**: reuse the compact icon stages from the mobile panel — `imported` (green check, "Accounts transferred"), `declined`, `expired` ("The transfer wasn't completed on the other device"), `cancelled`.

Accessibility/privacy details carried over from the prior review work: no key in `aria-live`, tooltips, `<input value>`, or data attributes; reveal/copy/QR are deliberate clicks; reduced-motion respected; popup keyboard-navigable via real buttons + `:focus-visible` (verified: the popup has **no** Escape handler or focus trap today — do not add Escape-to-close on the reveal screen, where an accidental close discards the key). The PIN input's Enter handling is hardened for partner pages that embed the SDK inside a sandboxed iframe — note the SDK itself creates no iframe; the popup is shadow-DOM custom elements on `document.body`.

### 9.3 Preview harness

Add transfer scenarios to `preview/action-ui/scenarios.mjs` + entry mocks (staged review, waiting, PIN, reveal-hidden, reveal-shown, each terminal state) so the screens are iterable without a live backend, same as the existing bridge panel previews. Three small harness extensions first (verified): `action-ui-preview.entry.ts` hard-codes creating `meteor-action-ui-container` — make the element scenario-driven; the scenario schema gains transfer-state fields (staged accounts, reveal state) alongside `snapshot`/`view`; and `screenshot.mjs` hard-codes the container selector for its overflow guard — include the transfer container. This harness matters extra here: dev mode swaps to the test-only client (§8.2), so the preview is the primary UI iteration loop.

---

## 10. Configuration and rollout gating

- `IMeteorConnectMobileBridgeConfig.transferAccounts.enabled` (default `false`): when off, `transferAccounts.prompt()`/`createAction()` throw `transfer_accounts_unavailable` and no UI/registry behavior changes for existing consumers. This is the SDK-side kill switch; the backend-side lever is the wallet-capability/app-id gate that already exists.
- The staging API works regardless of the flag (it is inert data handling); only the bridge flow is gated.
- Partner metadata requirements (since 0.7.0) already handled in this repo (https-only icon, bounded name/description — `normalizePartnerMetadata`).

---

## 11. Error and cancellation semantics

| Situation | SDK behavior |
|---|---|
| Empty staged set / schema-invalid input | throw `transfer_accounts_invalid_input` pre-bridge; no key generated |
| `create_bridge` → `invalid_action_request` / `idempotency_conflict` | wipe key, throw `transfer_accounts_backend_rejected` with safe reason code. Needs a small new NiceError-id classifier (match `merr_bridge` error ids, not message strings) — verified none exists in the SDK; today the raw `[merr_bridge](…)`-prefixed message lands verbatim in `snapshot.error` |
| Identity/PIN mismatch on reconnect (`mobile_bridge_identity_pin_mismatch`) | snapshot-only `failed` + `identityResetRequired` — the promise never settles (§5.2); key wiped on the `failed` phase; flow ends via re-pair or popup close → `cancelled` |
| Wallet lacks capability (`wallet_update_required` failure code) | key wiped; outcome `failed/wallet_update_required`; panel copy generalized: "Update Meteor Wallet to receive account transfers" |
| Wrong PIN ×3 (`pin_attempts_exceeded`) | existing terminal PIN semantics; key wiped; outcome `failed/pin_attempts_exhausted` |
| User closes popup pre-commitment | `cancel_bridge`, wipe key, outcome `cancelled` |
| User closes popup post-commitment | committed-close confirm; detach locally; wipe key; outcome `expired` unless a result already arrived |
| Bridge expires (incl. after reveal) | wipe key; outcome `expired` — presented as neutral "not completed"; since meteor-frontend now declines explicitly (§2.4), expiry means the user abandoned the flow |
| Signed `{ success: false }` | outcome `declined` (not an exception) |
| Signed `{ success: true }` | outcome `imported`; staged set kept (cleared only with opt-in `clearStagedOnSuccess`) |
| Result signature/domain/id/hash mismatch | throw `mobile_bridge_action_result_mismatch` (existing error), wipe key |

Never delete or mutate partner source data on any outcome. Retries always regenerate key + ciphertext (§7.3). Wallet-side retry is now well-behaved (already-imported accounts are skipped, failed remainders retry-able — §2.4), so a partner-initiated re-transfer after a partial ending is safe; the partner still only learns the single boolean outcome per attempt.

---

## 12. Test plan

**Unit (bun test, alongside existing mobile-bridge tests):**
- Staging: shared-encoder reason pass-through (`empty_secret_input`, `invalid_private_key`, `invalid_mnemonic_word_count` with `wordCount`, `invalid_secret_data`) — the detection/encoding rules themselves are upstream-tested in connect-shared 0.8.0, so SDK tests cover the mapping plus SDK-owned validation: bad accountId charset/length, `duplicate_secret`, `too_many_secrets` at 11, `too_many_accounts` at 51, secret-merge on re-staging the same identity tuple. Keep one encode→decrypt round trip (staged input → `buildAccountsTransferRequestData` → `decryptAccountsTransferRequestData`) as an integration smoke test.
- `buildAccountsTransferRequestData` integration: SDK action input validates against `vAllAccountsTransferDataEncrypted`; decrypt round trip with `decryptAccountsTransferRequestData` using the returned key; `preview_mismatch` triggers on tampered basic info.
- Registry/adapters: transfer action returns only `v2_bridge_mobile` targets (V1 + test clients domain-gated); serializes via `act_impl_meteor_wallet_core`; result hydration verifies domain/id/outputHash, with a `default:` throw on unknown `sharedActionId`; `{success:false}` → `declined`; a successful transfer settles without entering the post-execute account-refresh block (§8.1 guard — no `getActiveConnection()` call); NEAR adapters regression-tested unchanged.
- Capabilities: `create_bridge` input contains the base set ∪ `transfer_accounts_v1`; NEAR actions still send exactly the base set.
- **Key confinement canary** (§7.6) + the confinement lint script wired into CI.
- Lifecycle races: refresh regenerates key and old handle returns null; stale session cannot unlock a new handle; wipe on every terminal path is idempotent.

**Popup (preview + Playwright if available):** key absent from DOM/accessibility tree before reveal and after hide/terminal; reveal requires the gate; copy/QR require distinct clicks; committed-close confirm shows transfer copy.

**Manual E2E (release gate):** local `mc_backend` backend + `meteor-frontend` dev build: full desktop-QR flow and same-device link flow, wrong-PIN path, decline path (now implemented in meteor-frontend), abandon/silent-expiry path, duplicate-account and partial-failure retry behavior. Include a **worst-case timing run**: realistic slow scan → PIN → manual key entry, to confirm the production bridge TTL comfortably covers wallet-side key entry (the bridge must stay alive until `complete_action`); if it's tight, raise a backend ask for a transfer-specific TTL or extension-on-claim. Note: `mc_backend`'s own Phase 5 manual browser E2E and the FEEDBACK doc's acceptance §5 (decline / delivery-error / claim-retry observable from the partner side) are both still marked pending — coordinate so one pass covers all three.

---

## 13. Implementation order

1. **Registry + gating** (§8.1, §8.2) — including the three pre-existing correctness fixes surfaced by verification: the V1-client domain gate, the test-client domain gate, and the `ExecutableAction` post-execute guard (negative-id block). Type-check + regression tests green.
2. **Adapters + capabilities + app ids** (§8.3, §8.4, §8.6) — transfer action executable end-to-end headlessly against a local backend (result via demo-wallet-web).
3. **Staging API + storage** (§5.1, §6).
4. **`transferAccounts` namespace (`prompt`/`createAction`) + `TransferKeyHandle` + attachment threading** (§5.2, §7) + confinement script + canary tests.
5. **Popup UI** (§9) — container routing, review screen, panel reuse, reveal card, terminal states, previews.
6. **Wallet-link/opener work for web-wallet targets** (§8.5).
7. **Test suite completion + manual E2E vs meteor-frontend** (§12).
8. Flip `transferAccounts.enabled` default only after the E2E pass and the meteor-frontend gaps below are triaged.

---

## 14. Future steps and cross-repo asks

### 14.1 Meteor Mobile (`meteor-v2-apps` repo)
Meteor Mobile is the same app this SDK already targets for regular Meteor Connect actions (QR/deep link/push via `meteor_wallet_mobile` / `meteor_wallet_mobile_dev`); it just doesn't handle the transfer action yet. The receiver pattern is already proven in `demo-wallet-expo` (QR key scanning via `looksLikeTransferKey`, sensitive-push variant landed in mc_backend Phase 6). When Meteor Mobile ships the transfer resolver + advertises `transfer_accounts_v1`:
- add `meteor_wallet_mobile` / `meteor_wallet_mobile_dev` (already existing `EMeteorAppId` values — no shared-package change needed) to `transferAccounts.meteorAppIds`;
- enable push-to-paired-wallet delivery for transfer (still PIN-gated by policy — the demo proved pushed transfers land on `wallet_verification`);
- the reveal card's key QR becomes the primary cross-device entry (the phone scans it), so desktop→phone UX should be re-checked then. The existing device-adaptive QR/open-link handling in the bridge panel carries over unchanged.

### 14.2 Upstream asks (tracked, not blockers)
- ~~**Real web app id**~~ — **landed in 0.8.0**: `meteor_wallet_web` / `meteor_wallet_web_dev` exist in `EMeteorAppId` with backend wallet links registered (§2.4, §8.4).
- ~~**Shared secret-encoding builder**~~ — **landed in 0.8.0**: `buildAccountSecretData` in `connect-shared`; the demo store and this SDK both consume it (§3.1, §5.1).
- ~~**meteor-frontend migration to the real web id**~~ — **done**: meteor-frontend identifies as `meteor_wallet_web_dev`/`meteor_wallet_web` (env-selected); the SDK defaults target these ids only (§2.4, §8.4).
- ~~**meteor-frontend gaps**~~ — **implemented 2026-08-06** (see `mc_backend/FEEDBACK-meteor-frontend-transfer-gaps.md`, marked IMPLEMENTED; client-side pieces released as `@meteorwallet/connect` 0.9.0): explicit signed `{ success: false }` declines, `receiving_action`/`actionDeliveryError` rendering, retry-able `claim_bridge` with typed failure classification, and sequential per-account import. §2.4 and §11 reflect the new behavior. Still pending there: the feedback doc's manual E2E verification (fold into §12's release-gate pass).
- **Richer per-account transfer result** (tracked, later): the wire output remains `{ success: boolean }`, so partial-import detail never reaches the partner. If real-world partial failures justify it, this needs a richer `transfer_accounts` output (or `formatVersion: 2`) designed in `connect-shared`.
- **Cross-bridge PIN-attempt accounting** and PIN-freshness window — open items in mc_backend Phase 6; no SDK action needed, but the SDK's retry UX should not make brute-force easier (regenerating bridges is already rate-limited by user gesture in our flow).

---

## 15. Acceptance criteria

1. A partner can stage accounts via the SDK API with the exact encodings meteor-frontend decodes, bounded by the shared constants.
2. `transferAccounts.prompt()` runs the full popup flow against the connect backend and resolves to one of the five outcome statuses (never rejecting for user-driven endings); the NEAR action suite is behaviorally unchanged.
3. The transfer key exists only inside `TransferKeyHandle` + the reveal card; the canary suite and confinement lint prove it absent from wire, storage, logs, snapshots, URLs, and pre-reveal DOM.
4. Reveal requires authoritative `wallet_action` **and** the handle's bound session instance (§7.1); every terminal/teardown path wipes the key idempotently; refresh regenerates key+ciphertext on a fresh session (which mints its own `partnerRequestId`).
5. `create_bridge` carries `transfer_accounts_v1` and web-wallet app ids; capability-lacking wallets fail with the update message before any reveal.
6. Signed-result verification (domain/id/signature/outputHash) gates all outcomes; `success:false` and expiry map to `declined`/`expired` without exceptions; source data is never mutated by any outcome.
7. Manual E2E against local backend + meteor-frontend dev passes for QR and same-device link paths.
8. Feature is dark by default (`transferAccounts.enabled: false`) and enabling it requires no code changes for existing SDK consumers.
