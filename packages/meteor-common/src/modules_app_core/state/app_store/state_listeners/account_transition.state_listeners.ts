import {
  IAccount_Old,
  ISignedInSessionAccount_Old,
  TSelectedAccount,
} from "../../../../modules_feature/accounts/account_types";
import { AppStore } from "../AppStore";

export function registerAccountTransitionStateListeners() {
  // Reaction to ensure updates roll down from any accounts to the session accounts,
  // along with the selection of the current wallet

  // New version for transition also makes sure that the new wallet user
  // data is updated even if the old methods are used
  AppStore.createReaction(
    (s) =>
      [
        s.currentProfileId,
        s.allAccounts,
        s.sessionState.isSignedIn,
        s.selectedNetwork,
        s.sessionAccounts,
        s.selectedAccountId,
      ] as const,
    (
      [currentProfileId, allAccounts, isSignedIn, network, sessionAccounts, selectedAccountId],
      draft,
      original,
    ) => {
      let newSelectedAccount: TSelectedAccount | undefined;
      let newProfileAccounts: IAccount_Old[] = [];
      let newSessionAccounts: {
        [id: string]: ISignedInSessionAccount_Old;
      } = {};
      const currentProfile = original.profiles.find((p) => p.id === currentProfileId);

      for (const account of allAccounts) {
        if (original.sessionAccounts[account.id] != null) {
          newSessionAccounts[account.id] = {
            ...original.sessionAccounts[account.id],
            ...account,
          };
        }

        if (isSignedIn && account.profileId === currentProfileId && account.network === network) {
          newProfileAccounts.push(account);
        }
      }

      if (
        newProfileAccounts.length > 0 &&
        !newProfileAccounts.some((p) => p.id === selectedAccountId)
      ) {
        selectedAccountId = newProfileAccounts[0].id;
        draft.selectedAccountId = newProfileAccounts[0].id;
      }

      for (const profileAccount of newProfileAccounts) {
        if (isSignedIn && selectedAccountId != null && profileAccount.id === selectedAccountId) {
          if (newSessionAccounts[profileAccount.id] != null) {
            newSelectedAccount = {
              ...profileAccount,
              ...newSessionAccounts[profileAccount.id],
              isDecrypted: true,
            };
          } else {
            newSelectedAccount = {
              ...profileAccount,
              isDecrypted: false,
            };
          }
        }
      }

      // Update store for old account stuff
      if (currentProfile != null) {
        draft.currentProfile = currentProfile;
      }

      draft.selectedAccount = newSelectedAccount;
      draft.currentProfileAccounts = newProfileAccounts;
      draft.sessionAccounts = newSessionAccounts;

      // NEW WALLET USER UPDATES (maintain the old way of updating, but use new wallet user)
      draft.walletUser.selectedAccountId = selectedAccountId;
    },
    {
      runNow: true,
    },
  );
}
