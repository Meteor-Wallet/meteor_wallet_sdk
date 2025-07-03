import { notNullEmpty } from "@meteorwallet/utils/javascript_type_utils/index";
import { ENearNetwork } from "../../../modules_external/near/types/near_basic_types";
import { telegram_utils } from "../../../modules_external/telegram/telegram.utils";
import { EAccountIdentifierType } from "../../../modules_feature/accounts/account_types";
import { TPostMessageSend } from "../../../modules_feature/dapp_connect/types_dappConnect";
import { SeedPhraseAndKeysUtil } from "../../../modules_utility/cryptography/SeedPhraseAndKeysUtil";
import { getMeteorExtensionCom } from "../../app_plaftorms/extension_sync/MeteorExtensionCom";
import {
  AppStateDefault_sendFtState,
  AppStateDefault_sendNftState,
  AppStateDefault_stakeNearState,
  AppStateDefault_unstakeState,
} from "./AppStateDefaults";
import { AppStore } from "./AppStore";
import {
  EChangePasswordWizardProgress,
  ECreateAccountProgress,
  EExtensionStatus,
  EImportAccountProgress,
  ERecoveryType,
  EWalletEncryptionType,
  EWalletImportInputType,
  IAccountSendFtState,
  IAccountSendNftState,
  IAccountStakeNearState,
  IAccountUnstakeState,
  IWizardSection_CreatePassword,
  TExternalAction,
} from "./AppStore_types";

function checkExtensionSync() {
  const { allAccounts, currentProfile } = AppStore.getRawState();

  const checkAccounts = allAccounts
    .filter(
      (acc) =>
        acc.profileId === currentProfile.id &&
        acc.passwordMatchHash === currentProfile.passwordMatchHash,
    )
    .map((acc) => ({
      label: acc.label,
      network: acc.network,
      id: acc.id,
    }));

  getMeteorExtensionCom()
    .checkSyncStatus({
      hash: currentProfile.passwordMatchHash!,
      checkAccounts,
    })
    .then((resp) => {
      if (resp.matched) {
        AppStore.update((s) => {
          s.extensionSync.status = EExtensionStatus.DETECTED_MATCHING_HASH;
          s.extensionSync.accountSyncStatus = resp.accountSync;
        });
      } else {
        AppStore.update((s) => {
          s.extensionSync.status = EExtensionStatus.DETECTED_NO_MATCH_HASH;
          s.extensionSync.accountSyncStatus = {
            extMissing: [],
            webMissing: [],
          };
        });
      }
    });
}

function refreshNewWalletWizards() {
  const seedPhrase = SeedPhraseAndKeysUtil.generateSeedPhrase();

  AppStore.update((s, o) => {
    const preSetPasswordKey =
      o.walletEncryption.type === EWalletEncryptionType.insecure_key ||
      o.walletEncryption.type === EWalletEncryptionType.telegram_key;

    const createNewPasswordState: IWizardSection_CreatePassword = {
      isValid: false,
      typedPassword: "",
      passwordIssue: 0,
      passwordStrength: 0,
    };

    s.wizards.common = {
      recovery: {
        type: ERecoveryType.seed_phrase,
        seedPhrase,
        isBackedUp: false,
      },
    };
    s.wizards.changePassword =
      o.walletEncryption.type === EWalletEncryptionType.insecure_key
        ? {
            progress: EChangePasswordWizardProgress.P1_NEW_PASSWORD,
            oldPassword: o.walletEncryption.insecureKey!,
            createNewPassword: createNewPasswordState,
            action: "change",
          }
        : {
            progress: EChangePasswordWizardProgress.P0_OLD_PASSWORD,
            oldPassword: "",
            createNewPassword: createNewPasswordState,
            action: "change",
          };
    s.wizards.createPassword = {
      isValid: false,
      typedPassword: "",
      passwordIssue: 0,
      passwordStrength: 0,
    };
    s.wizards.createAccount = {
      progress: !preSetPasswordKey
        ? ECreateAccountProgress.P0_START_INPUT_PWD
        : ECreateAccountProgress.P1_PICK_WALLET_NAME,
      acceptedTerms: false,
      accountIdType: EAccountIdentifierType.NAMED,
      initialFundingAmount: 0.1,
    };
    // s.wizards.newNamedAccount = {
    //   progress: ECreateNamedAccountProgress.P0_START_INPUT_PWD,
    //   acceptedTerms: false,
    //   initialFundingAmount: 0.002,
    // };
    // s.wizards.newImplicitAccount = {
    //   progress: ECreateImplicitAccountProgress.P0_START_INPUT_PWD,
    //   acceptedTerms: false,
    // };
    s.wizards.importAccount = {
      importType: EWalletImportInputType.SECRET_PHRASE,
      progress: !preSetPasswordKey
        ? EImportAccountProgress.P0_START_INPUT_PWD
        : EImportAccountProgress.P1_CHOOSE_INPUT_TYPE,
      foundAccountIds: [],
    };
  });
}

function updateAccountSendFtState(
  network: ENearNetwork,
  accountId: string,
  newSendState: Partial<IAccountSendFtState>,
) {
  const id = `${network}::${accountId}`;
  AppStore.update((s, o) => {
    s.sendFtState[id] = {
      ...(o.sendFtState[id] ?? AppStateDefault_sendFtState()),
      ...newSendState,
    };
  });
}

function updateStakeNearState(newStakeState: Partial<IAccountStakeNearState>) {
  AppStore.update((s, o) => {
    s.stakeNearState = {
      ...(o.stakeNearState ?? AppStateDefault_stakeNearState()),
      ...newStakeState,
    };
  });
}

function updateAccountUnstakeState(
  accountId: string,
  newUnstakeState: Partial<IAccountUnstakeState>,
) {
  AppStore.update((s, o) => {
    s.unstakeNearState[accountId] = {
      ...(o.unstakeNearState[accountId] ?? AppStateDefault_unstakeState()),
      ...newUnstakeState,
    };
  });
}

function updateAccountSendNftState(
  network: ENearNetwork,
  accountId: string,
  newSendState: Partial<IAccountSendNftState>,
) {
  const id = `${network}::${accountId}`;

  AppStore.update((s, o) => {
    s.sendNftState[id] = {
      ...(o.sendNftState[id] ?? AppStateDefault_sendNftState()),
      ...newSendState,
    };
  });
}

function updateExternalActionFromPostMessage({ status, ...data }: Partial<TPostMessageSend>) {
  AppStore.update((s, o) => {
    s.externalActions = o.externalActions.map((action) => {
      if (action.uid === data.uid) {
        return {
          ...action,
          ...data,
          connectionStatus: status,
        } as TExternalAction;
      }

      return action;
    });
  });
}

function removeExternalActionById(uid: string) {
  AppStore.update((s, o) => {
    s.externalActions = o.externalActions.filter((action) => action.uid !== uid);
  });
}

async function initializeTelegram() {
  const isTelegramUser = await telegram_utils.checkIsTelegramUser();
  const referralStartParam = await telegram_utils.getStartParam();

  if (isTelegramUser) {
    const telegramUserData = await telegram_utils.getTelegramUserData();

    if (telegramUserData) {
      AppStore.update((s) => {
        s.telegramData = telegramUserData;
        s.isTelegramUser = true;
        s.isLedgerSupported = false;
        s.isTelegramStartParamExist = notNullEmpty(referralStartParam);
      });
      if (referralStartParam) {
        AppStore.update((s) => {
          s.referralStartParam = referralStartParam;
        });
      }
    }
  }
}

export const AppStateActions = {
  updateAccountSendFtState,
  updateAccountSendNftState,
  updateAccountUnstakeState,
  refreshNewWalletWizards,
  updateExternalActionFromPostMessage,
  updateStakeNearState,
  checkExtensionSync,
  removeExternalActionById,
  initializeTelegram,
};
