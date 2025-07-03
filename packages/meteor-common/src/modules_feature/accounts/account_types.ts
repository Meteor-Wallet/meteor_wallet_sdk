import { IAccountRecovery_SeedPhrase } from "../../modules_app_core/state/app_store/AppStore_types";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { IWithAccountIdAndNetwork } from "../../modules_external/near/types/near_input_helper_types";
import { INep0413_SignedMessage } from "../../modules_external/near/types/standards/wallet_standard_types";
import { ESupportedHardwareWalletType } from "../hardware_wallet/hardware_wallet_types";

export interface IAccountFullAccessKey {
  keyType?: EAccountKeyType.LOCAL_PRIVATE_KEY;
  privateKey: string;
  publicKey: string;
  phrase?: string;
  recovery?: IAccountRecovery_SeedPhrase;
}

export interface IAccountHardwareKey_Ledger {
  keyType: EAccountKeyType.HARDWARE;
  hardwareType: ESupportedHardwareWalletType.LEDGER;
  publicKey: string;
  path: string;
}

export type TAccountLocalKey = IAccountFullAccessKey & {
  keyType: EAccountKeyType.LOCAL_PRIVATE_KEY;
};

export type TAccountKey_AllKeys_KeyWithType = TAccountLocalKey | IAccountHardwareKey_Ledger;

export type TAccountSecretData_AllKeys_Key = IAccountFullAccessKey | IAccountHardwareKey_Ledger;

export interface IAccountSecretData_LocalPrivateKey {
  type?: EAccountKeyType.LOCAL_PRIVATE_KEY;
  privateKey: string;
  publicKey: string;
  phrase?: string;
  recovery?: IAccountRecovery_SeedPhrase;
  allKeys?: TAccountSecretData_AllKeys_Key[];
}

export interface IAccountSecretData_Hardware extends Omit<IAccountHardwareKey_Ledger, "keyType"> {
  type: EAccountKeyType.HARDWARE;
  allKeys?: TAccountSecretData_AllKeys_Key[];
  backendPrivateKey?: string;
}

export type TAccountSecretData = IAccountSecretData_LocalPrivateKey | IAccountSecretData_Hardware;

export enum EAccountKeyType {
  LOCAL_PRIVATE_KEY = "LOCAL_PRIVATE_KEY",
  HARDWARE = "HARDWARE",
  WEB3AUTH = "WEB3AUTH",
}

interface IAccountKeyItem_Base {
  label?: string;
  publicKey: string;
  isPrimary: boolean;
}

export enum EDecryptionKeyType {
  DIRECT = "DIRECT",
  HASHED_SHA256_SALTED = "HASHED_SHA256_SALTED",
}

export interface IAccountKeyItem_PasswordEncryptedPrivate_SensitiveData {
  privateKey: string;
  recovery?: IAccountRecovery_SeedPhrase;
}

export interface IAccountKeyItem_PasswordEncryptedPrivate extends IAccountKeyItem_Base {
  keyType: EAccountKeyType.LOCAL_PRIVATE_KEY;
  keyMeta: {
    knownSeedPhrase: boolean;
  };
  /**
   * Holds the private key (and seed phrase if we know about it)
   */
  encryption: {
    salt: string;
    encrypted: string;
  };
  sensitive?: IAccountKeyItem_PasswordEncryptedPrivate_SensitiveData;
}

/*interface IAccountKeyItem_Mpc_EncryptedData {
  partOne: string;
}*/

interface IWeb3AuthUserDetails {
  typeOfLogin: string;
  name: string;
  email: string;
  profileImage: string;
  verifier: string;
  verifierId: string;
  aggregateVerifier: string;
}

export interface IAccountKeyItem_Web3Auth_SensitiveData {
  privateKey: string;
  userDetails: IWeb3AuthUserDetails;
}

export interface IAccountKeyItem_Web3Auth extends IAccountKeyItem_Base {
  keyType: EAccountKeyType.WEB3AUTH;
  /**
   * Holds the private key that we've received from Web3Auth
   * (user doesn't need to sign in with web3auth again...)
   */
  encryption: {
    salt: string;
    encrypted: string;
  };
  sensitive?: IAccountKeyItem_Web3Auth_SensitiveData;
}

export interface IAccountKeyItem_HardwareWallet extends IAccountKeyItem_Base {
  keyType: EAccountKeyType.HARDWARE;
  hardwareType: ESupportedHardwareWalletType;
  path: string;
}

export type TAccountKeyItem =
  | IAccountKeyItem_PasswordEncryptedPrivate
  | IAccountKeyItem_HardwareWallet
  | IAccountKeyItem_Web3Auth;

export type TAccountKeyItem_PasswordEncryptedPrivate_SignedIn =
  IAccountKeyItem_PasswordEncryptedPrivate & {
    sensitive: IAccountKeyItem_PasswordEncryptedPrivate_SensitiveData;
  };

export type TAccountKeyItem_Web3Auth_SignedIn = IAccountKeyItem_Web3Auth & {
  sensitive: IAccountKeyItem_Web3Auth_SensitiveData;
};

export type TSignedInAccountKeyItem =
  | TAccountKeyItem_PasswordEncryptedPrivate_SignedIn
  | TAccountKeyItem_Web3Auth_SignedIn
  | IAccountKeyItem_HardwareWallet;

type TAccountKeyItem_PasswordEncryptedPrivate_NewKey = Pick<
  TAccountKeyItem_PasswordEncryptedPrivate_SignedIn,
  "sensitive" | "keyType" | "label" | "isPrimary" | "publicKey"
>;

type TAccountKeyItem_Web3Auth_NewKey = Pick<
  TAccountKeyItem_Web3Auth_SignedIn,
  "sensitive" | "keyType" | "label" | "isPrimary" | "publicKey"
>;

/*type TAccountKeyItem_Hardware_NewKey = Pick<
  IAccountKeyItem_HardwareWallet,
  "keyType" | "label" | "isPrimary" | "publicKey"
>;*/

export type TAccountKeyItem_NewKey =
  | TAccountKeyItem_PasswordEncryptedPrivate_NewKey
  | TAccountKeyItem_Web3Auth_NewKey
  | IAccountKeyItem_HardwareWallet;

export enum EAccountProfileType {
  LOCAL = "LOCAL",
  NEAR_SOCIAL = "NEAR_SOCIAL",
}

type TNearSocialImageType =
  | {
      ipfs_cid: string;
    }
  | {
      nft: {
        contractId: string;
        tokenId: string;
      };
    }
  | {
      url: string;
    };

export enum EAccountFundingStatus {
  UNFUNDED = "UNFUNDED",
  FUNDED = "FUNDED",
}

export enum EAccountFunctionality {
  SEED_PHRASE_RECOVERY = "SEED_PHRASE_RECOVERY",
}

export interface IAccountAllowVerifyHost {
  dateAllowed: Date;
  host: string;
  publicKeyUsed: string;
}

export interface IAccountPublicKeyLabel {
  publicKey: string;
  label?: string;
}

export enum EGetKeysPermissionType {
  ALL = "ALL",
  FULL_ACCESS = "FULL_ACCESS",
  FUNCTION_CALL = "FUNCTION_CALL",
}

export enum EAccountIdentifierType {
  IMPLICIT = "IMPLICIT",
  NAMED = "NAMED",
  EVM = "EVM",
}

export enum EAccountImportType {
  SEED_PHRASE = "SEED_PHRASE",
  BATCH_IMPORT_PRIVATE_KEY = "BATCH_IMPORT_PRIVATE_KEY",
  PRIVATE_KEY = "PRIVATE_KEY",
}

export interface IAccountKeyMeta_Ledger {
  keyType: EAccountKeyType.HARDWARE;
  hardwareType: ESupportedHardwareWalletType.LEDGER;
  data: IAccountHardwareKey_Ledger;
}

export interface IAccountKeyMeta_LocalPrivate {
  keyType: EAccountKeyType.LOCAL_PRIVATE_KEY;
}

export interface IAccount_Base {
  id: string;
  num: number;
  label?: string;
  namedPart?: string;
  fundingStatus: EAccountFundingStatus;
  type: EAccountIdentifierType;
  dateAdded: Date;
  network: ENearNetwork;
}

export type TAccountKeyMeta = IAccountKeyMeta_Ledger | IAccountKeyMeta_LocalPrivate;

export interface IAccount_Old extends IAccount_Base {
  hashId: string;
  // walletProfile?: IAccountSocialProfile
  salt: string;
  profileId: string;
  passwordMatchHash: string;
  passwordEncryptKeyType?: EDecryptionKeyType;
  encrypted: string;
  keyMeta: TAccountKeyMeta;
  knownHardwareKeys?: IAccountHardwareKey_Ledger[];
  accessKeyLabels?: IAccountPublicKeyLabel[];
  functionality: EAccountFunctionality[];
  allowVerifyHosts?: IAccountAllowVerifyHost[];
  // isDecrypted: false;
  // decrypted?: undefined;
}

export interface ISignedInSessionAccount_Old extends Omit<IAccount_Old, "decrypted"> {
  decrypted: TAccountSecretData;
  needsToBackupSeedPhrase: boolean;
}

export interface ISelectedAccountDecrypted extends ISignedInSessionAccount_Old {
  isDecrypted: true;
  needsToBackupSeedPhrase: boolean;
}

export interface ISelectedAccountNotDecrypted extends IAccount_Old {
  isDecrypted: false;
  decrypted?: undefined;
  needsToBackupSeedPhrase?: undefined;
}

export type TSelectedAccount = ISelectedAccountDecrypted | ISelectedAccountNotDecrypted;

export interface IAccount_New extends IAccount_Base {
  keyData: TAccountKeyItem[];
}

export interface ISignedInSessionAccount_New extends IAccount_New {
  signedInKeyData: TSignedInAccountKeyItem;
}

export interface IAccountSignedRequestInputs<T> extends IWithAccountIdAndNetwork {
  inputs: T;
  signed: INep0413_SignedMessage;
  nonce: number[];
  receiver: string;
}

export enum EProfileStatus {
  FRESH = "FRESH",
  SET_UP = "SET_UP",
  CORRUPTED = "CORRUPTED",
}

export interface IProfileAddress_Base {
  network: ENearNetwork;
  dateUsed: Date;
  id: string;
}

export interface IProfileAddressSaved extends IProfileAddress_Base {
  label: string;
  desc?: string;
  dateAdded: Date;
}

export interface IProfileAddressRecent extends IProfileAddress_Base {
  contractName: string;
  type: "ft" | "nft";
  symbol?: string;
  amount?: string;
  decimals?: number;
  tokenId?: string;
}

export interface IUserAddressBook {
  recentlyUsed: IProfileAddressRecent[];
  saved: IProfileAddressSaved[];
}

export type TWalletUserKnownExternalKey = IAccountKeyItem_Web3Auth | IAccountKeyItem_HardwareWallet;

export type TWalletUserKnownExternalKeySignedIn =
  | TAccountKeyItem_Web3Auth_SignedIn
  | IAccountKeyItem_HardwareWallet;

export enum EWalletUserVersion {
  V202301 = "V202301",
}

export interface IAppUserProfile_Old {
  id: string;
  currentAccountNum: number;
  passwordMatchHash?: string;
  status: EProfileStatus;
  addresses: IUserAddressBook;
}

export interface IAppWalletUser_New {
  id: string;
  walletUserVersion: EWalletUserVersion.V202301;
  currentAccountNum: number;
  userSalt: string;
  // If undefined - then this user is "fresh" and
  // needs to create a password for the wallet
  // before being able to continue
  passwordMatchHash?: string;
  addresses: IUserAddressBook;
  selectedAccountId?: string;
  accounts: IAccount_New[];
  knownExternalKeys: TWalletUserKnownExternalKey[];
}

export interface INewPasswordData {
  paddedPasswordHash: string;
  matchHash: string;
  cipherHash: string;
}

export interface ISignedInWalletUserData {
  paddedPasswordHash: string;
  selectedAccount?: ISignedInSessionAccount_New;
  signedInAccounts: ISignedInSessionAccount_New[];
  signedInExternalKeys: TWalletUserKnownExternalKeySignedIn[];
}

export enum EAccountErrorType {
  invalid_account = "invalid_account",
  invalid_account_length_short = "invalid_account_length_short",
  invalid_account_length_long = "invalid_account_length_long",
  invalid_account_format = "invalid_account_format",
}

export type TWalletId_Status =
  | ""
  | "account_exists"
  | "account_no_exists"
  | "new_referrer_same_as_old_referrer"
  | "current_lab_level_exceed_1"
  | "new_referrer_harvest_moon_not_init"
  | "new_referrer_not_tg_linked"
  | "new_referrer_must_be_primary_wallet"
  | "error_checking"
  | "responder_production_rate_exceed_0.1";

export type TAccountChain = "NEAR" | "EVM";
