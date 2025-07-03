import { FinalExecutionOutcome } from "@near-js/types";
import Big from "big.js";
import { z } from "zod";
import { ENearNetwork } from "../../../modules_external/near/types/near_basic_types";
import { ITelegramData } from "../../../modules_external/telegram/telegram.types";
import {
  EAccountIdentifierType,
  IAccount_Old,
  IAppUserProfile_Old,
  IAppWalletUser_New,
  ISignedInSessionAccount_Old,
  ISignedInWalletUserData,
  TSelectedAccount,
} from "../../../modules_feature/accounts/account_types";
import {
  EDappActionSource,
  IAccountSyncStatus,
  IDappAction_Login,
  IDappAction_Logout,
  IDappAction_SignMessage,
  IDappAction_SignTransaction,
  IDappAction_VerifyOwner,
} from "../../../modules_feature/dapp_connect/types_dappConnect";
import { IMeteorFungibleTokenWithPrice } from "../../../modules_feature/fungible_tokens/fungible_tokens_types";
import {
  IHarvestMoonAccountData,
  IHarvestMoonGameplayConfig,
  IHarvestMoonState,
} from "../../../modules_feature/harvest_moon/harvest_moon_types";
import { IKeypomAction_Claim } from "../../../modules_feature/linkdrop/keypom_types";
import { EFeatureEnrollmentRecord_ConsentStatus } from "../../../modules_feature/missions/feature_enrollment_records/feature_enrollment_records.enum";
import {
  EStakingType,
  TStakedValidator,
  TValidatorDetails,
} from "../../../modules_feature/staking/staking_types";
import { EMeteorAnalytics_AppReleaseEnvironment } from "../../../modules_utility/analytics/meteor_analytics_enums";
import { EAppPlatformType } from "../../app_plaftorms/app_platform_types";
import { IAppThemeBaseVariables } from "../../theme/theme_types";
import { ELanguage } from "../../translation/translation_types";
import { TTransactionExecutionOutcome } from "../../../modules_feature/accounts/near_signer_executor/NearAccountSignerExecutor.types";

export interface IWizardSection_CreatePassword {
  isValid: boolean;
  typedPassword: string;
  confirmedPassword?: string;
  passwordStrength: number;
  passwordIssue: number;
}

export enum EChangePasswordWizardProgress {
  P0_OLD_PASSWORD = 0,
  P1_NEW_PASSWORD = 1,
  P2_SUCCESS = 2,
}

export interface IWizardSection_ChangePassword {
  progress: EChangePasswordWizardProgress;
  oldPassword: string;
  createNewPassword: IWizardSection_CreatePassword;
  action: "change" | "remove";
}

export enum EBackupSeedPhraseWizardProgress {
  PASSWORD = 0,
  VALIDATE = 1,
  CONFIRM = 2,
  SUCCESS = 3,
}

export interface IWizardSection_BackupSeedPhrase {
  progress: EBackupSeedPhraseWizardProgress;
}

export enum ERecoveryType {
  seed_phrase = "seed_phrase",
}

export interface IAccountRecovery_SeedPhrase {
  type: ERecoveryType.seed_phrase;
  seedPhrase: string;
  isBackedUp: boolean;
}

export enum EEnrollmentDataStatusExtras {
  no_action_started = "no_action_started",
  checking_database = "checking",
  accepted_but_waiting = "accepted_but_waiting",
  rejected_but_waiting = "rejected_but_waiting",
  failed_acceptance = "failed_acceptance",
  failed_rejection = "failed_rejection",
}

export type TEnrollmentDataStatus =
  | EFeatureEnrollmentRecord_ConsentStatus
  | EEnrollmentDataStatusExtras;

export interface IEnrollmentData {
  status: TEnrollmentDataStatus;
  publicKey?: string;
  errorMessage?: string;
}

interface IWizard_NewAccount_Base {
  acceptedTerms: boolean;
}

interface IWizard_NewAccount_Common {
  // secretRecoveryPhrase?: string;
  recovery?: IAccountRecovery_SeedPhrase;
  setPassword?: string;
}

export enum EWalletImportInputType {
  SECRET_PHRASE = "SECRET_PHRASE",
  PRIVATE_KEY = "PRIVATE_KEY",
  HARDWARE = "HARDWARE",
}

export enum EImportAccountProgress {
  P0_START_INPUT_PWD = 0,
  P1_CHOOSE_INPUT_TYPE = 1,
  P2_INPUT_DATA = 2,
  P3_CONFIRM_ACCOUNT_IMPORT = 3,
  P4_CREATED_SUCCESS = 4,
}

export enum EAutoImportAccountProgress {
  P0_START_INPUT_PWD = 0,
  P1_CONFIRM_ACCOUNT_IMPORT = 1,
  P2_IMPORTED_SUCCESS = 2,
}

export interface IWizard_ImportAccount {
  progress: EImportAccountProgress;
  importType: EWalletImportInputType;
  setNetwork?: ENearNetwork;
  setPassword?: string;
  setPhrase?: string;
  setPrivateKey?: string;
  setPublicKey?: string;
  setFullHdPath?: string;
  setAccountId?: string;
  foundAccountIds: string[];
}

export interface IWizard_AutoImportAccount {
  progress: EAutoImportAccountProgress;
  setNetwork?: ENearNetwork;
  setPassword?: string;
  setPrivateKey?: string;
  setPublicKey?: string;
  setAccountId?: string;
  foundAccountIds: string[];
}

export interface IAppSessionState {
  isSignedIn: boolean;
  signedInProfileId?: string;
}

export interface IAccountSendFtState {
  amount: string;
  usdAmount: string;
  selectedContractName: string;
  selectedContractSymbol: string;
  receiverId: string;
  successTransactionId?: string;
  finalExecutionOutcome?: FinalExecutionOutcome;
}

export interface IAccountSendNftState {
  tokenId: string;
  selectedContractName: string;
  receiverId: string;
  successTransactionId?: string;
  finalExecutionOutcome?: FinalExecutionOutcome;
}

export interface IAccountStakeNearState {
  view: string;
  stakingType: EStakingType;
  nearAmount?: Big;
  nearPrice?: number;
  receiveTokenAmount?: Big;
  receiveTokenPrice?: number;
  validator?: TValidatorDetails;
  refresh?: boolean;
  defaultInput?: number;
}

export interface IAccountUnstakeState {
  selectedUnstakedValidator?: TStakedValidator;
  unstakeAmountInput?: Big;
  nearToken?: IMeteorFungibleTokenWithPrice;
  unstakeToken?: IMeteorFungibleTokenWithPrice;
  minimumAmountOutput?: Big;
}

export interface IBatchImportAccount {
  accountId: string;
  secretKey: string;
  label?: string;
}

export enum EBatchImportProgress {
  P0_LANDING_DECRYPT = 0,
  P1_CONFIRM_PASSWORD = 1,
  P2_CONFIRM_ACCOUNT_IMPORT = 2,
  P3_IMPORT_SUCCESS = 3,
}

export interface IBatchImportState {
  progress: EBatchImportProgress;
  hash: string;
  network: ENearNetwork;
  decryptionKey?: string;
  importAccounts?: IBatchImportAccount[];
  chosenPassword?: string;
}

export enum EExtensionStatus {
  NOT_DETECTED = "NOT_DETECTED",
  DETECTED = "DETECTED",
  DETECTED_MATCHING_HASH = "DETECTED_MATCHING_HASH",
  DETECTED_NO_MATCH_HASH = "DETECTED_NO_MATCH_HASH",
}

export interface IMeteorExtensionSetFeatures {
  batchImport: boolean;
  openPage: boolean;
  syncCheck: boolean;
  syncAccounts: boolean;
}

export interface IExtensionSync {
  detected: boolean;
  status: EExtensionStatus;
  accountSyncStatus: IAccountSyncStatus;
  features: string[];
  setFeatures: IMeteorExtensionSetFeatures;
}

export enum EWalletEncryptionType {
  insecure_key = "insecure_key",
  telegram_key = "telegram_key",
  set_password = "set_password",
}

export interface IWalletEncryption_InsecureKey {
  type: EWalletEncryptionType.insecure_key;
  insecureKey: string;
  wasUserChoice?: boolean;
}

export interface IWalletEncryption_SetPassword {
  type: EWalletEncryptionType.set_password;
}

export interface IWalletEncryption_TelegramKey {
  type: EWalletEncryptionType.telegram_key;
  version: "v2";
  localKey?: string;
}

export type TWalletEncryption =
  | IWalletEncryption_InsecureKey
  | IWalletEncryption_SetPassword
  | IWalletEncryption_TelegramKey;

export interface IWalletEncryption_SetPassword_WithValue extends IWalletEncryption_SetPassword {
  passwordValue: string;
}

export interface IWalletEncryption_TelegramKey_WithValue extends IWalletEncryption_TelegramKey {
  userTelegramKey: string;
}

export type TWalletEncryption_PreviousEncryptionData = Pick<TWalletEncryption, "type"> & {
  cipherKey: string;
};

export type TWalletEncryption_NextEncryptionData =
  | IWalletEncryption_InsecureKey
  | IWalletEncryption_TelegramKey_WithValue
  | IWalletEncryption_SetPassword_WithValue;

export interface IDeviceInfo {
  windowIsSmall: boolean;
}

export enum ECreateAccountProgress {
  P0_START_INPUT_PWD = 0,
  P1_PICK_WALLET_NAME = 1,
  P2_GEN_PHASE = 2,
  P3_CONFIRM_PHASE = 3,
  P4_WALLET_FUNDING = 4,
  P5_SELECT_HD_PATH = 5,
  P6_CREATED_LINKDROP_SUCCESS = 6,
  P6_CREATED_SUCCESS = 7,
}

export interface IWizard_CreateAccount extends IWizard_NewAccount_Base {
  progress: ECreateAccountProgress;
  accountIdType: EAccountIdentifierType;
  initialFundingAmount: number;
  setNamedAccountId?: string;
  setFundingAccountId?: string;
  linkedAccountIds?: string[];
}

export type TExternalAction =
  | IDappAction_Login
  | IDappAction_SignTransaction
  | IDappAction_Logout
  | IDappAction_VerifyOwner
  | IKeypomAction_Claim
  | IDappAction_SignMessage;

export type TInitRedirect =
  | {
      route_id: "ledger_create";
      name: string;
    }
  | {
      route_id: "ledger_import";
    }
  | {
      route_id: "harvest_moon";
    };

export enum EWalletAppMode {
  full_wallet = "full_wallet",
  harvest_moon_app = "harvest_moon_app",
}

export const zRpcItem = z.object({
  nodeUrl: z.string(),
  name: z.string(),
  network: z.nativeEnum(ENearNetwork),
});

export const zRpcItems = z.array(zRpcItem);

export type TRpcItem = z.infer<typeof zRpcItem>;

export type TExternalActionState =
  | {
      currentState: "unsubmitted" | "processing";
    }
  | {
      currentState: "finished";
      outcome?: TTransactionExecutionOutcome;
    };

export interface IAppStore {
  needNetworkIssueWarning: boolean;
  deviceInfo: IDeviceInfo;
  appDriver: EAppPlatformType;
  extensionOpenedTab: boolean;
  appVersion: string;
  appRelease: EMeteorAnalytics_AppReleaseEnvironment;
  initRedirect?: TInitRedirect;
  isLedgerSupported: boolean;
  externalActionSource?: EDappActionSource;
  externalActions: TExternalAction[];
  externalActionsMeta: {
    tokenUsdAmount?: number;
    withTokenUsdAmount: boolean;
  };
  extensionSync: IExtensionSync;
  batchImportState?: IBatchImportState;
  sendFtState: {
    [accountId: string]: IAccountSendFtState;
  };
  sendNftState: {
    [accountId: string]: IAccountSendNftState;
  };
  stakeNearState: IAccountStakeNearState;
  unstakeNearState: {
    [accountId: string]: IAccountUnstakeState;
  };
  language: ELanguage;
  theme: IAppThemeBaseVariables;
  externalActionState: TExternalActionState;
  wizards: {
    common: IWizard_NewAccount_Common;
    createAccount: IWizard_CreateAccount;
    // newNamedAccount: IWizard_NewNamedAccount;
    // newImplicitAccount: IWizard_NewImplicitAccount;
    importAccount: IWizard_ImportAccount;
    autoImportAccount: IWizard_AutoImportAccount;
    createPassword: IWizardSection_CreatePassword;
    changePassword: IWizardSection_ChangePassword;
    backupSeedPhrase: IWizardSection_BackupSeedPhrase;
  };
  // newAccountWizard: IWizard_NewAccount;
  // importAccountWizard: IWizard_NewAccount;
  // createPasswordWizardSection: IWizardSection_CreatePassword;
  allAccounts: IAccount_Old[];
  currentProfileAccounts: IAccount_Old[];
  selectedAccountId?: string;
  // /** @deprecated `walletUser` property is always the selected profile */
  currentProfileId: string;
  selectedAccount?: TSelectedAccount;
  profiles: IAppUserProfile_Old[];
  currentProfile: IAppUserProfile_Old;
  walletUser: IAppWalletUser_New;
  signedInWalletUser?: ISignedInWalletUserData;
  sessionId: string;
  sessionAccounts: {
    [id: string]: ISignedInSessionAccount_Old;
  };
  sessionState: IAppSessionState;
  localStorageSessionState: {
    state?: {
      passwordEncryptKeyHash: string;
      passwordMatchHash: string;
      signedInProfileId: string;
    };
    newState?: {
      paddedPasswordHash: string;
    };
    lastTouched?: number;
  };
  selectedNetwork: ENearNetwork;
  quest: {
    isAccepted: boolean | null;
    completedTime: string;
  };
  meteorFeatureEnrollment: {
    [walletId: string]: IEnrollmentData;
  };
  walletEncryption: TWalletEncryption;
  isTelegramUser: boolean;
  telegramData: ITelegramData;
  isTelegramStartParamExist: boolean;
  referralStartParam: string;
  walletMode: EWalletAppMode;
  harvestMoonContractId: string;
  harvestMoonConfigData: IHarvestMoonGameplayConfig;
  harvestMoonAccountData: IHarvestMoonAccountData;
  harvestMoonState: IHarvestMoonState;
  harvestMoonIsSocialOnboardingDone: boolean;
  updatingKeyStore?: boolean;
  meteorLastChangelogId: string;
  isLinkingTelegramInOnboard: boolean;
  selectedRpc: TRpcItem[];
  customRpc: TRpcItem[];
}
