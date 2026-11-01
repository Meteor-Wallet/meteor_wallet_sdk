# Issue report: My NEAR Wallet → Meteor migration failures (2026-11-01)

**Status:** fixed in code across four repos, all uncommitted. Nothing has been released or deployed.
The release and deploy steps are listed under [Hand-off](#hand-off). Open follow-ups are in
[Still open](#still-open).

| # | What users saw | Root cause | Where it is fixed |
|---|---|---|---|
| 1 | MNW: *"An error occurred while loading your account … `[-32000] Server error: Account lele.near has more than 100 access keys; use a paginated view_access_key_list request`"*. The user could not open the account page or do anything else. | NEAR RPC nodes now refuse an **unpaginated** `view_access_key_list` for any account with more than 100 keys (`TOO_MANY_ACCESS_KEYS`). MNW, near-api-js 0.45.1, the Meteor web wallet and our AddKey examples all ask for the whole list in one request. | my-near-wallet, meteor_wallet, this repo (example + demo), connect-shared (docs only) |
| 2 | MNW, new-key transfer: *"Failed to execute 'setItem' on 'Storage': Setting the value of 'met_data_newKeyTransferSessions' exceeded the quota."* shown as the support code. | MNW's localStorage (one per origin, ~5M characters) was already full. The SDK's first journal write was just the first write that needed more room. The main thing filling it that the code shows is **an MNW bug that persists the entire React Query cache**: every token's metadata with its inline icon, plus the full validator set twice. | my-near-wallet (root cause + handling), this repo (typed error + self-cleanup) |

---

## Issue 1 — accounts with more than 100 access keys

### Reproduced live (2026-11-01)

- `rpc.mainnet.fastnear.com`, `free.rpc.fastnear.com` and `rpc.mainnet.near.org` all answer an
  unpaginated `view_access_key_list` for `lele.near` with `HANDLER_ERROR / TOO_MANY_ACCESS_KEYS`.
  That is word for word the error in the screenshot.
- The paginated form works on all three nodes:
  - Request `{ request_type: "view_access_key_list", account_id, finality, limit: 100, after_key? }`.
  - Each page returns `keys`, plus `last_key` whenever more keys may follow. The last page has no
    `last_key`.
  - Later pages are pinned to `block_id: <first page's block_height>`, so the whole list is one
    snapshot.
  - `lele.near` is 166 keys (6 full-access) in 2 pages. `near` is 5,222 keys in 53 pages.
  - Nodes that don't paginate ignore `limit` and return everything in one page.

### Why "nothing works" for that user in MNW

In MNW, every one of these reads the key list in a single request, so each one failed:

- **Account load:** `Wallet.loadAccount` runs on every account load, which produced the banner in
  the screenshot.
- **Wallet helpers:** `Wallet.getAccessKeys` backs the keys page, `getLedgerKey`, `isLedgerEnabled`,
  `getPublicKeyType`, and `isFullAccessKey`. `isFullAccessKey` is the export-eligibility probe, so the
  account could not even be selected for migration.
- **near-api-js 0.45.1 internals:** `Account.getAccessKeys`, the 2FA/multisig accounts and
  `getAccountDetails`.
- **Account flows:** account creation, manual import, implicit-account recovery, and linkdrop funding
  cleanup.
- **Transfer chain:** `getAccessKeys` in the new-key transfer AddKey chain. So even with the account
  page working, `lele.near` could not have been migrated.

### Fixes

**my-near-wallet**
- New `utils/mnw-api-js/src/accessKeyList.ts`: `queryAccessKeyList()` reads the list page by page,
  pinned to the first page's block, and answers in the same shape as one unpaginated response. It
  throws rather than return part of the list, in four cases:
  - more than 1,000 pages
  - a `last_key` that doesn't advance
  - an empty page that still has a `last_key`
  - a page with no `keys` array
- `RpcProvider.query` (every MNW connection goes through it) sends any unpaginated
  `view_access_key_list` through that helper. That one change covers all of MNW's own calls **and**
  the ones near-api-js makes internally.
- Two call sites use the helper directly, so they don't depend on the provider type:
  - the AddKey chain in `services/meteorConnectAddKeyChain.js`, at final finality
  - the raw `JsonRpcProvider` in `wallet.ts` implicit-account recovery
- MNW deletes keys one per transaction, so cleaning up 166 keys hits no batch limit.

**meteor_wallet (Meteor web).** This part was done by a delegated agent; I reviewed the diff.
- New `meteor-common/.../near_rpc/near_access_key_list.utils.ts`, with the same protocol and guards.
- These now go through it, keeping their return shapes and finality:
  - `NearRpcClient.view_access_key_list`
  - `NearRpcClientV2.viewAccessKeyList`
  - `NearApiJsClient.getAccessKeys`
- The five direct near-api-js `account.getAccessKeys()` calls are replaced. They are in harvest moon,
  lockup and the frontend key-removal API.
- Migrated accounts with more than 100 keys therefore work in Meteor web's key management, app keys,
  invalid-signer banner, manual import, harvest moon and lockup.
- The verify step (`viewDestinationAccessKey`) already asked for a single key, so it was correct and
  is unchanged.

**meteor-v2-apps.** No change needed. Everything already goes through the paginated
`key_management/accessKeyRpc.ts`, which the two implementations above mirror.

**This repo**
- The partner example `examples/minimal-consumer/example.ts` and the demo harness
  `meteor-sdk-v1-test-web/.../nearAddKeyChain.ts` both implemented `getAccessKeys` with one
  unpaginated call. A partner copying the example would have been unable to transfer any account
  with more than 100 keys. Both now page.

**meteor-connect-bridge (docs only)**
- The `IAddKeyJournalChain.getAccessKeys` and `normalizeNearAddKeyProof` comments now say the list
  must be complete and how to page it. This ships with the next connect release; no pin bump is
  needed for anything here.

---

## Issue 2 — `met_data_newKeyTransferSessions exceeded the quota`

### How it happens

1. The SDK keeps its transfer journal in the **host's** localStorage. For MNW that is
   `webpage_local_storage` on MNW's origin. Browsers cap localStorage per origin at about 5M
   characters. The error wording is Chrome's.
2. `newKeyTransfer.start()` journals a `start_pending` row **before** opening Meteor. For
   `MAX_NEW_KEY_TRANSFER_ACCOUNTS = 30` accounts that row is a few KB.
3. A write that small failing means **the origin was already at its quota**. The SDK did not fill
   it: under MNW's flow its records are bounded.
   - Sessions are capped at 100.
   - Stale pending rows are swept.
   - Connect-client contexts are pruned when they expire.
   - Lease tickets are reaped.
4. MNW passed the raw `DOMException` text through `describeNewKeyTransferError` as both the message
   and the "support code". Analytics recorded it as `unknown`, which is likely why it never showed
   up in dashboards.

### What fills MNW's storage (found in the code)

`utils/query/queryClient.ts` was meant to persist only queries whose key contains `'persist'`. But
it wrote the filtered list to a new top-level `queries` field. The persisted shape is
`{ timestamp, buster, clientState: { queries, mutations } }`, so `clientState.queries` stayed
**unfiltered**. The result:

- **Every successful query** in the cache has been written to localStorage, rewritten about once a
  second while the wallet is in use, and kept for a week.
- That includes `ft_metadata` for **every token contract the account sees** (`staleTime:
  Infinity`). The icons are inline data URLs. Measured today: 0.15–19K characters each, about 79K for
  15 common tokens. Accounts carrying many airdropped or spam tokens reach MB sizes.
- It includes the full mainnet `validators` answer, measured at 394K characters, **twice**: once in
  `clientState` and once in the duplicate `queries` field. It was cached even though both callers
  only read account ids.

There is no secret material in that cache. I checked every cached query: the validators-action entry
holds a Promise, which serializes as `{}`. We can't see the affected user's actual storage, so other
old data may also contribute. That is why the error now carries a breakdown (below).

### Fixes

**my-near-wallet**

Root cause:

- `queryClient.ts` filters `clientState.queries` (`keepPersistMarkedQueries`), and sets a new
  `buster`. When the buster differs, React Query deletes the stored cache on restore, so every user's
  bloated `REACT_QUERY_OFFLINE_CACHE` is removed on their **first load after deploy**. It is only a
  cache and is rebuilt.
- `utils/staking.ts` persists validator **account ids only**, under a new key, about 99% smaller.

Handling (new `services/browserStorage.js`):

- Before each transfer step it releases entries that are safe to drop: `REACT_QUERY_OFFLINE_CACHE`
  and Mixpanel's unsent-event queues (`__mpq_*`; Mixpanel is retired here). The steps are start,
  AddKeys, verify, and the legacy secret-transfer prompt.
- It never touches keys, accounts, settings or the transfer journal.
- If storage is still full, the step fails with `new_key_transfer_browser_storage_full`. The original
  error is attached as its `cause`, along with a **usage breakdown by key family**, for example
  `5,100K chars · REACT_QUERY_OFFLINE_CACHE 2,300K · other 1,900K · …`.
  - The breakdown names known families only (`nearlib:keystore:*`, `met_data_*`, …).
  - Everything else is `other`, so no key name that could contain an account id leaves the device.
- `describeNewKeyTransferError` recognises a full storage in every form it can arrive in: the
  browser's `QuotaExceededError` (what MNW gets from its current SDK, 3.21.0), the SDK's new typed
  code, or either one as a `cause`. The screen then shows proper copy (in all 9 locales), with the
  breakdown in the support code.
- Analytics now reports `new_key_transfer_browser_storage_full` instead of `unknown`.

**This repo (SDK)**
- New typed code `new_key_transfer_storage_full`. The SDK's documented contract is that every
  failure on this surface is a `NewKeyTransferError`, and a raw `DOMException` escaping
  `writeSessions` broke it.
- All three journal writes go through `persistJson`. On a quota error it frees what the SDK can lose
  safely, retries once, and then throws the typed code with the `DOMException` as `cause`. What it
  frees:
  - the completed-session archive, which is history that nothing reads back
  - verify-cache entries that no live session references
- The live journal and the AddKey journal slots are never touched.
- `archiveCompletedSession` still retires a terminal session when even the archive copy can't be
  written, because retiring it is what shrinks the live journal.

### Compatibility

- MNW's fix needs no SDK release. It works with MNW's pinned SDK 3.21.0 and with the typed code in
  future releases.
- No stored state needs migrating. The only data removed is cache, analytics queues and SDK history.
  Keys, accounts, pairings, function-call keys and in-flight transfers are untouched.
- For SDK consumers, a quota failure now arrives as `NewKeyTransferError("new_key_transfer_storage_full")`
  instead of a raw `DOMException`, with the original error as `cause`. That is an additive change
  toward the documented contract. Worth a changelog line.

---

## Verification

| Check | Result |
|---|---|
| Live: MNW `RpcProvider` + near-api-js `Account.getAccessKeys()` on mainnet | `lele.near` 166 keys (0.9 s), `near` 5,222 keys (11.8 s); an unpatched provider is still refused |
| Live (agent): Meteor web `getNearApi().getAccessKeys` / `NearRpcClientV2` | `lele.near` 166 keys in 2 pinned pages on three public RPCs |
| MNW jest: new pager (9), storage/describer/filter (11), affected suites | 89/89 in touched suites. Full run: 34/35 suites; the one failure was locale parity for the new copy, since fixed and passing |
| MNW `tsc --noEmit`, prettier, eslint on changed files | clean |
| SDK `bun run checks` / `bun run test` (incl. public-surface) | 266/266, types + confinement + public surface OK; 3 new storage-full tests |
| SDK `type-check-all` | sdk, test-web and backend-test OK. `meteor-near-connect` fails in `function_call_key/nearFunctionCallKey.ts`, a file this change doesn't touch |
| meteor_wallet (agent) | meteor-common and meteor-frontend type-checks clean; 8 new helper tests pass; 2 suites fail identically on a clean copy of HEAD |
| Live: meteor-common pager vs the old unpaginated request, same block, `rpc.mainnet.fastnear.com` | identical key sets for `meteor-wallet.near` (25) and `sweat_welcome.near` (36), one request each; `lele.near` 166, where the old request is refused |
| Live: paging semantics on mainnet (FastNear, near.org) and testnet (FastNear, near.org) | a page that ends at the account's last key carries no `last_key`, so an account with ≤100 keys still takes exactly one request; testnet accepts `limit` |
| SDK `bun run build` (bundle budget) | passes; `index.d.ts` is at 96% of its gzip budget (a warning, not a failure) |
| SDK `check-package-consumable` | the packed tarball installs, loads through `require()` and `import()`, type-checks and bundles with Vite and Parcel |
| NEAR Connect executor `vite build`, into a scratch folder | builds; the shipped `near-connect/meteor-near-connect.js` was not rebuilt |
| meteor_wallet re-run | meteor-common and meteor-frontend `tsc` clean; NEAR client tests 37/37 |

### What existing users and integrations keep

- **SDK, regular use.** Sign-in, signing and the bridge and mobile flows don't touch the changed
  code. It runs only when a host calls `newKeyTransfer` methods, and with storage that has room it
  does the same single `setJson` as before. Nothing sent to the wallet changed, so the wallets never
  see the new code. The `MeteorConnect` constructor is unchanged.
- **meteor_wallet.** The swapped call sites read through the same provider near-api-js accounts use
  (`getNearRpcProvider`), at the same optimistic finality. They get the same raw key shape with
  `bigint` nonces, as near-api-js 5.1.1 `Account.getAccessKeys()` returned. The only difference on
  the wire is the added `limit`.
- **meteor-v2-apps.** No changes. It pins published `@meteorwallet/connect` / `connect-shared`
  0.26.0 and does not depend on meteor-common or `@meteorwallet/sdk`.
- **meteor-connect-bridge.** Comments only.

## Hand-off

Nothing below has been run. Each step is yours:

1. **my-near-wallet:** deploy through MNW's normal pipeline. This alone fixes both reported issues
   for MNW users.
   - `lele.near` loads, lists all keys and can delete keys or migrate.
   - The full-storage user's first load clears the bloated cache. If storage is still full, the
     support code now shows what is holding the space.
2. **meteor_wallet:** deploy Meteor web so migrated accounts with more than 100 keys work there.
3. **SDK:** when you choose, check with `bun run release:dry <version>` and then run
   `bun run release <version>`. The new error code is additive, so a minor version fits. MNW can bump
   its pin afterwards to get the typed code and the SDK-side cleanup; the deploy in step 1 does not
   need it.
4. **meteor-connect-bridge:** the comment-only change rides along with the next connect release.

To rehearse with a real account that has more than 100 keys, use the SDK demo. Its new-key
transfer panel runs My NEAR Wallet's on-chain checks and keeps a mainnet key in memory only (see
"Testing a real account's new-key transfer" in
[`packages/meteor-sdk-v1-test-web/README.md`](packages/meteor-sdk-v1-test-web/README.md)).

## Still open

- [ ] **Meteor web batch revoke over 100 keys.** "Select all → revoke" in App Key Management and
      Manage Keys builds one transaction with one `DeleteKey` per key. NEAR allows at most 100 actions
      per receipt, so this will be rejected for exactly these users. Split it into transactions of
      100 actions or fewer. Not changed.
- [ ] **Unverified RPC endpoints — check before deploying Meteor web.** Meteor web's default node
      `mw.rpc.fastnear.com` and the extension proxy `backend-v2.meteorwallet.app/rpc/near` return a
      Cloudflare 403 to scripts. From the wallet in a browser, list keys and confirm in the network
      tab that `view_access_key_list` requests carry `limit` and are answered. If an endpoint drops
      `limit`, accounts with ≤100 keys list as before and larger ones stay refused. The only outcome
      that would change today's behaviour is an endpoint rejecting a request that carries `limit`.
      The public FastNear and NEAR nodes accept it. A partial list is never returned.
- [ ] **connect-bridge demos.** `demo-wallet-web` and `demo-partner-web` call near-kit
      `getAccessKeys`; whether that pages is unverified. These are testnet demos only.
- [ ] **Backend relayer scripts.** The `meteor_backend_v2_clean` relayer scripts call
      `getAccessKeys()` unpaginated, and relayer accounts can exceed 100 keys. These are ops scripts,
      not user-facing.
- [ ] **Confirm the storage culprit.** Watch PostHog `new_key_transfer_browser_storage_full` events
      and the support codes users send. If `other` dominates the breakdown, something beyond the
      React Query cache is filling storage.
- [ ] **Longer term:** consider an IndexedDB-backed storage for the SDK journal (far larger quota).
      It needs a migration path for existing localStorage journals, so it is not a hotfix.
