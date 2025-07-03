import { AppStore } from "../AppStore";

export function registerWalletUserStateListeners() {
  // Listen for any primary key changes in the signed in wallet user
  // accounts (will also trigger when signing in for first time)
  // and add them to the Near API JS memory keystore

  /*AppStore.subscribe(
    (s) =>
      s.signedInWalletUser?.signedInAccounts.map(
        (account) => account.signedInKeyData,
      ),
    async (_, s) => {
      if (s.signedInWalletUser != null) {
        await account_utils.replaceKeystoresWithSignedInAccounts(
          s.signedInWalletUser.signedInAccounts,
        );
      }
    },
  );*/

  AppStore.createReaction(
    (s) => s.walletUser.selectedAccountId,
    (selectedAccountId, draft, original) => {
      if (original.signedInWalletUser != null) {
        draft.signedInWalletUser!.selectedAccount =
          original.signedInWalletUser.signedInAccounts.find((acc) => acc.id === selectedAccountId);
      }
    },
  );
}
