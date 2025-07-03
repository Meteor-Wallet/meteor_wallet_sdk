import { nanoid } from "nanoid";
import { Store, registerInDevtools } from "pullstate";
import { EAccountIdentifierType } from "../../../modules_feature/accounts/account_types";
import { EStakingType, EStakingView } from "../../../modules_feature/staking/staking_types";
import { EMeteorAnalytics_AppReleaseEnvironment } from "../../../modules_utility/analytics/meteor_analytics_enums";
import { EAppPlatformType } from "../../app_plaftorms/app_platform_types";
import { app_env } from "../../env/app_env";
import { EThemeMode } from "../../theme/ThemeStatic";
import { ELanguage } from "../../translation/translation_types";
import { AppStateDefault_profile, AppStateDefault_walletUser } from "./AppStateDefaults";
import {
  EAutoImportAccountProgress,
  EBackupSeedPhraseWizardProgress,
  EChangePasswordWizardProgress,
  ECreateAccountProgress,
  EExtensionStatus,
  EImportAccountProgress,
  EWalletAppMode,
  EWalletEncryptionType,
  EWalletImportInputType,
  IAppStore,
} from "./AppStore_types";

const defaultProfile = AppStateDefault_profile();
const defaultWalletUser = AppStateDefault_walletUser();

const { ENV_IS_DEV, NEAR_DEFAULT_NETWORK } = app_env;

declare global {
  const __VERSION_NUMBER__: string;
}

export const AppStore = new Store<IAppStore>({
  needNetworkIssueWarning: false,
  appDriver: EAppPlatformType.BROWSER_WEB,
  extensionOpenedTab: false,
  deviceInfo: {
    windowIsSmall: true,
  },
  isLedgerSupported: false,
  appRelease: EMeteorAnalytics_AppReleaseEnvironment.production,
  appVersion: __VERSION_NUMBER__,
  externalActions: [],
  externalActionsMeta: {
    withTokenUsdAmount: false,
  },
  externalActionState: {
    currentState: "unsubmitted",
  },
  extensionSync: {
    detected: false,
    status: EExtensionStatus.NOT_DETECTED,
    accountSyncStatus: {
      extMissing: [],
      webMissing: [],
    },
    features: [],
    setFeatures: {
      batchImport: false,
      syncAccounts: false,
      syncCheck: false,
      openPage: false,
    },
  },
  language: ELanguage.en,
  theme: {
    mode: EThemeMode.dark,
  },
  profiles: [defaultProfile],
  stakeNearState: {
    view: EStakingView.STAKE_VIEW_METHOD,
    stakingType: EStakingType.normal,
  },
  unstakeNearState: {},
  sendFtState: {},
  sendNftState: {},
  wizards: {
    common: {},
    createAccount: {
      progress: ECreateAccountProgress.P0_START_INPUT_PWD,
      accountIdType: EAccountIdentifierType.NAMED,
      acceptedTerms: false,
      initialFundingAmount: 0.1,
    },
    createPassword: {
      isValid: false,
      typedPassword: "",
      passwordIssue: 0,
      passwordStrength: 0,
    },
    changePassword: {
      progress: EChangePasswordWizardProgress.P0_OLD_PASSWORD,
      oldPassword: "",
      action: "change",
      createNewPassword: {
        isValid: false,
        typedPassword: "",
        passwordIssue: 0,
        passwordStrength: 0,
      },
    },
    backupSeedPhrase: {
      progress: EBackupSeedPhraseWizardProgress.VALIDATE,
    },
    importAccount: {
      importType: EWalletImportInputType.SECRET_PHRASE,
      progress: EImportAccountProgress.P0_START_INPUT_PWD,
      foundAccountIds: [],
      setPublicKey: "",
    },
    autoImportAccount: {
      progress: EAutoImportAccountProgress.P0_START_INPUT_PWD,
      foundAccountIds: [],
    },
  },
  allAccounts: [],
  currentProfileAccounts: [],
  currentProfile: defaultProfile,
  walletUser: defaultWalletUser,
  currentProfileId: defaultProfile.id,
  sessionId: `${Date.now()}_${nanoid(4)}`,
  sessionAccounts: {},
  sessionState: {
    isSignedIn: false,
  },
  selectedNetwork: NEAR_DEFAULT_NETWORK,
  localStorageSessionState: {},
  quest: {
    isAccepted: null,
    completedTime: "",
  },
  walletEncryption: {
    type: EWalletEncryptionType.set_password,
  },
  meteorFeatureEnrollment: {},
  isTelegramUser: false,
  walletMode: EWalletAppMode.full_wallet,
  telegramData: {
    initData: null,
    platform: "",
    version: "",
    telegramAuthPayload: {
      initDataString: "",
    },
  },
  harvestMoonContractId: "",
  harvestMoonConfigData: {
    config_version: 0,
    space_tinkers: [],
    academies: [],
    vault_levels: [],
    lab_levels: [],
    union_contracts: [],
    relic_contract: "",
  },
  harvestMoonAccountData: {
    deployed_space_tinkers: [],
    last_harvested_at: 0,
    referrer_id: null,
    space_tinkers: {},
    space_tinkers_production_per_hour: "",
    vault_level: 0,
    lab_level: 0,
    gear_level: 0,
    tinker_staked: [],
    staked_relics: [],
    production_per_hour: "0",
    boosted_rate_in_percentage: 0,
  },
  harvestMoonState: {
    showed_abuse_announcement_modal: false,
    showed_promo_modal: false,
    joined_meteor_on_telegram: false,
    joined_meteor_on_x: false,
    linkToTgModal: [],
    trigger_show_configure_rpc_modal: false,
    trigger_show_import_token_modal: false,
    init_message: null,
    showed_campaign_page: false,
    show_campaign_tooltip: false,
  },
  harvestMoonIsSocialOnboardingDone: false,
  meteorLastChangelogId: "",
  isTelegramStartParamExist: false,
  referralStartParam: "",
  isLinkingTelegramInOnboard: false,
  selectedRpc: [],
  customRpc: [],
});

/*AppStore.listenToPatches((patches) => {
	console.log("Store updating with patches", patches);
});*/

if (ENV_IS_DEV) {
  registerInDevtools({
    AppStore,
  });
}
