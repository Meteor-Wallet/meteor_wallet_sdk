# Meteor Wallet SDK

This is the repo for our SDKs which provide utility for connecting to Meteor Wallet on our various platforms.

If you are looking to integrate with Meteor, start with the [SDK integration guide](packages/meteor-sdk-v1/README.md) and the [security documentation](packages/meteor-sdk-v1/SECURITY.md).

# Installing and Building

We make use of Proto for tool management (https://moonrepo.dev/docs/proto/install)

```
proto use
```

And `bun` is our package manager:

```
bun i
```

The `build` script inside `meteor-sdk-v1` will build out the SDK module.

# Local dev environment

Plain root scripts (each runs the package's own script; the combined ones use `bun run --parallel`):

| Script | Runs |
| --- | --- |
| `bun run dev` / `dev:local` | demo (:5173), near-connect executor build watch, mc backend (:8787, sibling `../meteor-connect-bridge`), Meteor Web wallet (:3001, sibling `../meteor_wallet`) |
| `bun run dev:full` | demo, near-connect build watch, `meteor-sdk-backend-test` (:8787), near-connect dev harness (:3001), popup preview (:8722), SDK build watch |
| `bun run dev:transfer` | demo, near-connect build watch, mc backend |
| `bun run dev:<name>` | one process: `demo`, `backend-test`, `near-connect`, `near-connect-build`, `sdk-preview`, `sdk-build-watch`, `mc-backend`, `web-wallet` |
| `bun run checks` | SDK type-check, key-confinement check, SDK tests |

Stop with Ctrl+C. To use a local `@hot-labs/near-connect` checkout in the demo:
`NEAR_CONNECT_LOCAL_PATH=../near-connect bun run dev`. On a new machine, run `bun run dev:web-wallet`
once on its own first so mkcert can ask for sudo.

If dev is stopped by signalling only the parent (IDE stop button, `kill <pid>`), child servers can keep
ports 8787/5173/3001. Find them with `lsof -nP -iTCP:8787,5173,3001 -sTCP:LISTEN` and stop them with
`kill $(lsof -tiTCP:8787,5173,3001 -sTCP:LISTEN)`.

# Relevant packages and classes in repo

## Meteor Wallet / Meteor Connect SDK

```
packages\meteor-sdk-v1
packages\meteor-sdk-v1\src\MeteorConnect.ts
packages\meteor-sdk-v1\src\MeteorWallet.ts
```

The Meteor Connect SDK (`MeteorConnect.ts`) is used by NEAR Connect and will eventually be the main connective layer for Meteor. This part of the repo also contains the SDK layer still used by Wallet Selector (`MeteorWallet.ts`) and which Meteor Connect currently still uses as an adapter for the Meteor V1 wallet.

Documentation for this package:

- [README](packages/meteor-sdk-v1/README.md) — partner integration guide: setup, the wallet-action popup, and the account-transfer flow.
- [SECURITY](packages/meteor-sdk-v1/SECURITY.md) — the security architecture of Meteor Connect and the bridge backend, with diagrams of the pairing and account-transfer protocols.

## NEAR Connect Executor

```
packages\meteor-near-connect\src\meteor-near-connect\nearConnectExecutor.ts
```

The script which is built and hosted as our executor for [NEAR Connect](https://github.com/azbang/near-connect), which makes use of the Meteor Connect SDK.

## Meteor SDK Test / Demo

```
packages\meteor-sdk-v1-test-web
```

Run `bun dev` in this package to test out the Meteor SDK, including NEAR Connect functionality.

Also hosted here: https://sdk-demo.meteorwallet.app/ (production wallets and bridge backend), and
https://sdk-demo-dev.meteorwallet.app/ (dev wallets and bridge backend).

# Developing with NEAR Connect

Ensure the following directory structure:

```
~dev/meteor_wallet_sdk (repo folder)
~dev/near-connect (repo folder)
```

Basically, ensure that these two repos are side-by-side in the same directory. The NEAR Connect repo folder must be named `near-connect`.

In root, run `bun run link-local-packages` or `bun run link-local-packages-watch` (to watch for changes in NEAR Connect repo). This will automatically copy the latest version of NEAR Connect into this repo's `node_modules` folder for direct usage.

Now you can develop and build NEAR Connect in its repo and work with it directly in this repo as if it were pulled from NPM here.

# Testing out NEAR Connect

Run `bun dev` in the `/packages/meteor-sdk-v1-test-web` folder. This will start a demo project to test our our SDK. You can test out NEAR Connect at the http://localhost:5173/near-connect page.

The demo manifest (`manifest.json`) for NEAR Connect is here: `packages\meteor-sdk-v1-test-web\app\pages\near-connect\dev-manifest.ts` - you can make changes here to see how our SDK will work with NEAR Connect.

Sometimes a full stop of Vite and restart using `bun dev` is required to see changes.

.