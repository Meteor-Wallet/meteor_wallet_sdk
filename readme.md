# Meteor Wallet SDK

This is the repo for our SDKs which provide utility for connecting to Meteor Wallet on our various platforms.

## Current SDK

The currently provided SDK is our web-based connection SDK, mostly used by Wallet Selector, which can be found at:

```
/packages/meteor-sdk-v1
```

This SDK was originally a port from MyNearWallet and hence is a bit dated at the moment. An evolved version of this SDK is in the works.

## Installing and Building

We make use of Proto for tool management (https://moonrepo.dev/docs/proto/install)

```
proto use
```

And `bun` is our package manager:

```
bun i
```

The `build` script inside `meteor-sdk-v1` will build out the SDK module.

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