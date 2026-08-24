# Minimal consumer example

The smallest correct integration of the **recommended** new-key transfer: supported defaults only,
ordinary recovery UX, and nothing that exists to exercise the protocol.

It is deliberately not the hosted lab. `packages/meteor-sdk-v1-test-web` is an engineering harness:
it exposes journal phases and opaque identifiers, offers opt-in plaintext staging, and can
deliberately strand the destination wallet. Those controls are valuable, and they are the wrong
thing to copy into a product (REVIEW-consumer-implementation M-04).

## What this shows

| Step | What the consumer does |
| --- | --- |
| Initialize | `meteorConnect.initialize({ storage, mobileBridge })` — retried in process on failure, never by reloading the page |
| Start | `newKeyTransfer.start({ accounts, targetPlatform })` — the wallet mints destination keys and returns only their public halves |
| AddKey | `newKeyTransfer.runAddKeys({ transferSessionId, chain })` — this side signs with each account's own full-access key |
| Verify | `newKeyTransfer.verifyActive({ transferSessionId, activations })` — the wallet proves the keys are live and imports |
| Resume | `newKeyTransfer.getRecoveryState()` on load, so a reload mid-flow continues instead of restarting |
| Reconcile | `getReconciliationReport()` → `reconcileFencedOperation()` → `archiveReconciledOperation()` when a transfer is fenced |

## What it deliberately leaves out

- No plaintext staging of account secrets. The recommended flow never needs them.
- No "clear the transfer" control. `clear()` exists for a transfer that never reached a chain; a
  product should resume or reconcile, not offer users a reset button next to on-chain state.
- No journal phases, transfer session ids or public keys in the primary UI. They belong in a support
  detail, which is what `reconciliation.supportReference` is for.

## Running it

`example.ts` is written to be read, not bundled here — it has no build of its own on purpose, so it
cannot drift into being a second app to maintain. Drop it into any Vite/Parcel/webpack app that has
`@meteorwallet/sdk` installed:

```bash
npm install @meteorwallet/sdk
```

The chain seam (`IAddKeyJournalChain`) is the one piece a host must supply itself, because it is the
only place the source account's signing key is touched — and that key must never reach the SDK. See
`example.ts` for the four methods and what each one must guarantee.
