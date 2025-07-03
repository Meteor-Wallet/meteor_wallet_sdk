import {
  EProfileStatus,
  IAppUserProfile_Old,
} from "../../../../modules_feature/accounts/account_types";
import { AppStateDefault_profile } from "../AppStateDefaults";
import { AppStore } from "../AppStore";

function rescueUndefinedProfile() {
  const freshProfile = AppStateDefault_profile();

  AppStore.update((s, o) => {
    if (o.allAccounts.length === 0) {
      // Set fresh profile if no accounts
      s.currentProfile = freshProfile;
      s.profiles = [freshProfile];
      s.currentProfileId = freshProfile.id;
      return;
    }

    // Else we need to try and recreate the old profile from current accounts
    const profileId = o.allAccounts.find((account) => account.profileId != null)?.profileId;

    const passwordMatchHash = o.allAccounts.find(
      (account) => account.passwordMatchHash != null,
    )?.passwordMatchHash;

    if (profileId == null) {
      throw new Error("No profile found on accounts");
    }

    if (passwordMatchHash == null) {
      throw new Error("No passwordMatchHash found on accounts, can't decrypt accounts");
    }

    const newProfile: IAppUserProfile_Old = {
      id: profileId,
      currentAccountNum: 0,
      status: EProfileStatus.SET_UP,
      passwordMatchHash,
      addresses: {
        recentlyUsed: [],
        saved: [],
      },
    };

    s.currentProfileId = profileId;
    s.currentProfile = newProfile;
    s.profiles = [newProfile];
  });
}

export const profile_state_tasks = {
  rescueUndefinedProfile,
};
