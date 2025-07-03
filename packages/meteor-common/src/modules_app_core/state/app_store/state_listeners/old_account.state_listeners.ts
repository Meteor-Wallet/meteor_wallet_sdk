import { account_utils } from "../../../../modules_feature/accounts/account_utils";
import { memory_state } from "../../memory_state";
import { AppStore } from "../AppStore";

export function registerOldAccountStateListeners() {
  AppStore.subscribe(
    (s) => s.sessionAccounts,
    async (sessionAccounts) => {
      memory_state.updatingKeyStore = true;
      try {
        await account_utils.replaceKeystoresWithSessionAccounts(sessionAccounts);
      } finally {
        memory_state.updatingKeyStore = false;
      }
    },
  );
}
