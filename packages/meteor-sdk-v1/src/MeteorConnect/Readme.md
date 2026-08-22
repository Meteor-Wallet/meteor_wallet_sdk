# Meteor Connect

`MeteorConnect` routes each request to the compatible Meteor target. The web and extension targets
remain unchanged and carry every regular NEAR action. The optional `v2_bridge_mobile` target
prepares an idempotent Meteor Connect bridge as soon as the popup opens, renders its QR code under
**Meteor Mobile**, and attempts a push notification only when the targeted account is bound to the
exact compatible paired wallet.

`v2_bridge_mobile` currently carries the account-transfer flows only — `transfer_accounts` and the
two `new_key_account_transfer_*` steps. The backend admits an action onto a session only once its
crash-recovery seams exist (`session_policies.ts::hasImplementedRecoverySeams` in the bridge repo),
so every `act_impl_near` request is refused with `action_ineligible`. `getExecutionTargetConfigs`
therefore drops `near::*` before target selection, behind `config.experimentalNearOverSession`
(default `false`). An account persisted against `v2_bridge_mobile` by an older build is treated as
stranded: its actions throw naming the unavailable target, except `near::sign_out`, which resolves
locally so the entry can always be removed.

## Enabling Meteor Mobile

Mobile bridging is rollout-gated and defaults to disabled. Enable it only after the compatible
`@meteorwallet/connect`/`connect-shared` packages, backend, and mobile app have been deployed:

```ts
await meteorConnect.initialize({
  storage: webpage_local_storage,
  mobileBridge: {
    enabled: true,
    backendUrl: "https://mc.meteorwallet.app",
    partnerMetadata: {
      name: "Example dApp",
      originUrl: window.location.origin,
      iconUrl: "https://example.com/icon.png",
    },
  },
});
```

The storage implementation must be durable and dApp-scoped. It should implement `getKeys(prefix)`
so comprehensive identity reset and the storage-backed cross-tab coordinator can enumerate only the
mobile bridge namespace. A host without Web Locks and without key enumeration must inject an
`IMeteorConnectBridgeLeaseProvider`.

The default browser opener dispatches the generated `meteorwallet://` or `meteorwalletdev://` link
synchronously from the click. Sandboxed hosts must inject `nativeAppOpener`; the Near Connect
executor uses `window.selector.openNativeApp` and declares both exact bridge-request schemes in its
manifest.

## Safety and routing

- Every mobile connection record is bound to its schema version, normalized backend environment,
  Meteor app ID, partner identity, and exact wallet verify-key handle.
- Sign-in always uses QR/deep link. Contextual actions use push only for the exact authenticated
  compatible wallet; the QR remains available regardless of push outcome.
- Selecting web or extension first obtains authoritative cancellation of the prepared mobile bridge.
  If mobile already committed, mobile wins and no legacy duplicate is launched.
- Account-targeted requests and signed results are account-explicit. Result domain/action, wallet
  signature, hydrated schema, signed output hash, and account identity are checked before SDK state is
  updated.
- Partner identity and production/development storage are isolated. An identity pin mismatch offers a
  confirmed comprehensive reset and QR re-pair; stored NEAR accounts remain visible but their old
  mobile bindings cannot be used for push.

Call `disposeMobileBridge()` only when there is no committed mobile request before reinitializing with
a different mobile configuration.
