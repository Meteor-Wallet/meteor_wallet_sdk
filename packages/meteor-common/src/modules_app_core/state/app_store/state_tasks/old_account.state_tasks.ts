import { ENearNetwork } from "../../../../modules_external/near/types/near_basic_types";
import {
  EAccountFunctionality,
  EAccountFundingStatus,
  EAccountIdentifierType,
  EAccountKeyType,
  EDecryptionKeyType,
  EProfileStatus,
  IAccountPublicKeyLabel,
  IAccount_Old,
  IAppUserProfile_Old,
  IProfileAddressRecent,
  ISignedInSessionAccount_Old,
  TAccountKey_AllKeys_KeyWithType,
  TAccountSecretData,
  TAccountSecretData_AllKeys_Key,
} from "../../../../modules_feature/accounts/account_types";
import { zod_accountKey } from "../../../../modules_feature/accounts/account_verification";
import { EncryptionDecryptionUtils } from "../../../../modules_utility/cryptography/EncryptionDecryptionUtils";
import { MeteorEncryptionUtils } from "../../../../modules_utility/cryptography/MeteorEncryptionUtils";
import { notNullEmpty } from "../../../../modules_utility/data_type_utils/StringUtils";
import { memory_state } from "../../memory_state";
import { ECommonStateTaskErrorEndTags } from "../../utils/state_tasks.enums";
import { TStateTaskOutput, TStateTaskOutputPromise } from "../../utils/state_tasks.types";
import { taskFail, taskSuccess } from "../../utils/state_tasks.utils";
import { AppStore } from "../AppStore";
import { IOPushAccountToRecent_Input } from "./wallet_user.state_tasks";

export async function getDecryptedAccountData(
  account: IAccount_Old,
  cipherKey: string,
): Promise<TAccountSecretData> {
  let decrypted: TAccountSecretData;

  decrypted = await EncryptionDecryptionUtils.decrypt<TAccountSecretData>(
    cipherKey,
    account.salt,
    account.encrypted,
  );

  if (decrypted.type === EAccountKeyType.HARDWARE) {
    const hardwareKey =
      account.keyMeta.keyType === EAccountKeyType.HARDWARE ? account.keyMeta.data : null;

    if (hardwareKey != null) {
      decrypted = {
        ...decrypted,
        ...hardwareKey,
        type: EAccountKeyType.HARDWARE,
      };
    }
  }

  return decrypted;
}

interface IOEnsureUserProfileSetup {
  password: string;
}

async function ensureUserProfileSetup({
  password,
}: IOEnsureUserProfileSetup): TStateTaskOutputPromise<ECommonStateTaskErrorEndTags.incorrect_password> {
  const { currentProfile } = AppStore.getRawState();

  const passwordMatchHash = await MeteorEncryptionUtils.getOldPasswordMatchHash(password);

  if (currentProfile.status === EProfileStatus.FRESH) {
    AppStore.update((s, o) => {
      s.profiles = o.profiles.map((p) => {
        if (p.id === currentProfile.id) {
          return {
            ...currentProfile,
            passwordMatchHash,
            status: EProfileStatus.SET_UP,
          };
        }
        return p;
      });
    });

    return taskSuccess();
  } else if (currentProfile.passwordMatchHash === passwordMatchHash) {
    return taskSuccess();
  }

  return taskFail(ECommonStateTaskErrorEndTags.incorrect_password);
}

export interface IOAddNewWalletAccount_Old {
  accountId: string;
  type: EAccountIdentifierType;
  label?: string;
  // phrase?: string;
  key: TAccountKey_AllKeys_KeyWithType;
  // recovery?: IAccountRecovery_SeedPhrase;
  // privateKey: string;
  // publicKey: string;
  currentProfile: IAppUserProfile_Old;
  password: string;
  network: ENearNetwork;
  skipWalletSetupCheck?: boolean;
}

async function addNewWalletAccount({
  accountId,
  password,
  currentProfile,
  network,
  type,
  key,
  label,
  skipWalletSetupCheck = false,
}: IOAddNewWalletAccount_Old): TStateTaskOutputPromise<string, IAccount_Old> {
  zod_accountKey.parse(key);

  const secretData: TAccountSecretData =
    key.keyType === EAccountKeyType.LOCAL_PRIVATE_KEY
      ? {
          type: EAccountKeyType.LOCAL_PRIVATE_KEY,
          privateKey: key.privateKey,
          publicKey: key.publicKey,
          phrase: key.recovery?.seedPhrase,
          recovery: key.recovery,
          allKeys: [],
        }
      : {
          ...key,
          type: EAccountKeyType.HARDWARE,
          allKeys: [],
        };

  const passwordEncryptKeyHash = await MeteorEncryptionUtils.getOldPasswordCipherKeyHash(password);
  const { salt, payload } = await EncryptionDecryptionUtils.encrypt<TAccountSecretData>(
    passwordEncryptKeyHash,
    secretData,
  );
  const passwordMatchHash = await MeteorEncryptionUtils.getOldPasswordMatchHash(password);
  const hashId = await MeteorEncryptionUtils.getWalletIdHash(accountId);

  const functionality: EAccountFunctionality[] = [];

  if (key.keyType === EAccountKeyType.LOCAL_PRIVATE_KEY && notNullEmpty(key.recovery?.seedPhrase)) {
    functionality.push(EAccountFunctionality.SEED_PHRASE_RECOVERY);
  }

  const newAccount: IAccount_Old = {
    type,
    id: accountId,
    hashId,
    label,
    salt,
    passwordMatchHash,
    encrypted: payload,
    fundingStatus: EAccountFundingStatus.UNFUNDED,
    network,
    profileId: currentProfile.id,
    num: currentProfile.currentAccountNum + 1,
    functionality,
    dateAdded: new Date(),
    passwordEncryptKeyType: EDecryptionKeyType.HASHED_SHA256_SALTED,
    allowVerifyHosts: [],
    keyMeta:
      key.keyType === EAccountKeyType.LOCAL_PRIVATE_KEY
        ? {
            keyType: EAccountKeyType.LOCAL_PRIVATE_KEY,
          }
        : {
            keyType: EAccountKeyType.HARDWARE,
            hardwareType: key.hardwareType,
            data: key,
          },
  };

  AppStore.update((s, o) => {
    const previousAccountIndex = o.allAccounts.findIndex(
      (account) =>
        account.id === accountId &&
        account.passwordMatchHash === passwordMatchHash &&
        account.profileId === currentProfile.id &&
        account.network === network,
    );

    s.profiles = o.profiles.map((p) => {
      if (p.id === currentProfile.id) {
        return {
          ...p,
          currentAccountNum: p.currentAccountNum + 1,
          status: EProfileStatus.SET_UP,
          passwordMatchHash: p.passwordMatchHash ?? passwordMatchHash,
        };
      }

      return p;
    });

    if (previousAccountIndex >= 0) {
      s.allAccounts[previousAccountIndex] = newAccount;
    } else {
      s.allAccounts.push(newAccount);
    }

    s.sessionAccounts[accountId] = {
      ...newAccount,
      decrypted: secretData,
      needsToBackupSeedPhrase:
        key.keyType === EAccountKeyType.LOCAL_PRIVATE_KEY &&
        key.recovery != null &&
        !key.recovery.isBackedUp,
    };
    s.sessionState.isSignedIn = true;
  });

  return taskSuccess(structuredClone(newAccount));
}

export interface IODeleteWalletAccount {
  accountId: string;
  profileId: string;
}

function deleteWalletAccount({ accountId, profileId }: IODeleteWalletAccount): TStateTaskOutput {
  AppStore.update((s, o) => {
    const filteredAccounts = o.allAccounts.filter(
      (acc) => !(acc.profileId === profileId && acc.id === accountId),
    );
    s.allAccounts = filteredAccounts;
    delete s.sessionAccounts[accountId];

    if (o.selectedAccountId === accountId) {
      s.selectedAccountId = filteredAccounts.find((acc) => acc.profileId === profileId)?.id;
    }
  });

  return taskSuccess();
}
/*

interface IOChangeWalletPassword {
  profileId: string;
  oldPassword: string;
  newPassword: string;
}

async function changeWalletPassword({
  oldPassword,
  newPassword,
  profileId,
}: IOChangeWalletPassword): TStateTaskOutputPromise<ECommonStateTaskErrorEndTags.incorrect_password> {
  const oldPasswordMatchHash =
    await MeteorEncryptionUtils.getOldPasswordMatchHash(oldPassword);
  const newPasswordMatchHash =
    await MeteorEncryptionUtils.getOldPasswordMatchHash(newPassword);

  const oldPasswordEncryptKeyHash =
    await MeteorEncryptionUtils.getOldPasswordCipherKeyHash(oldPassword);
  const newPasswordEncryptKeyHash =
    await MeteorEncryptionUtils.getOldPasswordCipherKeyHash(newPassword);

  const newSessionAccounts: {
    [key: string]: ISignedInSessionAccount_Old;
  } = {};

  const newEncryptedAccounts: {
    [key: string]: IAccount_Old;
  } = {};

  const { currentProfile } = AppStore.getRawState();

  if (currentProfile.passwordMatchHash !== oldPasswordMatchHash) {
    return taskFail(ECommonStateTaskErrorEndTags.incorrect_password);
  }

  for (const [
    accountIndex,
    account,
  ] of AppStore.getRawState().allAccounts.entries()) {
    if (
      account.profileId === profileId &&
      account.passwordMatchHash === oldPasswordMatchHash
    ) {
      let decrypted: TAccountSecretData;

      const thisAccount = { ...account };

      if (
        account.passwordEncryptKeyType ===
        EDecryptionKeyType.HASHED_SHA256_SALTED
      ) {
        decrypted = await getDecryptedAccountData(
          account,
          oldPasswordEncryptKeyHash,
        );
      } else {
        decrypted = await getDecryptedAccountData(account, oldPassword);

        const { salt, payload } =
          await EncryptionDecryptionUtils.encrypt<TAccountSecretData>(
            oldPasswordEncryptKeyHash,
            decrypted,
          );

        thisAccount.salt = salt;
        thisAccount.encrypted = payload;
        thisAccount.passwordEncryptKeyType =
          EDecryptionKeyType.HASHED_SHA256_SALTED;

        AppStore.update((s) => {
          s.allAccounts[accountIndex] = thisAccount;
        });
      }

      newSessionAccounts[account.id] = {
        ...thisAccount,
        decrypted:
          decrypted.type !== EAccountKeyType.HARDWARE
            ? {
                type: EAccountKeyType.LOCAL_PRIVATE_KEY,
                privateKey: decrypted.privateKey,
                publicKey: decrypted.publicKey,
                recovery: decrypted.recovery,
              }
            : {
                type: EAccountKeyType.HARDWARE,
                hardwareType: decrypted.hardwareType,
                publicKey: decrypted.publicKey,
                path: decrypted.path,
              },
        needsToBackupSeedPhrase:
          decrypted.type !== EAccountKeyType.HARDWARE &&
          decrypted.recovery != null &&
          !decrypted.recovery.isBackedUp,
      };

      const { salt, payload } =
        await EncryptionDecryptionUtils.encrypt<TAccountSecretData>(
          newPasswordEncryptKeyHash,
          decrypted,
        );

      newEncryptedAccounts[account.id] = {
        ...thisAccount,
        encrypted: payload,
        salt,
        passwordMatchHash: newPasswordMatchHash,
        passwordEncryptKeyType: EDecryptionKeyType.HASHED_SHA256_SALTED,
      };
    }
  }

  AppStore.update((s, o) => {
    s.allAccounts = o.allAccounts.map((acc) => {
      return newEncryptedAccounts[acc.id] ?? acc;
    });

    s.profiles = o.profiles.map((profile) => {
      if (profile.id === profileId) {
        return {
          ...profile,
          passwordMatchHash: newPasswordMatchHash,
        };
      }

      return profile;
    });

    s.localStorageSessionState = {
      state: {
        passwordMatchHash: newPasswordMatchHash,
        passwordEncryptKeyHash: newPasswordEncryptKeyHash,
        signedInProfileId: profileId,
      },
      lastTouched: Date.now(),
    };

    s.sessionAccounts = newSessionAccounts;
  });

  return taskSuccess();
}
*/

export interface IOSignIn_Inputs_Old {
  profileId: string;
  password: string | { passwordMatchHash: string; passwordEncryptKeyHash: string };
  accountIds?: string[];
  overwriteCurrentSessionAccounts?: boolean;
}

async function signIn({
  password,
  profileId,
  accountIds,
  overwriteCurrentSessionAccounts = true,
}: IOSignIn_Inputs_Old): TStateTaskOutputPromise<ECommonStateTaskErrorEndTags.incorrect_password> {
  const passwordMatchHash =
    typeof password === "string"
      ? await MeteorEncryptionUtils.getOldPasswordMatchHash(password)
      : password.passwordMatchHash;

  const passwordEncryptKeyHash =
    typeof password === "string"
      ? await MeteorEncryptionUtils.getOldPasswordCipherKeyHash(password)
      : password.passwordEncryptKeyHash;

  const { currentProfile } = AppStore.getRawState();

  if (currentProfile.passwordMatchHash !== passwordMatchHash) {
    return taskFail(ECommonStateTaskErrorEndTags.incorrect_password);
  }

  const sessionAccounts: {
    [key: string]: ISignedInSessionAccount_Old;
  } = {};

  for (const [accountIndex, account] of AppStore.getRawState().allAccounts.entries()) {
    if (
      account.profileId === profileId &&
      account.passwordMatchHash === passwordMatchHash &&
      (accountIds == null || accountIds.includes(account.id))
    ) {
      let decrypted: TAccountSecretData;

      const thisAccount = { ...account };

      if (account.passwordEncryptKeyType === EDecryptionKeyType.HASHED_SHA256_SALTED) {
        decrypted = await getDecryptedAccountData(account, passwordEncryptKeyHash);
      } else {
        decrypted = await getDecryptedAccountData(account, password as string);

        const { salt, payload } = await EncryptionDecryptionUtils.encrypt<TAccountSecretData>(
          passwordEncryptKeyHash,
          decrypted,
        );

        thisAccount.salt = salt;
        thisAccount.encrypted = payload;
        thisAccount.passwordEncryptKeyType = EDecryptionKeyType.HASHED_SHA256_SALTED;

        AppStore.update((s) => {
          s.allAccounts[accountIndex] = thisAccount;
        });
      }

      if (decrypted.type !== EAccountKeyType.HARDWARE) {
        delete decrypted.phrase;
      }

      delete decrypted.allKeys;

      sessionAccounts[account.id] = {
        ...thisAccount,
        decrypted,
        needsToBackupSeedPhrase:
          decrypted.type !== EAccountKeyType.HARDWARE &&
          decrypted.recovery != null &&
          !decrypted.recovery.isBackedUp,
      };
    }
  }

  if (typeof password === "string") {
    memory_state.enteredPassword = password;
  }

  AppStore.update((s, o) => {
    s.sessionState = {
      isSignedIn: true,
    };

    if (overwriteCurrentSessionAccounts) {
      s.sessionAccounts = sessionAccounts;
    } else {
      s.sessionAccounts = { ...o.sessionAccounts, ...sessionAccounts };
    }

    if (o.selectedAccountId == null || sessionAccounts[o.selectedAccountId] == null) {
      s.selectedAccountId = Object.keys(sessionAccounts)[0];
    }
  });

  // AppStateActions.checkExtensionSync();
  return taskSuccess();
}

export interface IOAddVerifyHostToAccount_Input {
  accountId: string;
  host: string;
  publicKey: string;
}

function addVerifyHostToAccount({
  host,
  accountId,
  publicKey,
}: IOAddVerifyHostToAccount_Input): TStateTaskOutput {
  AppStore.update((s, o) => {
    s.allAccounts = o.allAccounts.map((account) => {
      if (account.id !== accountId) {
        return account;
      }

      if (account.allowVerifyHosts?.find((v) => v.host === host) != null) {
        return account;
      }

      return {
        ...account,
        allowVerifyHosts: [
          ...(account.allowVerifyHosts ?? []),
          {
            host,
            dateAllowed: new Date(),
            publicKeyUsed: publicKey,
          },
        ],
      };
    });
  });

  return taskSuccess();
}

function pushAccountToRecent({
  accountId,
  network,
  type,
  contractName,
  symbol,
  amount,
  decimals,
  tokenId,
}: IOPushAccountToRecent_Input): TStateTaskOutput {
  AppStore.update((s, o) => {
    s.profiles = o.profiles.map((profile) => {
      if (profile.id === o.currentProfileId) {
        /*const savedOrOwnAccount =
					o.currentProfileAccounts.find((a) => a.network === network && a.id === accountId) ??
					profile.addresses.saved.find((a) => a.network === network && a.id === accountId);*/

        const newRecentAddresses: IProfileAddressRecent[] =
          profile.addresses?.recentlyUsed.filter(
            (address) => address.network !== network || address.id !== accountId,
          ) ?? [];

        newRecentAddresses.unshift({
          network,
          id: accountId,
          type,
          amount,
          decimals,
          dateUsed: new Date(),
          contractName,
          symbol,
          tokenId,
        });

        return {
          ...profile,
          addresses: {
            ...profile.addresses,
            recentlyUsed: newRecentAddresses,
          },
        };
      }
      return profile;
    });
  });

  return taskSuccess();
}

export interface IOUpdateAccountFundingState_Input {
  accountId: string;
  newStatus: EAccountFundingStatus;
}

function updateAccountFundingStatus({
  newStatus,
  accountId,
}: IOUpdateAccountFundingState_Input): TStateTaskOutput {
  AppStore.update((s, o) => {
    s.allAccounts = o.allAccounts.map((acc) => {
      if (acc.id === accountId) {
        return {
          ...acc,
          fundingStatus: newStatus,
        };
      }

      return acc;
    });
  });

  return taskSuccess();
}

/*export interface IOAddKnownKeyDataToWalletAccount_Old {
  password: string;
  accountId: string;
  // phrase?: string;
  recovery?: IAccountRecovery_SeedPhrase;
  privateKey: string;
  publicKey: string;
  label?: string;
}*/

export interface IOAddNewKeyDataToWalletAccount_Old {
  password: string;
  accountId: string;
  keyData: TAccountKey_AllKeys_KeyWithType;
  label?: string;
}

async function addNewKeyToWalletAccount({
  accountId,
  keyData,
  password,
  label,
}: IOAddNewKeyDataToWalletAccount_Old): TStateTaskOutputPromise<ECommonStateTaskErrorEndTags.account_not_found> {
  const passwordEncryptKeyHash = await MeteorEncryptionUtils.getOldPasswordCipherKeyHash(password);
  const passwordMatchHash = await MeteorEncryptionUtils.getOldPasswordMatchHash(password);

  const account = AppStore.getRawState().allAccounts.find(
    (acc) => acc.id === accountId && acc.passwordMatchHash === passwordMatchHash,
  );

  if (account == null) {
    console.warn(`Couldn't find account to update key for: ${accountId}, ${passwordMatchHash}`);
    return taskFail(ECommonStateTaskErrorEndTags.account_not_found);
  }

  const accountSecretData = await getDecryptedAccountData(account, passwordEncryptKeyHash);

  const newAccountSecretData: TAccountSecretData = {
    ...accountSecretData,
    allKeys: [...(accountSecretData.allKeys ?? []), keyData],
  };

  const { payload: encryptedData, salt: newSalt } = await EncryptionDecryptionUtils.encrypt(
    passwordEncryptKeyHash,
    newAccountSecretData,
  );

  const newAccountLabels: IAccountPublicKeyLabel[] = notNullEmpty(label)
    ? [
        ...(account.accessKeyLabels ?? []),
        {
          label: label!,
          publicKey: keyData.publicKey,
        },
      ]
    : (account.accessKeyLabels ?? []);

  const newAccount: IAccount_Old = {
    ...account,
    salt: newSalt,
    encrypted: encryptedData,
    accessKeyLabels: newAccountLabels,
  };

  AppStore.update((s, o) => {
    s.allAccounts = o.allAccounts.map((account) => {
      if (account.id === accountId && account.passwordMatchHash === passwordMatchHash) {
        return newAccount;
      }

      return account;
    });
  });

  return taskSuccess();
}

async function getAccountForTask({
  accountId,
  password,
}: {
  accountId: string;
  password: string;
}): TStateTaskOutputPromise<
  ECommonStateTaskErrorEndTags.account_not_found | ECommonStateTaskErrorEndTags.incorrect_password,
  { account: IAccount_Old; passwordEncryptKeyHash: string }
> {
  const passwordEncryptKeyHash = await MeteorEncryptionUtils.getOldPasswordCipherKeyHash(password);
  const passwordMatchHash = await MeteorEncryptionUtils.getOldPasswordMatchHash(password);

  const account = AppStore.getRawState().allAccounts.find(
    (acc) => acc.id === accountId && acc.passwordMatchHash === passwordMatchHash,
  );

  if (account == null) {
    console.warn(`Couldn't find account to update key for: ${accountId}, ${passwordMatchHash}`);
    return taskFail(ECommonStateTaskErrorEndTags.account_not_found);
  }

  return taskSuccess({
    account,
    passwordEncryptKeyHash,
  });
}

export interface IOSetHardwareBackendPrivateKey_Input {
  accountId: string;
  password: string;
  // prefixed private key e.g. "ed25519:..."
  backendPrivateKey: string;
}

async function setHardwareBackendPrivateKey({
  accountId,
  backendPrivateKey,
  password,
}: IOSetHardwareBackendPrivateKey_Input): TStateTaskOutputPromise<
  | ECommonStateTaskErrorEndTags.account_not_found
  | ECommonStateTaskErrorEndTags.account_key_unknown_to_meteor
  | ECommonStateTaskErrorEndTags.account_key_doesnt_match_public_key
  | ECommonStateTaskErrorEndTags.account_key_type_mismatch
> {
  const response = await getAccountForTask({ accountId, password });

  if (!response.success) {
    return response;
  }

  const { account, passwordEncryptKeyHash } = response.result;

  const accountSecretData = await getDecryptedAccountData(account, passwordEncryptKeyHash);

  if (accountSecretData.type !== EAccountKeyType.HARDWARE) {
    return taskFail(ECommonStateTaskErrorEndTags.account_key_type_mismatch);
  }

  accountSecretData.backendPrivateKey = backendPrivateKey;

  const { payload: encryptedData, salt: newSalt } = await EncryptionDecryptionUtils.encrypt(
    passwordEncryptKeyHash,
    accountSecretData,
  );

  const newAccount: IAccount_Old = {
    ...account,
    salt: newSalt,
    encrypted: encryptedData,
  };

  AppStore.update((s, o) => {
    s.allAccounts = o.allAccounts.map((account) => {
      if (
        account.id === newAccount.id &&
        account.passwordMatchHash === newAccount.passwordMatchHash
      ) {
        return newAccount;
      }

      return account;
    });

    delete accountSecretData.allKeys;

    s.sessionAccounts[newAccount.id] = {
      ...o.sessionAccounts[newAccount.id],
      ...newAccount,
      decrypted: accountSecretData,
      needsToBackupSeedPhrase: false,
    };
  });

  return taskSuccess();
}

export interface IOSetAccountKeyBackedUp_Input_Old {
  accountId: string;
  password: string;
  publicKey: string;
}

async function setAccountKeyBackedUp({
  accountId,
  publicKey,
  password,
}: IOSetAccountKeyBackedUp_Input_Old): TStateTaskOutputPromise<
  | ECommonStateTaskErrorEndTags.account_not_found
  | ECommonStateTaskErrorEndTags.account_key_unknown_to_meteor
  | ECommonStateTaskErrorEndTags.account_key_is_not_seed_phrase
  | ECommonStateTaskErrorEndTags.account_key_doesnt_match_public_key
  | ECommonStateTaskErrorEndTags.account_key_type_mismatch
> {
  const response = await getAccountForTask({ accountId, password });

  if (!response.success) {
    return response;
  }

  const { account, passwordEncryptKeyHash } = response.result;

  const accountSecretData = await getDecryptedAccountData(account, passwordEncryptKeyHash);

  if (accountSecretData.type === EAccountKeyType.HARDWARE) {
    return taskFail(ECommonStateTaskErrorEndTags.account_key_type_mismatch);
  }

  if (accountSecretData.publicKey != publicKey) {
    return taskFail(ECommonStateTaskErrorEndTags.account_key_doesnt_match_public_key);
  }

  if (accountSecretData.recovery == null) {
    return taskFail(ECommonStateTaskErrorEndTags.account_key_is_not_seed_phrase);
  }

  accountSecretData.recovery = {
    ...accountSecretData.recovery,
    isBackedUp: true,
  };

  const { payload: encryptedData, salt: newSalt } = await EncryptionDecryptionUtils.encrypt(
    passwordEncryptKeyHash,
    accountSecretData,
  );

  const newAccount: IAccount_Old = {
    ...account,
    salt: newSalt,
    encrypted: encryptedData,
  };

  AppStore.update((s, o) => {
    s.allAccounts = o.allAccounts.map((account) => {
      if (
        account.id === newAccount.id &&
        account.passwordMatchHash === newAccount.passwordMatchHash
      ) {
        return newAccount;
      }

      return account;
    });

    delete accountSecretData.phrase;
    delete accountSecretData.allKeys;

    s.sessionAccounts[newAccount.id] = {
      ...o.sessionAccounts[newAccount.id],
      ...newAccount,
      decrypted: accountSecretData,
      needsToBackupSeedPhrase: false,
    };
  });

  return taskSuccess();
}

export interface IOChangeAccountPrimaryKey_Input_Old {
  accountId: string;
  password: string;
  publicKey: string;
}

async function changeAccountPrimaryKey({
  accountId,
  publicKey,
  password,
}: IOChangeAccountPrimaryKey_Input_Old): TStateTaskOutputPromise<
  | ECommonStateTaskErrorEndTags.account_not_found
  | ECommonStateTaskErrorEndTags.account_key_unknown_to_meteor
> {
  const response = await getAccountForTask({ accountId, password });

  if (!response.success) {
    return response;
  }

  const { account, passwordEncryptKeyHash } = response.result;

  const accountSecretData = await getDecryptedAccountData(account, passwordEncryptKeyHash);

  const currentKey: TAccountKey_AllKeys_KeyWithType =
    accountSecretData.type !== EAccountKeyType.HARDWARE
      ? {
          keyType: EAccountKeyType.LOCAL_PRIVATE_KEY,
          privateKey: accountSecretData.privateKey,
          phrase: accountSecretData.phrase,
          publicKey: accountSecretData.publicKey,
          recovery: accountSecretData.recovery,
        }
      : {
          keyType: EAccountKeyType.HARDWARE,
          publicKey: accountSecretData.publicKey,
          hardwareType: accountSecretData.hardwareType,
          path: accountSecretData.path,
        };

  const newPrimaryKey: TAccountSecretData_AllKeys_Key | undefined = accountSecretData.allKeys?.find(
    (key) => key.publicKey === publicKey,
  );

  if (newPrimaryKey == null) {
    console.warn(`Couldn't find a matching key on account to set as primary key`);

    return taskFail(ECommonStateTaskErrorEndTags.account_key_unknown_to_meteor);
  }

  const keyMap = new Map(accountSecretData.allKeys!.map((key) => [key.publicKey, key]));

  keyMap.set(currentKey.publicKey, currentKey);

  const newAccountSecretData: TAccountSecretData =
    newPrimaryKey.keyType === EAccountKeyType.HARDWARE
      ? {
          ...newPrimaryKey,
          type: newPrimaryKey.keyType,
          allKeys: [...keyMap.values()],
        }
      : {
          ...newPrimaryKey,
          type: EAccountKeyType.LOCAL_PRIVATE_KEY,
          allKeys: [...keyMap.values()],
        };

  const { payload: encryptedData, salt: newSalt } = await EncryptionDecryptionUtils.encrypt(
    passwordEncryptKeyHash,
    newAccountSecretData,
  );

  const newAccount: IAccount_Old = {
    ...account,
    salt: newSalt,
    encrypted: encryptedData,
    keyMeta:
      newPrimaryKey.keyType === EAccountKeyType.HARDWARE
        ? {
            keyType: EAccountKeyType.HARDWARE,
            hardwareType: newPrimaryKey.hardwareType,
            data: newPrimaryKey,
          }
        : {
            keyType: EAccountKeyType.LOCAL_PRIVATE_KEY,
          },
  };

  if (newAccountSecretData.type === EAccountKeyType.LOCAL_PRIVATE_KEY) {
    delete newAccountSecretData.phrase;
  }

  delete newAccountSecretData.allKeys;

  AppStore.update((s, o) => {
    s.allAccounts = o.allAccounts.map((account) => {
      if (
        account.id === newAccount.id &&
        account.passwordMatchHash === newAccount.passwordMatchHash
      ) {
        return newAccount;
      }

      return account;
    });

    s.sessionAccounts[newAccount.id] = {
      ...o.sessionAccounts[newAccount.id],
      ...newAccount,
      decrypted: newAccountSecretData,
    };
  });

  return taskSuccess();
}

function signOut(): TStateTaskOutput {
  AppStore.update((s) => {
    s.localStorageSessionState = {};
    s.sessionState.isSignedIn = false;
    s.sessionAccounts = {};
  });

  return taskSuccess();
}

interface IOUpdateAccountKeyLabel_Input {
  accountId: string;
  newLabel: string;
  publicKey: string;
}

function updateKeyLabel({
  newLabel,
  accountId,
  publicKey,
}: IOUpdateAccountKeyLabel_Input): TStateTaskOutput {
  AppStore.update((s, o) => {
    s.allAccounts = o.allAccounts.map((account) => {
      if (account.id !== accountId) {
        return account;
      }

      const accessKeyLabelMap = new Map(
        account.accessKeyLabels?.map((l) => [l.publicKey, l]) ?? [],
      );
      accessKeyLabelMap.set(publicKey, {
        label: newLabel,
        publicKey,
      });

      return {
        ...account,
        accessKeyLabels: [...accessKeyLabelMap.values()],
      };
    });
  });

  return taskSuccess();
}

export const old_account_state_tasks = {
  signIn,
  signOut,
  addNewWalletAccount,
  deleteWalletAccount,
  ensureUserProfileSetup,
  // changeWalletPassword,
  addVerifyHostToAccount,
  pushAccountToRecent,
  updateAccountFundingStatus,
  addNewKeyToWalletAccount,
  changeAccountPrimaryKey,
  updateKeyLabel,
  setAccountKeyBackedUp,
  setHardwareBackendPrivateKey,
};
