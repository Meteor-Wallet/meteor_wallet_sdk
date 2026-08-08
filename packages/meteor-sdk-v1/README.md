# Meteor Connect — `@meteorwallet/sdk`

The official SDK for connecting your dapp or wallet to [Meteor Wallet](https://meteorwallet.app).

It ships with a **native, self-contained popup** (no iframes, no redirects required, no CSS to
import) that handles the entire wallet interaction for you:

- **Regular wallet actions** — sign-in, message signing, transactions, meta-transactions — executed
  through the user's choice of **Meteor Web**, the **Meteor browser extension**, or **Meteor
  Mobile** (paired over an end-to-end encrypted bridge with QR / deep-link + push notifications).
- **Account transfer** — a dedicated secure flow for **partner wallets** that lets users migrate
  their accounts *into* Meteor Wallet without secrets ever touching a server in plaintext.

Every action is a simple promise: `createAction(...)` → `promptForExecution()` → typed result.

---

## Installation

```sh
npm install @meteorwallet/sdk near-api-js
# near-api-js ^6 is a peer dependency; the @near-js/* scoped packages used in the
# examples below (e.g. @near-js/transactions) are shipped as its dependencies.
```

The SDK is published as ESM + CJS with bundled TypeScript types.

## Quick start

```ts
import { EMeteorAppId, MeteorConnect, webpage_local_storage } from "@meteorwallet/sdk";

// Create ONE instance for your whole app (module scope is fine).
export const meteorConnect = new MeteorConnect();

// Initialize once, in the browser, before the first action.
await meteorConnect.initialize({
  storage: webpage_local_storage,
  mobileBridge: {
    enabled: true,
    partnerMetadata: {
      name: "My Dapp",
      description: "What the user sees when approving requests in Meteor",
      iconUrl: `${window.location.origin}/favicon.ico`,
      originUrl: window.location.origin,
    },
  },
});

// Sign in — opens the Meteor popup, resolves with the connected account.
const signInAction = await meteorConnect.createAction({
  id: "near::sign_in",
  input: {
    target: { blockchain: "near", network: "mainnet" },
  },
});
const account = await signInAction.promptForExecution();

console.log("Connected:", account.identifier.accountId);
```

That's the whole integration surface: **initialize once, then create + prompt actions**. The popup
mounts itself into `document.body` as an isolated web component (shadow DOM, styles included), so
it works identically in React, Vue, Svelte, or plain JS — nothing to render, wrap, or style.

## Initialization reference

```ts
await meteorConnect.initialize({
  storage,               // required — where the SDK persists connections
  mobileBridge: { ... }, // recommended — enables Meteor Mobile + account transfer
  nearKeyStoreProvider,  // optional — custom keystore for function-call keys
});
```

| Option | Description |
| --- | --- |
| `storage` | Async key-value storage (`getItem`/`setItem`/`removeItem`). Use the exported `webpage_local_storage` in browsers, or adapt your own (e.g. React Native storage) via `ILocalStorageInterface`. |
| `mobileBridge.enabled` | Master switch for the Meteor Mobile bridge target. |
| `mobileBridge.backendUrl` | Bridge backend. Default: `https://mc.meteorwallet.app` (production — leave it unless you run a local backend). |
| `mobileBridge.meteorAppId` | `EMeteorAppId.meteor_wallet_mobile` (default) or `meteor_wallet_mobile_dev` to pair with the development mobile app. |
| `mobileBridge.partnerMetadata` | Your app's `name` / `description` / `iconUrl` / `originUrl` — shown to the user inside Meteor when pairing and approving requests. Set this: it is your identity in the wallet. |
| `mobileBridge.transferAccounts` | Opt-in account-transfer feature for partner wallets — see [Transferring accounts into Meteor](#transferring-accounts-into-meteor-partner-wallets). |
| `nearKeyStoreProvider` | Where limited function-call access keys from `near::sign_in` live. Defaults to a browser `localStorage` keystore. |

Configuration is pinned per instance — to change `backendUrl` or app ids, create a fresh
`MeteorConnect` (in practice: a page reload), otherwise initialize fails with
`mobile_bridge_config_mismatch`.

## Working with accounts

Connected accounts persist in your `storage`, so users stay signed in across reloads:

```ts
const account = await meteorConnect.getAccount({ blockchain: "near", network: "mainnet" });
// undefined when nobody is signed in for that network

const all = await meteorConnect.getAllAccounts();
const signedIn = await meteorConnect.hasAccounts();
```

Each `IMeteorConnectAccount` carries:

- `identifier` — `{ blockchain: "near", network: "mainnet" | "testnet", accountId }`. Pass this as
  `target` for every account-bound action.
- `publicKeys` — the account's known public keys.
- `connection` — which execution target the account is bound to (Meteor Web, extension, mobile
  bridge, …). Follow-up actions automatically route to the same target — a mobile-connected user
  gets a push notification instead of being asked to pair again.

## Regular wallet actions (the action popup)

Every action follows the same pattern. `promptForExecution()` opens the popup, lets the user pick
their Meteor platform (or routes straight to the one their account is bound to), and resolves with
the output typed by the action id. If the user closes the popup, it rejects with
`Error("Action was cancelled")` — treat that as a normal, non-error ending. Actions are single-use:
create a new one for each request.

| Action id | What it does |
| --- | --- |
| `near::sign_in` | Connect an account. Optionally requests a limited function-call access key for your contract. Resolves with the connected account. |
| `near::sign_in_and_sign_message` | Sign-in + NEP-413 message signature in a single prompt (ideal for "Sign in with NEAR" auth flows). |
| `near::sign_message` | NEP-413 off-chain message signing for an already-connected account. |
| `near::sign_transactions` | Sign **and send** one or more NEAR transactions. |
| `near::sign_delegate_actions` | Sign NEP-366 delegate actions (meta-transactions) for you to submit through a relayer — user pays no gas. |
| `near::verify_owner` | Legacy account-ownership proof (prefer `near::sign_message`). |
| `near::sign_out` | Disconnect the account (runs without UI when only local cleanup is needed). |

### Sign in with a function-call key

Requesting a function-call key at sign-in lets you call whitelisted contract methods afterwards
**without prompting the user each time** (the key is stored via `nearKeyStoreProvider`):

```ts
const action = await meteorConnect.createAction({
  id: "near::sign_in",
  input: {
    target: { blockchain: "near", network: "mainnet" },
    addFunctionCallKey: {
      contractId: "guestbook.near",
      allowMethods: { anyMethod: false, methodNames: ["add_message"] },
    },
  },
});
const account = await action.promptForExecution();
```

### Sign and send a transaction

```ts
import { actionCreators } from "@near-js/transactions";
import { parseNearAmount } from "@near-js/utils";

const action = await meteorConnect.createAction({
  id: "near::sign_transactions",
  input: {
    target: account.identifier,
    transactions: [
      {
        receiverId: "guestbook.near",
        actions: [
          actionCreators.functionCall(
            "add_message",
            { text: "hello from my dapp" },
            BigInt("30000000000000"),            // gas
            BigInt(parseNearAmount("0.01")!),    // attached deposit
          ),
        ],
      },
    ],
  },
});
const outcomes = await action.promptForExecution();
```

### Sign a message (NEP-413)

```ts
const action = await meteorConnect.createAction({
  id: "near::sign_message",
  input: {
    target: account.identifier,
    messageParams: {
      message: "Log me in",
      recipient: "myapp.com",
      nonce: crypto.getRandomValues(new Uint8Array(32)), // 32 bytes, unique per request
    },
  },
});
const signed = await action.promptForExecution();
```

### Meta-transactions (gasless UX)

```ts
const action = await meteorConnect.createAction({
  id: "near::sign_delegate_actions",
  input: {
    target: account.identifier,
    delegateActions: [
      {
        receiverId: "friend.near",
        actions: [actionCreators.transfer(BigInt(parseNearAmount("0.1")!))],
      },
    ],
  },
});
const signedDelegates = await action.promptForExecution();
// Submit signedDelegates to your relayer.
```

### Sign out

```ts
const action = await meteorConnect.createAction({
  id: "near::sign_out",
  input: { target: account.identifier },
});
await action.promptForExecution();
```

## Transferring accounts into Meteor (partner wallets)

If you build a wallet (or any app holding user keys), the transfer flow gives your users a **safe,
guided path to import their accounts into Meteor Wallet** — web or mobile — through a dedicated
popup. You hand the SDK the account secrets to transfer; the SDK handles encryption, pairing, and
verification end to end.

### How it works, from the user's perspective

1. Your app calls `prompt()` — the popup opens with a review of the accounts about to transfer.
2. The user picks a destination: **Meteor Web** or **Meteor Mobile** (a "Get Meteor Wallet" page
   is offered for users who don't have one yet).
3. The wallet opens (new tab / QR / deep link) and shows a short **PIN**, which the user types
   into the popup — proving the two ends are talking to each other.
4. The popup then reveals a **one-time transfer key** (QR + copy) that the user enters in the
   wallet. The wallet decrypts the accounts locally, verifies each key on-chain, and imports.
5. The wallet returns a **cryptographically signed result**, and `prompt()` resolves with the
   outcome. Transferred accounts stay usable in your app — nothing is removed.

### Security model

- Account secrets are encrypted **in the popup's memory** with a fresh AES-256-GCM key generated
  **per bridge session** — a new key every retry, refresh, and re-pair.
- The bridge backend only ever relays **ciphertext**; the decrypt key travels exclusively through
  the user (QR / copy-paste) after PIN-verified pairing.
- The key is revealed only at the wallet-action phase, never persisted, wiped on every terminal
  state, and unreachable through the public API (enforced by a key-confinement lint in this
  package's build and test pipeline).
- Results are signed by the wallet and verified by the SDK — a tampered or replayed result is
  rejected, and a "transferred" outcome can't be spoofed.

The full security architecture — including sequence diagrams of the bridge protocol, the
key-confinement model, backend hardening, and the honest list of non-goals — is documented in
[SECURITY.md](./SECURITY.md).

### 1. Enable the feature

The flow is **off by default** — opt in at initialize time:

```ts
await meteorConnect.initialize({
  storage: webpage_local_storage,
  mobileBridge: {
    enabled: true,
    partnerMetadata: { ... },
    transferAccounts: {
      enabled: true,
    },
  },
});
```

| `transferAccounts` option | Default | Description |
| --- | --- | --- |
| `enabled` | `false` | Master switch. When off, `prompt()`/`createAction()` throw `transfer_accounts_unavailable`. |
| `meteorAppIds` | follows environment | Ordered destination app-id preference. Defaults to the production Meteor web wallet (or the dev variant when `meteorAppId` is `meteor_wallet_mobile_dev`). |
| `persistStagedAccounts` | `false` | Persist staged secrets (plaintext-at-rest in your origin's storage) so staging survives reloads. **Development / testnet only** — the default keeps staging in memory. |
| `clearStagedOnSuccess` | `false` | Clear the staged set after a successful import. Off by default so users can transfer the same accounts to another platform; Meteor skips already-imported accounts on a re-run. |
| `maxStagedAccounts` | `50` | **Testing only.** Raises the staged-set cap past the protocol's 50-accounts-per-transfer bound (which the backend and wallet still enforce). With more than 50 staged, call `prompt({ accounts })` with a ≤50 subset — a plain `prompt()` throws `transfer_accounts_invalid_input`. |

### 2. Stage the accounts

Staging validates and holds the secrets to transfer. It accepts a **12/24-word mnemonic** or an
**`ed25519:<base58>` private key** per entry, and returns typed results instead of throwing:

```ts
const result = await meteorConnect.transferAccounts.stage({
  networkId: "mainnet",
  accountId: "alice.near",
  secretInput: mnemonicOrPrivateKey,
  // derivationPath: "m/44'/397'/0'",   // optional, mnemonics only
});

if (!result.ok) {
  // result.reason: "invalid_account_id" | "invalid_mnemonic_word_count" |
  //   "invalid_private_key" | "duplicate_secret" | "too_many_accounts" | ...
  showError(`${result.reason}: ${result.message}`);
}
```

For live "detected: mnemonic ✓" feedback while the user types (without staging anything):

```ts
import { parseTransferSecretInput } from "@meteorwallet/sdk";

const detected = parseTransferSecretInput(userInput);
// { type: "mnemonic" } | { type: "private_key" } | { type: "invalid", reason }
```

Manage the staged set (listings are secret-free):

```ts
const staged = await meteorConnect.transferAccounts.getStagedSummaries();
// [{ blockchainId: "near", networkId: "mainnet", accountId: "alice.near",
//    secretTypes: ["mnemonic"] }]

await meteorConnect.transferAccounts.removeStaged(staged[0]);
await meteorConnect.transferAccounts.clearStaged();
```

### 3. Open the transfer popup

```ts
const outcome = await meteorConnect.transferAccounts.prompt();

switch (outcome.status) {
  case "imported":   // wallet confirmed the import with a signed { success: true }
    break;
  case "declined":   // user explicitly declined inside Meteor (signed { success: false })
    break;
  case "cancelled":  // user closed the popup before committing
    break;
  case "expired":    // bridge timed out — user abandoned the wallet-side flow
    break;
  case "failed":     // outcome.reason: "pin_attempts_exhausted" |
    break;           //   "wallet_update_required" | "bridge_failed"
}
```

Every user- or wallet-driven ending **resolves** to one of these outcomes; `prompt()` only
**throws** for integration mistakes — the feature being disabled (`transfer_accounts_unavailable`),
an empty staged set (`transfer_accounts_nothing_staged`), or invalid staged data.

To bypass staging storage entirely, pass the accounts directly:
`prompt({ accounts })` with `TAccountTransferDataDecrypted[]` (from `@meteorwallet/connect-shared`).
Advanced integrations can use `transferAccounts.createAction()` to drive the raw action instead.

## Local development

- **Try it first**: the hosted demo at <https://sdk-demo.meteorwallet.app/> runs this exact
  SDK; its source lives in the `meteor-sdk-v1-test-web` package of this repository and doubles as a
  reference integration for both flows.
- **Verbose logs**: `meteorConnect.setLoggingLevel("debug")`.
- **Dev wallet targets**: on production builds, the popup's localhost targets (regular actions'
  "Dev Web (Localhost)" and the transfer flow's "Meteor Web (Local Dev)", both expecting a local
  Meteor web wallet at `https://localhost:3001`) are unlocked with:

  ```js
  localStorage.setItem("met_data_dev_000_met", "1"); // then reload; remove to hide again
  ```

  Development builds (`NODE_ENV=development`) show them automatically.
- **Dev pairing**: use `meteorAppId: EMeteorAppId.meteor_wallet_mobile_dev` to pair with the
  development Meteor Mobile app, and `backendUrl` to point at a locally running bridge backend.

## Troubleshooting

### Parcel: `Cannot read properties of undefined (reading '48')` — random number each time

Parcel 2 (observed on 2.10.x) has a module-deferral bug with `"sideEffects": false` packages
that breaks nanoid's browser build: nanoid's internal `url-alphabet` module gets replaced with
an empty module, so generating any bridge id crashes with `undefined[<random byte>]` — a
different number on every attempt. In the transfer popup this surfaces as
_"Couldn't start the secure transfer: Cannot read properties of undefined (reading 'NN')"_.

Fix (with [patch-package](https://github.com/ds300/patch-package)): remove the
`"sideEffects": false` line from `node_modules/nanoid/package.json` — and from any nested copy
(e.g. `node_modules/@meteorwallet/sdk/node_modules/nanoid/package.json`) — then generate the
patches:

```sh
npx patch-package nanoid --exclude '^$'
npx patch-package @meteorwallet/sdk/nanoid --exclude '^$'
```

(`--exclude '^$'` is required because patch-package skips `package.json` diffs by default.)
Upgrading Parcel may also resolve it; bundlers like Vite, webpack, and Rollup are unaffected.

## Support

Questions or integration help: reach the Meteor team at <https://meteorwallet.app>.
