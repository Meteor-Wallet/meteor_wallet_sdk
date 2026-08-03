# Secure Partner Wallet Account Transfer Plan

**Status:** Proposed implementation plan  
**Primary repository:** `meteor_wallet_sdk`  
**Primary SDK area:** `packages/meteor-sdk-v1/src/MeteorConnect`  
**External dependencies:** `@meteorwallet/connect-shared`, `@meteorwallet/connect`, Meteor Connect backend, and Meteor Wallet mobile  
**Prepared:** 2026-08-03

## 1. Objective

Allow a trusted partner wallet application to transfer a user's wallet accounts into Meteor Wallet through the existing Meteor Connect mobile bridge while keeping every mnemonic and private key end-to-end encrypted.

The encrypted account payload goes through the bridge. Its decrypt key does not. The browser popup may reveal the decrypt key only after the bridge has cryptographically established the intended Meteor Wallet connection. The user then enters, pastes, or scans that key in Meteor Wallet, where decryption, secret validation, final consent, and secure import occur.

This plan uses the newly exported shared contracts:

```ts
import {
  act_impl_meteor_wallet_core,
  vAccountBasicData,
  vAccountSecretData,
  vAccountTransferDataDecrypted,
  vAllAccountsTransferDataDecrypted,
  vAllAccountsTransferDataEncrypted,
} from "@meteorwallet/connect-shared";
```

The SDK action ID should be:

```text
meteor_wallet_core::transfer_accounts
```

The serialized Nice Action payload produced by the new export has `domain: "meteor_wallet_core"`,
`allDomains: ["meteor_connect", "meteor_wallet_core"]`, and `id: "transfer_accounts"`.
The current shared input and output are:

```ts
input = {
  allAccountsBasicInfo: Array<{
    blockchainId: "near";
    networkId: "mainnet" | "testnet";
    accountId: string;
  }>;
  encryptedData: {
    nonce: string;      // base64
    ciphertext: string; // base64, including the AES-GCM authentication tag
  };
};

output = { success: boolean };
```

## 2. Executive recommendation

Implement account transfer as a dedicated, mobile-only Meteor Connect action with these non-negotiable properties:

1. The partner encrypts the complete `vAllAccountsTransferDataDecrypted` object locally before creating the Meteor Connect action.
2. Only the `vAllAccountsTransferDataEncrypted` value is serialized into `act_impl_meteor_wallet_core.action.transfer_accounts` and sent through the bridge.
3. The decrypt key is held in an ephemeral, non-serializable secret handle owned by the action/session. It is never included in an action input, expanded input, result, URL, QR/deep link, bridge request, local storage, log, error, or analytics event.
4. Account transfer never uses background push. It always requires an explicit QR scan or **Open in Meteor Wallet** gesture. This avoids a previously paired wallet auto-claiming in the background and causing the key to appear without current user participation.
5. The popup treats `MobileBridgeSession` phase `wallet_action` as the authoritative connection-confirmed gate. Before that phase, the decrypt key is neither rendered nor made available to UI callbacks.
6. After `wallet_action`, the popup displays **Connection confirmed** and requires a second explicit **Reveal decrypt key** click. This protects against accidental exposure and shoulder-surfing while still meeting the post-PIN/post-connection requirement.
7. Meteor Wallet accepts the key only while handling the matching transfer action, decrypts locally, validates the authenticated plaintext against the clear account summary, validates each secret against its claimed account, shows a final import review, and writes to secure wallet storage only after explicit approval.
8. Both sides use the shared Nice Action domain and shared Valibot schemas as the source of truth. Do not create a parallel account-transfer JSON contract inside the SDK.

## 3. Current-state findings

### 3.1 Shared contracts now available

`@meteorwallet/connect-shared@0.4.3` exports:

- `act_impl_meteor_wallet_core`, containing `transfer_accounts`;
- `vBlockchainId`, currently only `"near"`;
- `vCryptoGenericNetworkId`, currently `"mainnet" | "testnet"`;
- `vAccountSecretType`, currently `"mnemonic" | "private_key"`;
- basic, decrypted, and encrypted account-transfer schemas.

The encrypted schema intentionally exposes basic account metadata while encrypting the secret-bearing account list. Therefore private keys and mnemonics can be hidden from the bridge service, but account IDs, networks, account count, ciphertext size, timing, partner identity, and destination wallet identity are not hidden from the bridge service. This metadata limitation must be accepted explicitly before release; see section 15.

### 3.2 SDK action registry is NEAR-only

The SDK currently:

- limits `TMCActionDomainId` to `"near"`;
- spreads only `MCNearActions` into `MCActionRegistryMap`;
- converts every mobile request through `nearActionToMobileBridge()`;
- hydrates every mobile result through `act_impl_near`;
- offers a no-account mobile connection shell only for `near::sign_in` and `near::sign_in_and_sign_message`.

Account transfer therefore needs an SDK action definition plus domain-aware mobile request/result dispatch. It must not be shoehorned into a fake NEAR sign-in action.

### 3.3 Existing bridge phase is the correct reveal boundary

`MobileBridgeSession` maps authoritative partner bridge state to:

```text
initializing
  -> creating_bridge
  -> waiting_for_wallet
  -> wallet_verification  (first pairing; PIN entered in browser popup)
  -> wallet_action        (wallet connection accepted and action committed)
  -> completed | failed | cancelled
```

For first pairing, the browser submits the 4-digit PIN displayed by Meteor Wallet. The bridge enters `wallet_action` only after successful verification. For a trusted existing pairing, the bridge may skip `wallet_verification` and enter `wallet_action` directly.

`wallet_action`, not push delivery, QR creation, deep-link creation, or a successful `verify_pin()` call return, is the authoritative gate. The realm state is the source of truth and handles races, reconnects, and an ambiguous network response.

### 3.4 Background push is too weak for this action

The existing mobile integration documents and implements an important behavior: a trusted paired wallet may auto-claim a pushed action and enter `wallet_action` without a fresh PIN or user tap. That is acceptable for actions already contextually routed to a mobile-connected account. It is not the strongest user-presence signal for exposing an account-export decrypt key.

The transfer action has no existing Meteor-connected account target, so it should deliberately return a mobile connection shell without selecting a paired push wallet. QR/deep-link remains compatible with a trusted pairing, but the user must actively scan or open the link for this transfer.

### 3.5 Existing logging would leak a key if it were put in action input

`MeteorConnect.createAction()` debug-logs `expandedRequest.expandedInput`. The executable action also retains its request for the action lifetime. Consequently, adding `decryptKey` to the generic action input or expanded input would create an immediate secret-leak risk.

The decrypt key requires a separate secret channel inside the SDK, with redaction enforced structurally rather than relying on developers to remember not to log a field.

### 3.6 The popup is presentation isolation, not a hostile-origin security boundary

The Lit popup is mounted into the partner page's document. Shadow DOM prevents accidental styling collisions, but it does not protect a secret from malicious JavaScript executing in the same origin. This design can guarantee that the key is not sent through Meteor infrastructure and is not accidentally rendered before bridge confirmation. It cannot protect the key or the original wallet secrets from a compromised partner wallet page that already had access to them.

Production documentation must state this boundary plainly. Partner wallets remain responsible for CSP, dependency integrity, release security, and avoiding untrusted third-party scripts on the export screen.

## 4. Security model

### 4.1 Assets

- mnemonic phrases;
- full-access private keys;
- the account-transfer decrypt key;
- decrypted transfer plaintext;
- the user's account list and network metadata;
- proof that the browser is connected to the intended Meteor Wallet identity;
- integrity of the import decision and destination wallet state.

### 4.2 Trusted components

- the partner wallet code that already holds the source secrets;
- the installed Meteor Wallet application and its secure key storage;
- audited releases of `@meteorwallet/connect`, `@meteorwallet/connect-shared`, and this SDK;
- Web Crypto implementations on supported browsers and devices.

### 4.3 Untrusted or partially trusted components

- the bridge backend for secret confidentiality;
- transport networks;
- QR/deep-link observers;
- logs, telemetry pipelines, crash reporters, browser history, and clipboard history;
- stale or incompatible Meteor Wallet versions;
- other tabs sharing the partner identity;
- malformed or malicious partner payloads received by Meteor Wallet.

### 4.4 Required guarantees

- The bridge/backend can never decrypt account secrets.
- Possessing the encrypted bridge payload alone is insufficient to recover secrets.
- Possessing the QR/deep link alone is insufficient to recover secrets.
- The decrypt key appears in the browser UI only after authoritative connection confirmation.
- A modified ciphertext fails AES-GCM authentication.
- A modified clear account summary cannot cause silent import because the wallet compares it exactly with authenticated decrypted data.
- A wrong-account secret, invalid mnemonic/private key, duplicate/conflicting import, oversized payload, unsupported version, or incompatible wallet fails closed.
- Cancellation, expiry, failure, completion, and disposal remove the key from the DOM and best-effort wipe mutable in-memory buffers.

### 4.5 Explicit non-guarantees

- No browser UI can prevent screen capture, photography, browser extensions, devtools, or malicious same-origin script from reading a displayed key.
- JavaScript cannot guarantee physical erasure of every engine copy, especially once a secret has been converted to an immutable string.
- The current shared input reveals account metadata to the backend.
- Encryption does not prove the partner wallet is benevolent; Meteor Wallet must validate all imported material independently.

## 5. Freeze an interoperable transfer cryptography profile before coding

The new schemas specify the data shapes, but they do not yet fully specify key encoding, key length, plaintext serialization, the meaning of `prefixedBase64DataString`, size limits, or schema-version negotiation. Two implementations can satisfy the schemas and still be unable to decrypt each other's payloads. Treat this as a release blocker, not an implementation detail.

### 5.1 Recommended profile: `meteor-wallet-account-transfer-v1`

Use one documented profile on partner and wallet sides:

| Item | Required v1 behavior |
|---|---|
| Cipher | AES-256-GCM via Web Crypto / platform secure crypto |
| Key | 32 random bytes from a CSPRNG; never a user-created password |
| Nonce | fresh 12-byte random nonce for every encryption; never reuse a key/nonce pair |
| Authentication tag | 128 bits, carried as part of Web Crypto ciphertext |
| Plaintext encoding | UTF-8 JSON representing exactly `vAllAccountsTransferDataDecrypted` |
| Ciphertext encoding | standard padded base64 as required by `vEncryptedAesGcmPayload` |
| Display key encoding | versioned, checksummed human transport encoding such as `MWX1-...`; normalization rules shared by both sides |
| Validation | shared schema validation before encryption and after decryption |
| Metadata binding | exact normalized multiset equality between `allAccountsBasicInfo` and the projection of decrypted accounts |

The existing `encryptTextDataWithAesGcmKey()` utility already generates a 12-byte nonce and returns the required `{ nonce, ciphertext }` shape. Import the raw 32 bytes as a non-extractable AES-GCM `CryptoKey`, then use the shared utility. The wallet uses the matching decrypt utility after parsing the displayed key.

Do not use PBKDF2 or a human password for v1. A random transport key avoids offline dictionary attacks against bridge-captured ciphertext.

The display encoding should be optimized for scanning/pasting first and manual entry second. A 256-bit key is long when typed. The post-confirmation popup should therefore offer:

- a text key with unambiguous grouping and checksum;
- an explicit copy button with a clipboard warning;
- an optional key-only QR shown only after a second explicit click;
- manual typing as the fallback.

The key-only QR must contain only the versioned decrypt key, never the bridge link, partner secret, action payload, or account metadata. Meteor Wallet must accept it only from the active transfer-key entry screen.

### 5.2 Recommended shared-contract hardening

Before production adoption, update `@meteorwallet/connect-shared` so the protocol is self-describing and strict. Prefer adding these fields while the action is still new:

```ts
{
  schemaVersion: 1,
  encryptionProfile: "meteor-wallet-account-transfer-v1",
  allAccountsBasicInfo: [...],
  encryptedData: { nonce, ciphertext }
}
```

Also:

- export inferred TypeScript input/output types for every new schema;
- define and validate the exact `prefixedBase64DataString` grammar;
- constrain account count, secrets per account, account ID length, encoded secret size, nonce decoded length, and maximum ciphertext bytes;
- reject duplicate basic account tuples;
- document whether multiple secret entries are alternatives or all belong to one account;
- add canonical normalization/projection helpers used by both partner and wallet;
- add key generation/format/parse/encrypt/decrypt helpers so cryptographic conventions are not independently reimplemented;
- add cross-runtime test vectors containing key bytes, display key, plaintext bytes, nonce, ciphertext, and expected validation result.

If changing the current action input is impossible, freeze all of the above as the semantics of a new authenticated wallet capability, and use a new action ID for any future incompatible profile. Do not silently change the cryptography behind the same action ID.

### 5.3 Capability negotiation is mandatory

The current required capability list covers account-explicit NEAR actions, cancellation, and idempotent bridge requests. It does not prove that a wallet understands secure account transfer.

Add a shared capability such as:

```ts
EWalletProtocolCapability.meteor_wallet_core_transfer_accounts_v1
```

Then make mobile preparation carry per-action requirements instead of always passing the one global list. The backend must reject an incompatible wallet before exposing or committing the action. Older paired-wallet records without signed proof of this capability are not eligible.

Do not add transfer support to the global capability list for every NEAR signing action; that would unnecessarily disable otherwise compatible wallets. Requirements belong to the prepared action.

## 6. Public SDK API

### 6.1 Use a dedicated constructor, not a generic secret-bearing action input

Recommended API:

```ts
const action = await meteorConnect.createWalletAccountTransferAction({
  transferData,      // validated shared encrypted payload only
  decryptKeyBytes,   // Uint8Array(32), UI-only secret
});

const result = await action.promptForExecution();
// result: { success: true }
```

`transferData` conforms to the shared encrypted schema. `decryptKeyBytes` must be exactly 32 bytes under the recommended v1 profile. The SDK should take an internal copy immediately so caller mutation cannot change what is displayed. The caller is instructed to wipe its own buffer after action creation.

The method constructs a normal registry action using only:

```ts
{
  id: "meteor_wallet_core::transfer_accounts",
  input: transferData,
}
```

and separately attaches an internal `SensitivePresentationHandle` to the resulting `ExecutableAction`. The generic registry request and `expandedInput` never contain the key.

### 6.2 Sensitive presentation handle

Add a small internal abstraction with these properties:

- owns a copied `Uint8Array`, not a preformatted string;
- has no `toJSON`, string coercion, public enumerable fields, or log representation;
- returns `"[REDACTED]"` from any diagnostic representation;
- formats the display key only after a guarded call from the transfer UI;
- authorizes that call only while the bound current session is in `wallet_action`;
- supports at most the intended reveal operations for the active UI instance;
- wipes its byte buffer on completion, failure, cancellation, expiry, refresh, identity reset, UI disposal, and SDK disposal;
- never enters Lit reactive properties until after the reveal gate;
- removes the rendered string and key QR synchronously when leaving the valid state.

This is defense against accidental disclosure, not a same-origin sandbox. Keep that limitation documented and tested.

### 6.3 Validation at the SDK boundary

Before bridge creation:

- parse `transferData` with `vAllAccountsTransferDataEncrypted`;
- enforce the additional v1 semantic/size checks until they exist in shared schemas;
- verify the nonce decodes to 12 bytes;
- verify ciphertext is non-empty and under the agreed maximum;
- reject duplicate account tuples;
- validate the key length/profile;
- reject use when `crypto.subtle` is unavailable;
- reject `target_element` rendering for this action, or force the standard popup, so the key cannot be deliberately mounted into an arbitrary partner DOM subtree.

Validation errors occur before any bridge is created and must not echo input values.

## 7. End-to-end flow

```mermaid
sequenceDiagram
    participant H as User
    participant P as Partner wallet
    participant U as Meteor Connect popup
    participant B as Bridge/backend
    participant W as Meteor Wallet

    P->>P: Validate and normalize decrypted accounts
    P->>P: Generate random key and AES-GCM encrypt
    P->>U: Create transfer action with ciphertext + ephemeral key handle
    U->>B: Create bridge with shared transfer_accounts request
    Note over U,B: Decrypt key is absent
    U-->>H: Render QR / Open in Wallet
    W->>B: Claim bridge with signed identity/capability proof
    alt first pairing
        B-->>U: wallet_verification
        W-->>H: Display 4-digit PIN
        H->>U: Enter PIN
        U->>B: verify_pin
    end
    B-->>U: wallet_action
    B-->>W: Authenticated encrypted transfer action
    U-->>H: Connection confirmed; offer Reveal key
    H->>U: Click Reveal
    U-->>H: Display text/key QR locally
    H->>W: Type, paste, or scan decrypt key
    W->>W: Decrypt, schema-check, metadata-match, validate secrets
    W-->>H: Show final account import review
    H->>W: Approve
    W->>W: Atomically store valid accounts in secure storage
    W->>B: Signed { success: true } Nice Action result
    B-->>U: E2E encrypted, signed result
    U->>U: Verify signature/domain/id/hash; wipe key
    U-->>P: Resolve { success: true }
```

### 7.1 Reveal-state contract

| Bridge/UI state | Decrypt-key behavior |
|---|---|
| initializing / creating bridge | key bytes remain private in handle; no formatter access |
| waiting for wallet | key hidden; QR/deep link contains no key |
| wallet verification | key hidden during every PIN attempt |
| busy in another tab / reconnecting before commitment | key hidden |
| wallet action, not yet revealed | show connection-confirmed state and explicit Reveal control |
| wallet action, revealed | render key and optional key QR; wallet remains the only import/decrypt location |
| reconnecting after wallet action | keep action committed, but hide the key until authoritative state is restored; never fall back to another wallet target |
| completed | remove key immediately, wipe buffer, show success briefly, resolve action |
| failed / cancelled / expired | remove key immediately, wipe buffer, reject action |
| popup close after commitment | warn that the wallet action may continue, remove/wipe browser key, never claim the transfer succeeded |
| refresh / identity reset before commitment | wipe the old key only if the whole transfer action is abandoned; a newly encrypted payload must use a new key and nonce |

Never reuse the same encrypted payload/key across a newly created transfer session after an ambiguous committed outcome. Query/reconcile the existing authoritative bridge first. If a genuinely new export is required, encrypt again with a new key and nonce.

## 8. SDK architecture and file-level plan

### Phase 1 — shared protocol and capability gate

External package work, completed before enabling the SDK action:

- harden/version the transfer schema or formally freeze the v1 profile;
- export inferred transfer types and normalization/crypto helpers;
- add `meteor_wallet_core_transfer_accounts_v1` wallet capability;
- allow bridge creation to declare action-specific required capabilities;
- update backend claim validation and paired-wallet capability persistence;
- implement the capability and transfer resolver in Meteor Wallet;
- publish compatible `connect-shared` and `connect` versions, then update `packages/meteor-sdk-v1/package.json` together.

### Phase 2 — SDK action registry

Add `packages/meteor-sdk-v1/src/MeteorConnect/action/mc_action.meteor_wallet_core.ts`:

- define `IMCAInput_MeteorWalletCore_TransferAccounts` from the shared encrypted schema type;
- define output as `{ success: boolean }`;
- add `"meteor_wallet_core::transfer_accounts"` with `executionTargetSource: "on_execution"`;
- add action metadata declaring mobile-only execution, secret-display UI, disabled push, redacted logging, and transfer-v1 capability requirements.

Update:

- `mc_action.types.ts` to include the `meteor_wallet_core` domain and typed security/UI metadata;
- `mc_action.combined.ts` to merge `MCMeteorWalletCoreActions`;
- `src/index.ts` to export the public input/output types and dedicated constructor surface without re-exporting internal secret handles.

Prefer typed metadata over repeated `request.id === ...` branches. Suggested additions:

```ts
interface IMCActionMeta {
  // existing fields...
  allowedExecutionTargets?: TMeteorConnectionExecutionTarget[];
  mobileDelivery?: "standard" | "explicit_open_only";
  requiredWalletCapabilities?: EWalletProtocolCapability[];
  logging?: "standard" | "redacted";
  uiKind?: "standard" | "account_transfer";
}
```

### Phase 3 — dedicated public construction and secret lifecycle

Add an internal module such as:

```text
MeteorConnect/security/SensitivePresentationHandle.ts
```

Then update:

- `MeteorConnect.ts` with `createWalletAccountTransferAction()`;
- `ExecutableAction.ts` to own/dispose an optional sensitive presentation handle and expose only narrowly gated UI methods;
- `ActionUi.ts` to force the standard popup for sensitive actions and guarantee disposal in every `finally`/cleanup path;
- `MeteorLogger.ts` or the action-log serializer to structurally redact sensitive actions.

Required invariants:

- no secret in `request`, `expandedInput`, execution target configuration, session snapshot, account storage, or connection record;
- no secret in thrown error messages or logger arguments;
- no implicit stringification of the key;
- all terminal and teardown paths are idempotent;
- the action cannot be executed without its sensitive handle when constructed through the public transfer API;
- direct generic creation of this action is rejected with a safe error directing callers to the dedicated method, unless a type-safe internal overload can make omission impossible.

### Phase 4 — domain-aware mobile request conversion

Replace the NEAR-only converter entry point with a dispatcher, for example:

```text
mobile_bridge/sdkActionToMobileBridge.ts
mobile_bridge/adapters/near.ts
mobile_bridge/adapters/meteorWalletCore.ts
```

The transfer adapter must do only this:

```ts
act_impl_meteor_wallet_core.action.transfer_accounts
  .request(validatedTransferData)
  .toJsonObject();
```

It must never receive the sensitive handle or decrypt key.

Generalize `IMobileBridgePreparedAction`:

- replace the NEAR-only `sharedActionId` union with a discriminated prepared-action kind;
- carry the shared action domain/id needed for strict result matching;
- carry per-action required protocol/capabilities;
- carry `deliveryPolicy: "explicit_open_only"` for transfer;
- keep existing pending function-call-key and retained-message state only on NEAR variants.

In `MeteorConnectMobileBridgeClient`:

- return a `v2_bridge_mobile` connection shell for transfer actions;
- return no v1 web/extension target for transfer;
- never call `selectPushWallet()` for an `explicit_open_only` action;
- pass prepared action capability requirements into `create_bridge()`;
- keep current single-session, lease, cancellation, expiry, and idempotency behavior.

### Phase 5 — domain-aware signed result conversion

Split `mobileBridgeResultToSdk()` into shared verification plus domain-specific hydration:

1. require `signatureVerified === true`;
2. require a Nice Action result JSON object;
3. compare domain and action ID with the prepared request;
4. hydrate using the matching shared domain (`act_impl_near` or `act_impl_meteor_wallet_core`);
5. compare the recomputed `outputHash` with the signed wire `outputHash`;
6. throw a safe typed action error on `ok:false`;
7. for transfer, require `output.success === true` and return `{ success: true }`.

Do not interpret `{ success: false }` as a successful SDK resolution. The wallet should use an action error for rejection/failure and reserve `{ success: true }` for a committed or idempotently already-completed import.

### Phase 6 — popup transfer UX

Either add a focused `meteor-account-transfer-panel` composed around the existing mobile bridge panel or add an action-specific stage renderer. Avoid putting account-transfer branching throughout generic QR/PIN code.

Before connection confirmation, preserve all current bridge UI:

- QR/deep link;
- expiry and refresh;
- first-pairing PIN and attempt limit;
- reconnect, cancellation, identity reset, and wallet-update states.

At `wallet_action`, replace the generic **Review and approve this request in Meteor Mobile** stage with:

1. **Secure connection confirmed**;
2. partner name and intended Meteor Wallet destination, using authenticated bridge metadata where available;
3. account count and networks from clear basic info, with no secrets;
4. a warning that the displayed key unlocks the transfer and should be entered only in Meteor Wallet;
5. an explicit **Reveal decrypt key** button;
6. after reveal, grouped text, copy button, optional key QR, and **I entered the key** helper state;
7. continuing bridge expiry/reconnect status;
8. no browser-side success button—the signed wallet result is authoritative.

Accessibility and privacy details:

- the key must not exist in the rendered tree, accessibility tree, title, tooltip, data attribute, or hidden input before reveal;
- do not use an `<input value="...">` for display;
- do not announce the full key through `aria-live` automatically;
- the reveal/copy/QR controls require deliberate clicks;
- copying is never automatic and warns that clipboard managers may retain the key;
- hide the key when the document becomes hidden if usability testing permits, with an explicit re-reveal;
- respect reduced motion and preserve the popup's responsive bounds;
- never include account IDs or the key in remotely loaded image/font URLs.

### Phase 7 — partner integration documentation and test surface

Add a transfer example to `packages/meteor-sdk-v1-test-web` that uses synthetic testnet secrets only. Never commit a live mnemonic/private key fixture.

Document:

- how a partner constructs and validates the decrypted shared object;
- how it encrypts with the frozen v1 helper/profile;
- how to call the dedicated transfer API;
- that the key is out-of-band and UI-only;
- metadata visible to the backend;
- required CSP/release-integrity posture;
- buffer wiping expectations;
- error/cancellation behavior;
- production feature gating and compatible Meteor Wallet versions.

## 9. Meteor Wallet implementation requirements

This work is outside this repository but is part of the same release gate.

### 9.1 Action resolver

- Register `act_impl_meteor_wallet_core.action.transfer_accounts` from the shared package.
- Advertise the signed `meteor_wallet_core_transfer_accounts_v1` capability only in builds with the complete, enabled resolver.
- Show the partner identity, account count, networks, and a clear high-risk import warning before asking for the key.
- Accept only the versioned transfer-key format from keyboard, paste, or the transfer-specific scanner.
- Never accept a key from the bridge request, deep link, notification payload, or generic QR route.

### 9.2 Decrypt and validate locally

On key submission:

1. normalize and checksum-validate the display key;
2. import the raw bytes into a non-extractable AES-GCM key;
3. decrypt `encryptedData` locally;
4. UTF-8 decode and JSON parse with duplicate-key-safe parsing if available;
5. validate with `vAllAccountsTransferDataDecrypted`;
6. project the decrypted accounts to basic data and compare an exact normalized multiset with `allAccountsBasicInfo`;
7. reject duplicates, unsupported networks/types, unknown fields under the frozen profile, excessive sizes, empty secret lists, and malformed encodings;
8. validate mnemonic checksum/language/path policy and private-key syntax;
9. derive or query the NEAR public keys and prove each secret is authorized for the claimed account/network before import;
10. stage the validated accounts without writing them yet.

Use a trusted, configured NEAR RPC and apply timeouts. A transient RPC failure is not permission to skip ownership validation.

### 9.3 Final review and atomic import

After successful decryption/validation, show the authenticated account list and secret types, never the secret values. Require a final wallet-local biometric/PIN/approval step consistent with Meteor Wallet's existing high-risk import policy.

Import rules:

- never overwrite an existing different secret silently;
- exact existing entries are idempotent successes;
- conflicting entries require an explicit wallet-local resolution or fail the whole action;
- prefer an atomic all-or-nothing transaction so `{ success: true }` has a precise meaning;
- encrypt imported secrets immediately with the wallet's normal secure-storage mechanism;
- clear staging data and key material on backgrounding, rejection, timeout, crash recovery, or completion;
- store a non-secret transfer fingerprint if needed for replay/idempotency, not the decrypt key or plaintext.

Only after durable storage succeeds should the wallet return a signed Nice Action success result.

### 9.4 Wallet error behavior

Return typed/safe errors for:

- user rejected;
- invalid decrypt key or authentication failure;
- malformed/unsupported transfer profile;
- summary/plaintext mismatch;
- invalid or unauthorized account secret;
- duplicate/conflict requiring manual resolution;
- secure-storage failure;
- transfer expired;
- wallet update required.

Do not reveal which character of a key was wrong, secret values, derived keys, plaintext snippets, or stack traces to the partner/backend.

## 10. Data validation and limits

Agree on conservative limits before release and enforce them at all three layers: shared schema where possible, SDK before bridge creation, and wallet before allocation/decryption.

Recommended initial policy to review with product requirements:

| Limit | Proposed starting value |
|---|---:|
| accounts per transfer | 20 |
| secrets per account | 4 |
| account ID length | NEAR protocol maximum plus no surrounding whitespace |
| decoded mnemonic bytes | 512 |
| decoded private-key bytes/string | 256 |
| total decoded plaintext | 64 KiB |
| total ciphertext | plaintext maximum + GCM tag and small JSON/base64 overhead |
| nonce bytes | exactly 12 |
| decrypt-key bytes | exactly 32 for v1 |

These are denial-of-service and ambiguity controls, not merely UX limits. The wallet remains authoritative even if an older SDK omits them.

`allAccountsBasicInfo` equality must compare normalized tuples, not array position alone:

```text
(blockchainId, networkId, accountId)
```

Reject duplicates before comparing. Do not lowercase NEAR account IDs unless the NEAR validation rules explicitly require and preserve that normalization; never silently transform secret-bearing identity data.

## 11. Logging, telemetry, and storage policy

### 11.1 Never log

- decrypt key bytes or formatted key;
- encrypted payload or nonce/ciphertext;
- decrypted payload;
- mnemonics/private keys or their hashes;
- PIN values;
- key-entry contents or clipboard events;
- full action objects for this action.

### 11.2 Allowed structured telemetry

- transfer action started;
- delivery path `qr` or `deep_link` (never key QR contents);
- coarse bridge phase;
- first pairing required yes/no;
- connection confirmed;
- key reveal clicked yes/no;
- wallet result success or safe error code;
- duration and coarse account count bucket;
- compatible-wallet/capability failure.

Account IDs, exact account counts, ciphertext sizes, partner secrets, bridge links, and wallet public keys should be omitted or minimized according to the existing privacy policy.

### 11.3 Persistence

The SDK must not persist the key, ciphertext, or transfer request. The bridge backend retains only the action data required by its existing expiring lifecycle. Meteor Wallet persists only successfully imported wallet data under its established secure-storage policy and optional non-secret idempotency fingerprints.

## 12. Error and cancellation semantics

Define stable SDK errors without embedding source values:

```text
account_transfer_invalid_input
account_transfer_invalid_key_length
account_transfer_payload_too_large
account_transfer_wallet_unsupported
account_transfer_mobile_only
account_transfer_connection_failed
account_transfer_cancelled_before_commit
account_transfer_detached_after_commit
account_transfer_wallet_rejected
account_transfer_wallet_validation_failed
account_transfer_wallet_storage_failed
account_transfer_result_invalid
account_transfer_expired
```

Rules:

- Before `wallet_action`, popup close invokes normal bridge cancellation and wipes the key.
- At/after `wallet_action`, the action is committed. Closing detaches locally, wipes the browser key, warns that the phone flow may still exist, and never starts a web/extension fallback.
- If the user closes after reveal but before entering the key, Meteor Wallet eventually cancels/expires because it cannot decrypt.
- A failed PIN never reveals the key.
- A reconnect must restore authoritative bridge state before reveal is re-enabled.
- A signed `{ success: true }` is the only success resolution.
- No retry path may reuse the key with a different nonce/payload binding accidentally.

## 13. Test plan

### 13.1 Shared contract and crypto test vectors

- valid mnemonic-only, private-key-only, and mixed-secret payloads;
- mainnet/testnet and multiple accounts;
- exact deterministic test vector across browser and native wallet runtime;
- 32-byte key format round trip, normalization, grouping, checksum, and typo rejection;
- fresh 12-byte nonce on every encryption;
- ciphertext or nonce bit flip fails authentication;
- wrong key fails without plaintext leakage;
- malformed UTF-8/JSON/schema fails;
- clear/decrypted summary mismatch and duplicates fail;
- every size/count boundary and one-over-boundary case;
- future/unknown profile rejected before decryption.

### 13.2 SDK action and adapter tests

- registry accepts the typed transfer action and offers only `v2_bridge_mobile`;
- request serializes through `act_impl_meteor_wallet_core` and round-trips through the shared hydrator;
- serialized action, bridge create input, deep link, and QR contain ciphertext but never decrypt key;
- prepared transfer policy never selects or sends push, even with paired wallets present;
- transfer requires the new wallet capability;
- old/missing/forged capability is rejected before `wallet_action`;
- signed transfer success verifies domain, ID, signature, and output hash;
- tampered domain/ID/hash/signature and `{ success: false }` reject;
- NEAR request/result adapters retain all existing behavior.

### 13.3 Secret non-disclosure tests

Seed a distinctive canary decrypt key and assert it is absent from:

- `JSON.stringify(request)` and `expandedInput`;
- every mocked bridge/backend call;
- deep-link and both QR payloads before reveal;
- local/session storage and lease records;
- logger mocks at basic/debug levels;
- thrown errors and error causes exposed to consumers;
- DOM and accessibility tree before `wallet_action`;
- DOM before the explicit Reveal click;
- DOM immediately after complete/fail/cancel/expiry/disconnect;
- package snapshots and test artifacts.

Also spy on analytics/crash-report hooks used by the host test surface.

### 13.4 Session and race tests

- first pairing: QR -> PIN -> `wallet_action` -> reveal;
- wrong PIN attempts 1 and 2 never reveal; third wrong is terminal and wipes;
- correct PIN on attempt 3 reveals only after realm advances;
- trusted pairing skips PIN but still requires explicit QR/deep-link and reveal click;
- a paired wallet cannot trigger transfer push;
- push-delivered state alone never reveals;
- delayed/stale `wallet_action` from an old session cannot unlock a new action's handle;
- cancel versus claim/PIN/reveal/result races;
- reconnect before and after commitment;
- expiry while hidden and while revealed;
- refresh before claim creates no stale reveal path;
- identity reset and other-tab lease contention;
- popup close before and after commitment;
- action/UI/SDK double-disposal is safe and idempotent.

### 13.5 Popup browser tests

Use Playwright against the preview/test app:

- desktop QR, mobile deep-link, responsive layout, keyboard navigation, and reduced motion;
- focus behavior through PIN and Reveal controls;
- no key in hidden markup, attributes, accessibility snapshot, or screenshot before reveal;
- masked/hidden state on document background if adopted;
- copy requires click and shows warning;
- key QR is created only after its own explicit click;
- no key remains after terminal transitions;
- screenshot baselines contain synthetic keys only and are not published from CI.

### 13.6 Wallet and backend integration tests

- incompatible wallet rejected before action exposure;
- QR claim + first PIN + transfer action;
- trusted explicit open without PIN;
- backend cannot decrypt captured ciphertext and never receives the key;
- wallet decrypts the cross-runtime vector;
- wallet rejects metadata mismatch, malformed secrets, unauthorized account keys, duplicates, oversized payload, and wrong network;
- wallet secure-storage failure returns failure and leaves no partial imports;
- idempotent exact re-import;
- crash/background during key entry and during staged import;
- signed success reaches the SDK and clears every transient secret.

### 13.7 Real-device release matrix

At minimum:

- Android and iOS;
- production and development wallet schemes;
- first QR/PIN pairing and trusted re-open;
- desktop-to-phone key QR/text entry;
- same-device deep-link plus paste/manual entry;
- slow/reconnecting network;
- expired bridge;
- wallet app background/foreground and process restart;
- 1, maximum, and mixed mainnet/testnet account sets.

## 14. Build, packaging, and regression checks

Run after each implementation phase and before release:

```powershell
bun run --filter @meteorwallet/sdk type-check
bun test packages/meteor-sdk-v1/src/MeteorConnect/target_clients/mobile_bridge
bun run --filter @meteorwallet/sdk build
bun run type-check-all
```

Also:

- inspect ESM and CJS bundles for the new shared domain and accidental key literals;
- inspect generated `.d.ts` for the dedicated API and absence of internal secret-handle types;
- verify `@meteorwallet/connect-shared`, `@meteorwallet/connect`, and Valibot are not duplicated incompatibly in the bundle;
- inspect the package tarball for test vectors, screenshots, logs, and source maps containing synthetic canaries;
- run the full existing mobile bridge test suite and legacy v1 web/extension regression matrix;
- verify the Near Connect sandbox host allowlist still permits only the established Meteor Wallet schemes and that the transfer key is never placed in a navigated URL.

## 15. Product/privacy decisions to record before implementation

These decisions materially affect the protocol and should be written into the issue/ADR before code lands:

1. **Metadata visibility:** approve that account IDs/networks/count and ciphertext size are visible to the bridge backend under the current schema, or revise the shared schema so the summary is also encrypted.
2. **Cryptography profile:** approve the exact v1 key length, key display encoding, checksum, nonce/tag sizes, plaintext encoding, and secret-prefix grammar. The recommendation is AES-256-GCM with a random 32-byte key and 12-byte nonce.
3. **Key entry UX:** approve text plus explicit copy and optional post-confirmation key QR. If policy requires strictly manual typing, reconsider the key encoding/usability without reducing entropy silently.
4. **Multiple secrets:** define whether all entries must be imported, whether they are derivation alternatives, and how conflicts are presented.
5. **Account ownership validation:** agree on NEAR derivation paths and authoritative RPC checks for mnemonic/private-key material.
6. **Atomicity:** approve all-or-nothing import and the precise meaning of `{ success: true }`.
7. **Retention:** document bridge TTL and wallet crash-recovery behavior for staged plaintext.

Recommended answers are embedded above. Items 1 and 2 are release blockers because the current exported schema alone cannot answer them.

## 16. Rollout strategy

1. Land shared profile/schema helpers and transfer capability behind no production advertisement.
2. Land backend per-action capability enforcement.
3. Land Meteor Wallet resolver, validation, secure import, and synthetic integration vectors behind a wallet feature flag.
4. Publish compatible shared/connect packages.
5. Land SDK registry, adapters, sensitive handle, popup UX, and tests behind `mobileBridge.accountTransferEnabled` defaulting to `false`.
6. Test local backend plus development Meteor Wallet end to end.
7. Enable only for an allowlist of partner client IDs and development wallet app ID.
8. Perform security review focused on key non-disclosure, schema ambiguity, wallet import validation, bridge races, and same-origin limitations.
9. Roll out compatible production wallet builds first and wait for adoption telemetry.
10. Enable selected production partners gradually, monitoring safe error codes and completion rates only.
11. Keep a server/SDK kill switch that prevents new transfer bridges without affecting existing NEAR signing actions.

Never advertise the wallet capability before the complete resolver is enabled, and never enable the SDK flow merely because the shared action export exists.

## 17. Acceptance criteria

The feature is complete only when all of the following are true:

1. Partner code builds a transfer with the exported `vAllAccountsTransferDataEncrypted` contract and the SDK serializes it using `act_impl_meteor_wallet_core.action.transfer_accounts`.
2. The only bridge-visible secret-bearing value is authenticated ciphertext; the decrypt key is absent from every wire/storage/log/URL surface.
3. Transfer is mobile-only and never sent by background push.
4. First pairing requires the existing PIN flow; a trusted pairing still requires an explicit scan/open gesture.
5. The popup cannot render or retrieve the display key before authoritative `wallet_action` and an explicit Reveal click.
6. Failure, cancellation, expiry, close, reconnect loss, and disposal synchronously remove the key from the DOM and best-effort wipe mutable buffers.
7. The backend rejects wallets lacking authenticated transfer-v1 capability before exposing the action.
8. Meteor Wallet decrypts only locally and validates the shared decrypted schema, clear/decrypted metadata equality, limits, secret syntax, account ownership, duplicates, and secure-storage outcome.
9. Meteor Wallet requires a final local approval and never silently overwrites a conflicting account secret.
10. The SDK accepts only a signed, domain/id/hash-verified `{ success: true }` result.
11. Cross-runtime crypto vectors, SDK unit/race/non-disclosure tests, browser UI tests, backend/wallet integration tests, builds, packaging checks, and real-device matrix all pass.
12. The metadata visibility and browser same-origin limitations are present in partner and user-facing security documentation.
13. Production enablement is capability-gated, feature-flagged, allowlisted initially, observable without sensitive telemetry, and immediately reversible.

## 18. Recommended implementation order

1. Resolve the seven decisions in section 15 and freeze `meteor-wallet-account-transfer-v1`.
2. Harden/export the shared schema types, crypto/key helpers, test vectors, and transfer capability.
3. Implement backend per-action capability enforcement.
4. Implement and security-test the Meteor Wallet resolver/import path.
5. Add the SDK action registry and domain-aware request/result adapters.
6. Add the dedicated public API and sensitive presentation handle, including structural log redaction.
7. Enforce mobile-only explicit-open delivery and integrate with the existing session state machine.
8. Add the post-`wallet_action` connection-confirmed/reveal UI and cleanup behavior.
9. Complete unit, race, non-disclosure, browser, backend, wallet, and real-device tests.
10. Roll out in the order in section 16.

## 19. Standards references

- [NIST SP 800-38D: Galois/Counter Mode (GCM) and GMAC](https://nvlpubs.nist.gov/nistpubs/legacy/sp/nistspecialpublication800-38d.pdf)
- [W3C Web Cryptography API — AES-GCM](https://www.w3.org/TR/WebCryptoAPI/#aes-gcm)
