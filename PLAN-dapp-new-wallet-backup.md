# PLAN: Recovery-phrase backup for wallets created from a DApp request

Status: proposal, 2026-10-17. Nothing implemented yet.

Repos involved:

- `meteor_wallet`: v1 web app and extension. Code read on `paul/swap-improvements`, which has no changes from
  `origin/master` in the files this plan touches.
- `meteor-v2-apps`: v2 mobile app. Code read on `paul/key-management-v2`, which is 19 commits ahead of `main`.
  This plan builds on that branch: `SeedPhraseFirstLastCheck`, `seedPhraseFirstLast.ts` and `SecretAccessBoundary`
  exist only there.
- `meteor_wallet_sdk` (this repo) and `meteor-connect-bridge`: read only. Neither needs changes.

Path shorthands used below:

| Shorthand | Path |
| --- | --- |
| `v1fe/` | `meteor_wallet/web/packages/meteor-frontend/src/` |
| `v1common/` | `meteor_wallet/web/packages/meteor-common/src/` |
| `v2app/` | `meteor-v2-apps/packages/app/` |
| `v2expo/` | `meteor-v2-apps/apps/expo/src/` |
| `sdk/` | `meteor_wallet_sdk/packages/meteor-sdk-v1/src/` |
| `bridge/` | `meteor-connect-bridge/packages/` |

Line numbers are as of 2026-10-17.

---

## 1. Summary

**What we assumed.** A user who creates an account from a DApp request skips the backup check that the in-wallet
create flow makes them do.

**What the code shows.** Neither wallet checks a backup when it creates an account, whether the user started in the
wallet or from a DApp. Both wallets:

- generate the phrase,
- create the account with a "not backed up" flag,
- never show the phrase.

Backing up is a later, optional step that the user reaches from a warning on the wallet home screen.

Users who create an account inside the wallet land on home and see that warning. Users who arrive from a DApp
usually don't:

- **v1 web popup:** after creating the account, the user is sent straight to the DApp approval and the popup closes
  itself. Home shows for about one frame.
- **v2 mobile:** the request screens never route through home. On Android the app hands the user straight back to
  the DApp after approval.

Neither wallet's request screens check backup state. A user who only ever uses Meteor through DApps may never see
their phrase, and loses the account if they lose the device or the browser's storage.

**What we'll do.**

1. In both wallets, when Meteor creates an account while a DApp request is pending, it shows the phrase and checks the
   backup **before creating the account**, that is, before the backend's on-chain create call. If the user abandons
   the flow, nothing exists on chain or in the wallet.
2. The create functions themselves refuse to create an account in this situation unless they are given the selected
   words and those words match the phrase they are about to store. A `true` from the UI is not enough.
3. Afterwards the user lands back on the pending request. v1 already does this. v2 does not today, and this plan
   adds it.
4. We reuse what exists. In v1 that is the old phrase and quiz screens (`Section_P2_*` / `Section_P3_*`), whose steps
   are still in the create wizard's step list. In v2 it is `NewKeyTransferSeedBackupScreen` and
   `SeedPhraseFirstLastCheck`, already used for wallet backup and Meteor Connect transfers.

The SDK, the bridge protocol and DApps need no changes.

On mobile, the bridge session has a fixed 5-minute lifetime. Some first-time users will finish setting up after the
request has expired. We handle that with a clear "your wallet is ready, connect again" screen rather than by
shortening the backup (§4.5, decision D4).

---

## 2. Findings

### 2.1 How DApp requests reach each wallet

| Wallet / path | How the SDK opens it | Where it lands in the wallet | No account today | Affected? |
| --- | --- | --- | --- | --- |
| v1 web popup | `window.open(wallet.meteorwallet.app/connect/<network>/<action>?source=wpm&connectionUid=…)` at 390×650, then postMessage (`sdk/postMessage/MeteorPostMessenger.ts:79-101`) | `v1fe/App.tsx:401-404` → `Page_ConnectWallet` | `Page_ConnectWallet.tsx:59-61` shows `WalletConnectNoAccount`; "Get Started" goes to `/add_wallet` | **Yes** |
| v1 redirect callback (`wcb`) | Full-page redirect | `v1common/modules_feature/dapp_connect/MeteorRedirectCallback.ts:17-104` | Same screen | **Yes** |
| v1 extension | `window.meteorComV2` → background script → popup window `ext_index.html?route=/connect/...` (`v1fe/extension/scripts/meteor_background.ts:95-170, 504-546`) | Same connect pages, under a `MemoryRouter` | Same screen | **No.** Creation is disabled on the extension (`CreateWalletOnExtensionModal`, `Section_P1_PickWalletName.tsx:293-297`); only import is offered |
| v1 bridge, web | `wallet.meteorwallet.app/b?…` | `Page_MeteorConnectBridge.tsx` | Refuses NEAR sign-in with "Account required" (`:581-591`) | No |
| v2 mobile, Meteor Connect bridge | QR code, `meteorwallet://b?…#secret` link, or push (`sdk/MeteorConnect/target_clients/mobile_bridge/`) | `v2expo/app/_layout.tsx:279-285` → `meteorConnectBridgeController.ts` → `/bridge_request/request` (`MeteorConnectBridgeScreen.tsx`) | Header plus "Back to wallet". That leads to the add-wallet intro, create, then home. **The request is never resumed** | **Yes** |
| v2 in-app browser | Injected NEAR Connect / selector messages (`WebView.tsx`, `Dapp.ts`) | `/wallet/explore/browser` | Can't be reached without an account (`/wallet` redirect, `routes.ts:124-131`) | No |
| v2 web / extension | None | None | No external DApp transport: no content or background scripts, and the bridge controller is never started on web | No |

In practice only `sign_in` and `sign_in_and_sign_message` reach a brand-new user. The other actions name an existing
`accountId` (`meteor-near-connect/src/meteor-near-connect/nearConnectExecutor.ts:358-389`).

### 2.2 v1 web popup today

1. **No-account screen.** `WalletConnectNoAccount` calls `navigate("/add_wallet")` (`Page_ConnectWallet.tsx:131-137`).
   That shows `Section_AddWalletSelection`; choosing "create_new" opens `Section_CreateNewWallet_V2`.
   - There is a second way in. Users who already have accounts can pick "Create or import" in the account selector
     on the login, sign-message and verify-owner screens. It goes straight to `/add_wallet/create_new`
     (`v1fe/components/externalConnection/Component_MenuItem_CreateOrImportAccount.tsx:20-22`).
2. **Create flow.** In `v1fe/pages/wallet_create_v2/Section_CreateNewWallet_V2.tsx` the steps are P0 password (if none
   is set), then P1 name, then `createWallet()`. `createWallet()`:
   - takes the phrase from the `useGenerateSeedPhrase` hook (`:79-80`). The phrase lives only in memory and is
     deleted on unmount (`v1common/.../SecureUserWallet/hooks/useGenerateSeedPhrase.ts:21-28`);
   - runs an invisible recaptcha, then the backend creates and funds the named account on chain (`:257-285`);
   - saves the account with `SecureUserWallet.addWalletAccount({ … isBackedUp: false })` (`:306`), which gives
     `needsToBackupSeedPhrase: true`;
   - calls `navigate(route ?? "/wallet")` (`:399-409`).

   **The phrase is never shown.**
   - The step enum still has `P2_GEN_PHASE` and `P3_CONFIRM_PHASE` (`v1common/.../app_store/AppStore_types.ts:299-300`),
     but nothing renders them.
   - The old flow that did is archived at
     `v1fe/pages/add_new_wallet_sections/_archived/Deprecated_Section_CreateNewWallet.tsx:245-276`.
3. **Return to the request.** An effect in `Page_Wallet.tsx:152-154` calls
   `DappConnectUtils.redirectOnExternalActionAndFundedAccounts()` (`v1fe/utils/DappConnectUtils.ts:172-189`). Once any
   account is funded, it navigates to `/connect/<network>/<action>`.
4. **Finish.** The user approves. The wallet sends `closed_success`, the SDK echoes it, and the wallet calls
   `window.close()` (`v1common/modules_feature/dapp_connect/MeteorPostMessageManager.ts:149-154`).

While the user sets up, the pending request lives only in `AppStore.externalActions`. That is in memory and not saved
to storage.

Two more flows use the same create component and have the same gap. Both send the user to another site afterwards:

- the keypom/linkdrop "Claim with new account" (`Page_LinkDrop.tsx:367-369`);
- the `?redirect=` partner create flow (`Section_CreateNewWallet_V2.tsx:358-393`).

### 2.3 v2 mobile today

1. **Session starts.** The DApp shows a QR code or link, and the SDK creates a bridge session with the
   `single_turn_v1` profile. The session's 5-minute clock starts here (§2.5).
2. **User arrives.** The user installs or opens the app and claims the session. On a first pairing they also type a
   PIN into the DApp popup. They land on `MeteorConnectBridgeScreen`.
3. **No account yet.** A fresh install signs itself in automatically with `auto_cipher`, so `isSignedIn` is true but
   no account is selected.
   - `walletReady = isSignedIn && Boolean(selectedAccountId)` (`MeteorConnectBridgeScreen.tsx:175`) is false.
   - The screen offers only "Back to wallet" (`:678, :751, :883`).
4. **Back to wallet.** It opens `/wallet/home`, which the route rules redirect to `/add-wallet/intro`
   (`v2app/components/core/wrappers/wrapper.static.tsx:52-58`). From there, "Create a Meteor Wallet" leads to
   `CreateNewWallet`.
5. **Account creation.** `v2app/app_logic/by_feature/add_wallet/create_new/AccountCreate.ts` `accountCreate`:
   - generates the phrase internally (`:75`);
   - creates the account on chain;
   - saves it with `importAccountWithSeedPhrase({ hasBackupSeedphrase: false })` (`:119-127`);
   - selects it with `User.setSelectedAccount` (`:144`).
6. **"Get Started"** calls `dismissTo("/")` (`v2app/components/by_feature/add_wallet/create_new/CreateNewWallet.tsx:509`),
   which leads to home. The phrase was never shown.
7. **Completing the request.** This only happens if the user goes back into the bridge: re-tapping the link,
   following a push, or rescanning. `walletReady` is now true, so the approval prompt opens, and approving completes
   the request. On Android the app then returns straight to the DApp (`MeteorConnectBridgeScreen.tsx:111-115`).

Nothing under `add_wallet/**` knows a request is pending.

### 2.4 Backup state and reminders

| | v1 | v2 |
| --- | --- | --- |
| Where it's stored | Signer `derivation.isBackedUp`, plus account `needsToBackupSeedPhrase` (`v1common/modules_feature/accounts/account_types.ts:175`, computed in `SecureUserWallet.ts:401-408`) | Account `hasBackupSeedphrase`, plus `keyMetadata[primary].{source, backupConfirmed, backupCheckedAt}` |
| Marked backed up by | `SecureUserWallet.setAccountSignerSeedPhraseBackedUp(account, publicKey)` (`SecureUserWallet.ts:279-305`). Takes no evidence | `User.confirmSeedPhraseBackup(account, publicKey, confirmation)` (`v2app/app_logic/by_feature/app_user/v1/AppUserV1.ts:597-617`). Checks the selected words again in the store, under the write lock |
| Reminder | Home `Component_WalletWarnings`, "Save Now" → `/wallet/backup_seed_phrase` (`PageBackupSeedPhrase`) | Home banner (`WalletHomeScreen.tsx:215-240`) → `/wallet/seed-phrase-backup`. Security & Keys also shows "Recovery not verified", behind the `enable_key_management` flag |
| Checked on DApp request screens? | No | No |

### 2.5 Timeouts

**v1 web popup and extension.** There is no request timeout. The SDK rejects only when the window closes
(`MeteorPostMessenger.ts:342-357`). Two things can still interrupt a long setup:

- **Auto-lock.** The wallet locks after 30 minutes idle without a session, or 60 with one
  (`v1common/.../AuthEncryptSign/AuthEncryptSign.constants.ts:54-66`). Locking swaps the UI to `Section_SignIn`,
  which unmounts the create wizard and drops the phrase held in memory.
- **Reloading the popup.** After `navigate("/add_wallet")` the URL no longer has `connectionUid`, and the in-memory
  request is gone. A reload therefore loses the request. This problem already exists today (D5).

**v2 bridge.** The SDK always uses the `single_turn_v1` profile
(`sdk/MeteorConnect/target_clients/mobile_bridge/MobileBridgeSession.ts:420-429`).

- Its limits are 300 s idle and **300 s absolute**, counted from session creation
  (`bridge/meteor-connect-shared/src/model/durable_object/bridge/session/session.schema.ts:105-111`).
- The absolute deadline can't be extended (`bridge/meteor-connect-backend/src/durable_object/bridge/session/SessionBridgeDO.ts:1111-1113`).
- Installing the app, claiming, the PIN, creating, the backup and approving must all fit in 5 minutes.
- Local dev uses 24 h lifetimes (`bridge/meteor-connect-backend/package.json:15`), which hides this. Test against
  remote dev.
- On expiry the DApp gets `mobile_bridge_expired`, and the wallet sees the session as ended.

### 2.6 Components we can reuse

**v1**

| Component | What it does | Notes |
| --- | --- | --- |
| `v1fe/pages/wallet_create_sections/Section_P2_SecretRecoveryPhrase.tsx`, props `{ onClickContinue, generateSeedPhrase }` | Phrase blurred until revealed, "I saved it" checkbox, Copy, Generate New | Takes the same `IUseGenerateSeedPhrase_HookOutput` the create wizard already holds. Copy button: see D3 |
| `v1fe/pages/wallet_create_sections/Section_P3_SecretPhraseConfirmation.tsx`, props `{ onConfirm(wasGood), generateSeedPhrase, isLoading? }` | User picks the first and last word from a 12-word grid | Returns only a boolean. The decoy words change on every mount. The caller shows the error toast |
| `v1fe/pages/wallet_sections/setting_sections/manage_keys_subsections/SubSection_ManageKeys_AddNewKey.tsx:489-497, 634-648` | Runs P2, then P3, then adds the key with `isBackedUp: true` | The pattern to copy |
| `v1fe/pages/wallet_sections/backup_seedphrase/PageBackupSeedPhrase.tsx` (with `Validate` and `Confirm`) | Backup after creation, for the selected account; asks for the password first | Not used by the main path. Its progress never resets, so a second backup in the same session opens at the quiz (§10) |
| `v1fe/components/meteor_connect/MeteorConnectBridgeNewKeyTransfer.tsx`, `newKeyTransferFlow.ts` (+ test) | Withholds the transfer result until the backup is confirmed. Picks the screen with a pure, tested function | Precedent for holding a request until backup, and for a testable step selector |

**v2** (on `paul/key-management-v2`)

| Component | What it does | Notes |
| --- | --- | --- |
| `v2app/components/by_feature/meteor_connect/NewKeyTransferSeedBackupScreen.tsx`, props `{ seedPhrase, isWorking, onConfirmed, onPressBack?, title?, description?, screenCaptureKey?, children? }` | Tap to reveal the phrase; no copy button; protected against screen capture. "I've Saved My Recovery Phrase" opens `NewKeyTransferRecoveryPhraseConfirmationSheet` | Already generic. Used by `WalletSeedPhraseBackupScreen`, the bridge new-key transfer and its recovery screen. Only its name, folder and default copy are transfer-specific |
| `v2app/components/by_feature/seed_phrase/SeedPhraseFirstLastCheck.tsx` and `v2app/app_logic/utils/seedPhraseFirstLast.ts` | The only check in the codebase: pick the first and last word from 12 (2 real words plus 10 decoys, cached per phrase). Returns `ISeedPhraseFirstLastConfirmation` | The caller checks the words again with `isSeedPhraseFirstLastMatch` |
| `v2app/components/by_feature/key_management/KeyWizardParts.tsx:48` `useNewPhraseKey()` | Generates a phrase in the UI before anything is registered | Used by Add Key and Replace Key |
| `WalletSeedPhraseBackupScreen` and `User.confirmSeedPhraseBackup` | Backup for an account that already exists | Not needed by the main path. Only used if D1 is adopted |
| `v2app/screens/meteor_connect/MeteorConnectBridgeNewKeyTransferScreen.tsx:608-722, 908-931` | Shows the backup screen in place of the request, and answers the partner only after confirmation | The pattern for holding a request until the backup is checked |
| Do **not** reuse | `SeedPhraseBackup.tsx` and `NewKeyTransferSeedBackupWizard.tsx` (unused; they have a copy button; the audit says to delete them); the `*PreviewScreen` mockups | |

---

## 3. Goal

**The rule.** Meteor sometimes generates a new account while a DApp request is pending. When it does, it must not
create that account, on chain or in the wallet, and must not answer the request, until the user has done both of these:

- seen the recovery phrase;
- passed the first/last-word check against that exact phrase.

Also:

- When the request is still alive, the user ends up on it after the backup, with the new account selected.
- A backup confirmation is evidence, namely the selected words. The code that saves the account checks it. A boolean
  from the UI never counts.
- Nothing changes for imports (the user already has the phrase), Ledger (there is no phrase) or private keys.

**Not part of this plan:**

- changing the in-wallet create flow (D2);
- blocking existing accounts that were never backed up when they're used with a DApp (D1);
- SDK or bridge protocol changes (D4);
- Harvest Moon / Telegram onboarding (`Page_HMOnboarding_Create.tsx`, `Section_OnboardingCreate.tsx`);
- turning account creation back on in the v1 extension.

---

## 4. Design

### 4.1 Check before creating, and how to tell a creation came from a DApp

Wherever the code already gets this right, it checks the backup first and registers the key afterwards:

- v1 adding a key: P2, then P3, then register;
- v2 Add Key and Replace Key: `PhraseBackupStep`, then `PhraseVerifyStep`, then AddKey;
- the v2 bridge new-key transfer: rows stay `backup_required` until the backup is confirmed.

Doing the same before the backend create call means:

- **A closed popup leaves nothing behind.** There is no funded on-chain account with a key nobody has backed up.
- **No new stored flag or request gate.** A DApp-created account can never exist without a backup, so there is
  nothing to track or block.
- **The v2 audit's open item L165 no longer matters for this path.** That item is that the phrase lives only in memory
  while the account is created on chain. Here the user already holds a checked written copy before that call.

**Telling that a creation came from a DApp.** We check at creation time, using state each wallet already holds:

- **v1:** `externalActions.length > 0`, or a `?redirect=` URL. This covers the popup, the redirect callback, keypom
  claims, partner redirects, and the account selector's "Create" entry.
- **v2:** the Meteor Connect session store holds a live action, meaning an action is present and the bridge session
  hasn't ended. This works however the user reached the create screen, including the old "Back to wallet" route.

### 4.2 v1 web: the create flow (`Section_CreateNewWallet_V2.tsx`)

When the creation came from a DApp, the steps become:

P0 password (unchanged) → P1 name → **P2 show phrase → P3 check** → `createWallet` → back to the request (unchanged).

1. **When to add the steps.** Set `requireBackupStep` when the creation came from a DApp; D2 may later make it always
   true. Ledger skips P2 and P3 because it has no phrase.
2. **P1.** For a local key with `requireBackupStep` set, P1's `onContinue` no longer calls `createWallet`.
   - It saves `fullAccountId`, `accountIdType`, `keyAlgorithm` and `route` into `wizards.createAccount`, which already
     holds `setNamedAccountId` and `accountIdType`.
   - It then sets `progress = P2_GEN_PHASE`.
3. **P2.** Render `Section_P2_SecretRecoveryPhrase` with the hook that matches `keyAlgorithm` (`generateSeedPhrase` or
   `generateMlDsa65SeedPhrase`). Continue moves to `P3_CONFIRM_PHASE`.
4. **P3.** Render `Section_P3_SecretPhraseConfirmation` (improved, §5).
   - On success, `onVerified(confirmation)` calls `createWallet({ ...saved P1 values, backupConfirmation })`.
   - Wrong words show a toast using the existing `seedPhraseConfirmation.confirmationWrongHeading` / `…Blurb` copy,
     and the user stays on P3.
5. **`createWallet`.**
   - **The code-level guard.** At the top, before recaptcha or any network call: if `requireBackupStep` is set and
     `backupConfirmation` is missing or doesn't match the hook's `getSeedphrase()`, throw.
   - Line `:306` becomes `isBackedUp: backupConfirmation != null`. The match has already been checked above.
   - If creation fails after the check (name taken, funding error), go back to P1 and keep the phrase. The hook keeps
     it while the component is mounted, so the user doesn't redo P2 and P3 unless the phrase changes.
6. **Back button.** No change needed (`:485-515`). It already steps P3 → P2 → P1 by decrementing `progress`.
7. **Lock or unmount mid-flow.** `wizards.createAccount.progress` lives in AppStore, so it survives an unmount. An
   auto-lock unmounts the wizard and the hook deletes the phrase.
   - On mount, if `progress` is P2 or P3, reset it to P2.
   - Show: "For your security we generated a new recovery phrase. Discard any copy of the previous one."
   - The user must never land on P3 with a phrase they haven't seen.
8. **"Generate New" in P2.** It stays allowed before creation. If the user regenerates after visiting P3, they must
   pass P3 again. The confirmation is checked against the phrase at `createWallet` time either way.

When the creation came from a DApp, show one line above P2: "Before connecting to {dapp host}, save your recovery
phrase. It's the only way to restore this wallet."

- New keys go in `en.tsx` and `translation_types.ts`; other languages fall back to English.
- Check P2 and P3 at the popup's 390×650 size.

The redirect back to `/connect/...` (`Page_Wallet.tsx:152-154`) needs no change. Keypom and `?redirect=` carry on
after `createWallet` as they do today.

### 4.3 v1 extension

No change for now. Account creation is disabled there, and only import is offered. Because the backup step lives in
the shared create component, turning creation back on in the extension brings the step with it. Creating a Ledger
account opens a tab and involves no phrase.

### 4.4 v2 mobile: creating an account from the bridge

1. **The bridge screen with no account** (`MeteorConnectBridgeScreen.tsx`, the three "Back to wallet" footers). When
   there is no target account and the session holds a live action:
   - show "Create a new wallet" and "I already have a wallet", with the line "You need a Meteor wallet to connect to
     {partner}.";
   - "Create a new wallet" routes to `/add-wallet/intro`, which keeps its terms checkbox and `ensureSecured()` and
     already ends in `goToAddWalletCreate()`, so nothing is duplicated;
   - "I already have a wallet" opens `ImportWalletOptionSheet` unchanged. Imported phrases count as backed up.
2. **`CreateNewWallet.tsx`.** When `requireBackupStep` is set (§4.1), two stages run before `Creating`:
   - **Phrase.** Generate it in the component with `useNewPhraseKey()`, so it exists before any network call. Keep it
     in memory until the flow completes, is cancelled or unmounts, as `PLAN-key-management.md` §5.6 requires.
   - **Backup.** Show the backup screen (renamed, §5):
     - title "Back Up Your Recovery Phrase";
     - description "Save it before connecting to {partner}. It's the only way to restore this wallet if you lose
       this device.";
     - `screenCaptureKey="create-wallet-seed-phrase-backup"`;
     - `onPressBack` returns to the name stage.

     The confirmation sheet produces an `ISeedPhraseFirstLastConfirmation`.
   - **Create.** Run the existing mutation with `{ type: "local", seedPhrase, backupConfirmation }`.
3. **`AccountCreate.accountCreate`.**
   - The `local` payload accepts `seedPhrase?`, `backupConfirmation?` and `requireBackup?`. When `seedPhrase` is given,
     use it instead of calling `SeedPhraseBip39KeySeed.generate()`.
   - **Checks.** Run these before `assertWalletStorageWritable()` and before the backend call:
     - if `backupConfirmation` is given, `isSeedPhraseFirstLastMatch(seedPhrase, backupConfirmation)` must hold;
     - if `requireBackup` is set, a confirmation must be present.

     Throw if either check fails.
   - **Saving with the backup recorded.** Today `importAccountWithSeedPhrase` ties `hasBackupSeedphrase: true` to
     `source: "account_import"` (`v2app/app_logic/by_feature/add_wallet/import_wallet_old/OldAccountImport.ts:198-212`).
     A generated key would be mislabelled as imported.
     - Add an explicit `origin: "generated" | "import"` parameter.
     - For a generated phrase that passed the check, write `hasBackupSeedphrase: true` and
       `keyMetadata = { source: "generated", derivation, backupConfirmed: true, backupCheckedAt: Date.now() }`.
     - This matches what `confirmSeedPhraseBackup` and Add Wallet Key already write. The key then counts as
       `backed_up`, and the home banner stays hidden.
4. **After creation from a DApp.**
   - Skip the welcome screen's "Get Started → `dismissTo("/")`".
   - If the session still holds the action, `replace` to `/bridge_request/request`; otherwise go to the expired screen
     (§4.5).
   - `AccountCreate` already selects the new account, so `walletReady` turns true and the normal approval prompt
     appears.
5. **Bridge-level check.** Every bridge handler reaches the account through `getReadyMeteorConnectAccount`
   (`v2app/app_logic/by_feature/meteor_connect/meteorConnectWalletReadiness.ts:53-61`, called via `selectedAccount()` in
   `meteorConnectBridgeClient.ts:361-363`). In Phase 2 leave it unchanged: with step 3 in place, a DApp-created account
   can't be missing its backup. Extend it only if D1 asks for a gate.

### 4.5 v2: when the 5-minute session runs out

A first-time user who installs the app from the store will often use up the 300 s before approving, with or without
the backup step. Don't shorten the backup to fit. Instead:

- **Expired screen.** If the session has ended when creation finishes, or at any point during setup, show: "Your
  wallet is ready and backed up. The connection request from {partner} expired. Go back to {partner} and connect
  again."
  - Add an "Open wallet" button.
  - On Android, also add a button back to the partner app where `meteorConnectHandBack` allows it.
- **Copy.** Today the bridge screen only says "The previous wallet connection has ended."
  (`MeteorConnectBridgeScreen.tsx:641`). Add this setup-specific version.
- **The second attempt is quick,** because the account already exists and is backed up.
- **Measure it.** Send an analytics event with the time from claim to account created, and whether setup finished
  after the session expired. If that happens often, revisit D4.

### 4.6 SDK, bridge and DApps

No change needed. The DApp sees one of:

- a normal sign-in result;
- `"User closed the window before completing the action"` (`MeteorActionError` with `WINDOW_CLOSED`), if the popup is
  closed during backup;
- `mobile_bridge_expired` on mobile.

Sign-in results have no "new account" field, and nothing needs one. If D4 changes the timing, add a short note to
`packages/meteor-sdk-v1/README.md`: first-time users may spend a few minutes inside the popup, and closing it rejects
as usual.

---

## 5. Component changes (reuse and improve)

**v1**

1. **`Section_P3_SecretPhraseConfirmation`:**
   - Add `onVerified?(confirmation: { firstWord; lastWord })` alongside `onConfirm(wasGood)`. Keep the old callback for
     `SubSection_ManageKeys_AddNewKey`. The new one lets callers check the words against the phrase they will save.
   - Keep the decoy grid the same for a given phrase while the component is mounted. Today a remount picks new decoys,
     so repeated tries can narrow down the real words. v2 caches the grid per phrase and clears it on sign-out.
   - If 24-word (ML-DSA) creation is turned back on, make the grid size and the copy depend on the word count. The
     `new_key_transfer.*` copy currently hard-codes "12th word".
2. **`Section_P2_SecretRecoveryPhrase`:** add `allowCopy?: boolean` (D3) and an optional `headerNote?: ReactNode` for
   the DApp line.
3. **New `v1common/modules_utility/cryptography/seedPhraseFirstLast.ts`:** `isSeedPhraseFirstLastMatch(phrase, { firstWord, lastWord })`.
   It normalises with `trim().toLowerCase().normalize("NFKD")`, like the v2 version, and is used by P3 and by
   `createWallet`.
4. **`IOCreateWallet_Input`:** gains `backupConfirmation?`.

**v2**

1. **Rename the backup screen.** Move `NewKeyTransferSeedBackupScreen` to
   `components/by_feature/seed_phrase/SeedPhraseBackupScreen.tsx` with neutral default copy, and do the same for the
   confirmation sheet (`SeedPhraseConfirmationSheet`). Keep re-exports under the old names until the three current
   callers are updated.
2. **`AccountCreate.accountCreate` and `OldAccountImport.importAccountWithSeedPhrase`:** as in §4.4 step 3.
3. **`CreateNewWallet.tsx`:** the new stages and the post-create routing from §4.4 steps 2 and 4.
4. **Session store:** add a selector `hasLivePendingMeteorConnectAction()` to `meteorConnectSessionStore.ts`, with a
   test. Both the bridge no-account footer and `CreateNewWallet` use it.
5. **Audit item L107:** while renaming, apply the hidden-phrase placeholder to the Meteor Connect phrase screens, since
   this screen gains a new caller.
6. **Delete dead code:** remove `SeedPhraseBackup.tsx` and `NewKeyTransferSeedBackupWizard.tsx` (audit item L167), so
   nobody reuses the version with the copy button by mistake.

---

## 6. Implementation phases

### Phase 1: v1 web (`meteor_wallet`), size S–M

1. The `seedPhraseFirstLast.ts` utility and its tests.
2. P3 `onVerified` and a stable decoy grid; P2 `allowCopy` and `headerNote`.
3. `Section_CreateNewWallet_V2`:
   - detect that the creation came from a DApp;
   - run P1 → P2 → P3 → `createWallet`;
   - add the guard at the top of `createWallet`;
   - set `isBackedUp` from the confirmation;
   - reset to P2 after a remount.
4. Translation keys (`en.tsx`, `translation_types.ts`).
5. Tests (§7) and manual QA (§8), using the SDK demo (`packages/meteor-sdk-v1-test-web`, or sdk-demo-dev) for the
   popup.

### Phase 2: v2 mobile (`meteor-v2-apps`), on top of `paul/key-management-v2`, size M

1. Rename and move the backup screen and sheet; apply the L107 placeholder; delete the dead files (§5 v2 items 1, 5
   and 6).
2. The `AccountCreate` and `OldAccountImport` changes, with tests.
3. The backup stages in `CreateNewWallet` when the creation came from a DApp.
4. The session-store selector, the bridge no-account footer, and routing to `/bridge_request/request` after creation.
5. The "expired during setup" screen (§4.5) and its analytics event.
6. Tests (§7). Device QA (§8) against the **remote dev** bridge, because local dev's 24 h lifetime hides the timeout.

### Phase 3: follow-ups that depend on decisions

- **D2:** turn on `requireBackupStep` for in-wallet creation in both wallets.
- **D1:** a backup prompt or block on DApp requests for existing accounts that were never backed up.
- **D4:** the bridge session lifetime for first-time sign-ins.

---

## 7. Tests

**v1** (`bun test` in `meteor-common` / `meteor-frontend`)

- **`seedPhraseFirstLast`:** a match; wrong order; extra whitespace, case and NFKD differences; a 24-word phrase.
- **Wizard step selection.** Pull it out into a pure function, like `newKeyTransferFlow.ts`. Its inputs are
  `{ externalContext, accountKeyType, progress, hasPhrase }` and it returns the next step. Cover:
  - a DApp creation with a local key never reaches `createWallet` before P3;
  - Ledger skips P2 and P3;
  - a remount at P3 goes back to P2.
- **`createWallet` guard:**
  - when the creation came from a DApp, a missing or wrong confirmation throws before any network call (mock
    recaptcha and the API, and assert they weren't called);
  - a correct confirmation leads to `addWalletAccount` with `isBackedUp: true`, so `needsToBackupSeedPhrase: false`.
- **In-wallet creation** is unchanged (`isBackedUp: false`) until D2.

**v2** (`bun test`, `packages/app`)

- **`AccountCreate`:**
  - `seedPhrase` plus a matching confirmation saves `hasBackupSeedphrase: true` and metadata
    `source: "generated", backupConfirmed: true`;
  - a confirmation that doesn't match throws, and the backend API isn't called;
  - `requireBackup` without a confirmation throws;
  - without `seedPhrase`, the old behaviour is unchanged.
- **`importAccountWithSeedPhrase` `origin`:** an import still records `account_import`; a generated, backed-up phrase
  records `generated` with `backupConfirmed`.
- **The new account counts as backed up:** `recoverabilityOfLocalKey` returns `backed_up`, and
  `shouldShowSeedPhraseBackup` returns false (extend `seedPhraseBackup.test.ts`).
- **Session-store selector:** a live action, no action, and an ended session.
- **`CreateNewWallet` step and routing selection:** created from a DApp vs not; session live vs expired.

---

## 8. Manual QA

| # | Wallet | Scenario | Expected |
| --- | --- | --- | --- |
| 1 | v1 web | SDK demo, sign in, popup on a fresh browser profile, "Get Started", create | Password, name, phrase, check, account created, login approval, popup closes. Wallet home afterwards shows no backup warning |
| 2 | v1 web | Same, with wrong words at P3 | Error toast, stays on P3, no account on chain |
| 3 | v1 web | Close the popup at P2 or P3 | The DApp gets the window-closed error; no account on chain |
| 4 | v1 web | Existing account, login request, account selector "Create or import", create | Goes through P2 and P3 |
| 5 | v1 web | Keypom "claim with new account"; `?redirect=` partner create | P2 and P3 before creation, then the existing redirect |
| 6 | v1 web | Let the wallet auto-lock at P3, then sign in again | Back at P2 with a new phrase and the notice |
| 7 | v1 web | In-wallet create, no DApp | Unchanged until D2 |
| 8 | v1 ext | DApp sign-in with no account | The extension modal still offers only import or opening the web wallet |
| 9 | v2 iOS and Android | Fresh install, NEAR Connect DApp QR or link, create from the bridge screen within 5 min | Intro, create, phrase, check, back on the request, approve, then (Android) back to the DApp |
| 10 | v2 | Same, taking more than 5 min | "Wallet ready, request expired" screen; connecting again from the DApp works with the new account |
| 11 | v2 | Kill the app at the backup stage | No account on chain; the next launch starts clean |
| 12 | v2 | "I already have a wallet" from the bridge screen | Import works and the request resumes |
| 13 | v2 | Old route while the session is live: "Back to wallet", intro, create | Still gets the backup stage, because detection uses the session |
| 14 | v2 | In-wallet create with no session | Unchanged until D2 |

---

## 9. Open decisions

**D1. Existing accounts that were never backed up.**

- **Question:** should DApp approval also block or nudge existing accounts that were never backed up? That means v1
  `needsToBackupSeedPhrase` or v2 `hasBackupSeedphrase === false`. Every v1 and v2 user who created an account in the
  wallet and ignored the banner is in this group.
- **Recommendation:** not as a hard block. Later (Phase 3), add a dismissible "Back up your recovery phrase" card on the
  approval screen that links to the existing backup screens. First:
  - v1 needs the `PageBackupSeedPhrase` progress-reset fix and a parameter for returning to the request;
  - v2 `WalletSeedPhraseBackupScreen` needs `account` and `onDone` props in place of its hard-coded
    `dismissTo(home)`.

**D2. The in-wallet create flow.**

- **Question:** should the in-wallet create flow also show and check the phrase? Today neither wallet does.
- **Recommendation:** yes. It is the same component and flag. Ship it after Phases 1 and 2 so we can compare how many
  users finish setup before and after.

**D3. v1 Copy button.**

- **Question:** should P2 keep its Copy button in the DApp flow? v2's policy is no copy button for phrases
  (`PLAN-key-management.md` §5.6), because the clipboard can be read by other apps and is synced across devices.
- **Recommendation:** hide Copy in the DApp flow (`allowCopy={false}`). Leave in-wallet creation as it is until D2.

**D4. The v2 bridge's 5-minute session.**

- **Option 1:** accept it and show the "connect again" screen (§4.5).
- **Option 2:** have the SDK pick `interactive_v1` for `sign_in`. That gives 600 s absolute; the 300 s idle window
  stays. NEAR policy already allows this profile, but it breaks the SDK's one-request-per-session assumption and needs
  the D35 profile review.
- **Recommendation:** accept it for now, and decide using real numbers from the §4.5 analytics.

**D5. v1 popup reload.**

- **Question:** after `navigate("/add_wallet")`, reloading the popup loses `connectionUid` and the request. This
  already happens today, but a longer setup makes reloads more likely.
- **Recommendation:** low priority. Save the wpm connection details in `sessionStorage` while the popup is open.

---

## 10. Related findings (outside this change)

**v1**

- `PageBackupSeedPhrase` never resets `wizards.backupSeedPhrase.progress`, so a second backup in the same session opens
  at the quiz without showing the phrase.
- Harvest Moon settings mark the phrase as backed up as soon as the phrase modal opens, with no check
  (`Page_HMApp_Setting.tsx:71-80`).
- The bridge's `transfer_accounts` imports mnemonics with `isBackedUp: false` (`MeteorConnectBridgeTransfer.tsx:106-121`).

**v2**

- The in-app browser approves `sign_in` automatically (`Dapp.ts:368-379`).
- Switching accounts reloads the in-app browser's WebView and drops requests in progress without rejecting them, so
  the DApp's promise hangs (`BrowserScreen.tsx:66-71`, `WebView.tsx:68-81`).
- The `/external-link` WebView answers NEAR Connect's `near-selector-ready` but has no `onMessage`, so requests from
  that page hang.
- `KeyManagement.confirmKeyBackup` trusts the screen's word check. It doesn't check the words in the store, unlike
  `confirmSeedPhraseBackup`.
- `NewKeyTransferRecoveryScreen.tsx:180-188` ignores an `{ ok: false }` result from `confirmNewKeyTransferBackupV2`.
- The web/extension `new-key-transfer-preview/*` routes have no production guard; Expo's `_layout.tsx` has one.
- Audit item L46 (test restoring a backup on a fresh install) is still open. Add a DApp-created account to that test.

---

## 11. Files to change

**v1 (`meteor_wallet/web/packages/`)**

- `meteor-frontend/src/pages/wallet_create_v2/Section_CreateNewWallet_V2.tsx`
- `meteor-frontend/src/pages/wallet_create_sections/Section_P2_SecretRecoveryPhrase.tsx`
- `meteor-frontend/src/pages/wallet_create_sections/Section_P3_SecretPhraseConfirmation.tsx`
- `meteor-common/src/modules_utility/cryptography/seedPhraseFirstLast.ts` (new) and its test
- `meteor-common/src/modules_app_core/translation/languages/en.tsx` and `translation_types.ts`

**v2 (`meteor-v2-apps/packages/app/`)**

- `app_logic/by_feature/add_wallet/create_new/AccountCreate.ts`
- `app_logic/by_feature/add_wallet/import_wallet_old/OldAccountImport.ts`
- `components/by_feature/add_wallet/create_new/CreateNewWallet.tsx`
- `components/by_feature/meteor_connect/NewKeyTransferSeedBackupScreen.tsx` and
  `NewKeyTransferRecoveryPhraseConfirmationSheet.tsx`, moving to `components/by_feature/seed_phrase/`
- `components/by_feature/seed_phrase/SeedPhraseBackup.tsx` and
  `components/by_feature/meteor_connect/NewKeyTransferSeedBackupWizard.tsx` (delete)
- `app_logic/by_feature/meteor_connect/meteorConnectSessionStore.ts`
- `screens/meteor_connect/MeteorConnectBridgeScreen.tsx`

**SDK / bridge:** none.
