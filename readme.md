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