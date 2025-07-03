import { nanoid } from "nanoid";
import { getDecryptedAccountData } from "../../modules_app_core/state/app_store/state_tasks/old_account.state_tasks";
import { EncryptionDecryptionUtils } from "../../modules_utility/cryptography/EncryptionDecryptionUtils";
import { MeteorEncryptionUtils } from "../../modules_utility/cryptography/MeteorEncryptionUtils";
import { nullEmptyArray } from "../../modules_utility/data_type_utils/ArrayUtils";
import { notNullEmpty } from "../../modules_utility/data_type_utils/StringUtils";
import {
  EAccountKeyType,
  EDecryptionKeyType,
  EWalletUserVersion,
  IAccountKeyItem_PasswordEncryptedPrivate,
  IAccountKeyItem_PasswordEncryptedPrivate_SensitiveData,
  IAccountKeyItem_Web3Auth,
  IAccount_New,
  IAccount_Old,
  IAppUserProfile_Old,
  IAppWalletUser_New,
  ISignedInSessionAccount_New,
  ISignedInWalletUserData,
  TAccountKeyItem,
  TAccountKeyItem_NewKey,
  TAccountKeyItem_PasswordEncryptedPrivate_SignedIn,
  TAccountKeyItem_Web3Auth_SignedIn,
  TAccountSecretData,
  TSignedInAccountKeyItem,
  TWalletUserKnownExternalKey,
  TWalletUserKnownExternalKeySignedIn,
} from "./account_types";

interface IOConvertFromOldProfileToNewWalletUser_Inputs {
  profile: IAppUserProfile_Old;
  accounts: IAccount_Old[];
  password: string;
  selectedAccountId?: string;
}

async function convertFromOldProfileToNewWalletUser(
  inputs: IOConvertFromOldProfileToNewWalletUser_Inputs,
): Promise<IAppWalletUser_New> {
  const { profile, password } = inputs;

  const oldPasswordMatchHash = await MeteorEncryptionUtils.getOldPasswordMatchHash(password);

  if (oldPasswordMatchHash !== profile.passwordMatchHash) {
    throw new Error("Can't convert from profile without correct password");
  }

  const oldCipherHash = await MeteorEncryptionUtils.getOldPasswordCipherKeyHash(password);

  const userSalt = MeteorEncryptionUtils.getNewWalletUserSalt();

  const { matchHash: newMatchHash, cipherHash: newCipherHash } =
    await MeteorEncryptionUtils.getNewPasswordDataFromPassword(password, userSalt);

  const accounts: IAccount_New[] = await Promise.all(
    inputs.accounts.map(async (account) => {
      const result = await convertFromOldAccountToNewAccount({
        oldAccount: account,
        password,
        oldCipherHash,
        newCipherHash,
      });

      return result.newAccount;
    }),
  );

  return {
    id: nanoid(),
    userSalt,
    passwordMatchHash: newMatchHash,
    currentAccountNum: inputs.profile.currentAccountNum,
    accounts,
    addresses: profile.addresses,
    knownExternalKeys: [],
    walletUserVersion: EWalletUserVersion.V202301,
    selectedAccountId: inputs.selectedAccountId,
  };
}

interface IOConvertFromOldAccountToNewAccount_Input {
  oldAccount: IAccount_Old;
  password: string;
  oldCipherHash: string;
  newCipherHash: string;
}

async function convertFromOldAccountToNewAccount({
  oldAccount,
  password,
  oldCipherHash,
  newCipherHash,
}: IOConvertFromOldAccountToNewAccount_Input): Promise<{
  newAccount: IAccount_New;
  signedInKeyData: TSignedInAccountKeyItem[];
}> {
  let decrypted: TAccountSecretData;

  if (oldAccount.passwordEncryptKeyType === EDecryptionKeyType.HASHED_SHA256_SALTED) {
    decrypted = await getDecryptedAccountData(oldAccount, oldCipherHash);
  } else {
    decrypted = await getDecryptedAccountData(oldAccount, password);
  }

  let primaryKey: TAccountKeyItem;

  if (decrypted.type !== EAccountKeyType.HARDWARE) {
    const primaryKeyEncrypted =
      await EncryptionDecryptionUtils.encrypt<IAccountKeyItem_PasswordEncryptedPrivate_SensitiveData>(
        newCipherHash,
        {
          privateKey: decrypted.privateKey,
          recovery: decrypted.recovery,
        },
      );

    primaryKey = {
      isPrimary: true,
      keyType: EAccountKeyType.LOCAL_PRIVATE_KEY,
      publicKey: decrypted.publicKey,
      keyMeta: {
        knownSeedPhrase: decrypted.phrase != null,
      },
      encryption: {
        salt: primaryKeyEncrypted.salt,
        encrypted: primaryKeyEncrypted.payload,
      },
      label: oldAccount.accessKeyLabels?.find((lab) => lab.publicKey === decrypted.publicKey)
        ?.label,
    };
  } else {
    primaryKey = {
      isPrimary: true,
      keyType: EAccountKeyType.HARDWARE,
      hardwareType: decrypted.hardwareType,
      publicKey: decrypted.publicKey,
      label: oldAccount.accessKeyLabels?.find((lab) => lab.publicKey === decrypted.publicKey)
        ?.label,
      path: decrypted.path,
    };
  }

  const restKeyData: TAccountKeyItem[] = await Promise.all(
    decrypted.allKeys?.map(async (key): Promise<TAccountKeyItem> => {
      if (key.keyType === EAccountKeyType.HARDWARE) {
        return {
          keyType: EAccountKeyType.HARDWARE,
          publicKey: key.publicKey,
          isPrimary: false,
          label: oldAccount.accessKeyLabels?.find((lab) => lab.publicKey === key.publicKey)?.label,
          path: key.path,
          hardwareType: key.hardwareType,
        };
      }

      const keyEncrypted =
        await EncryptionDecryptionUtils.encrypt<IAccountKeyItem_PasswordEncryptedPrivate_SensitiveData>(
          newCipherHash,
          {
            privateKey: key.privateKey,
            recovery: key.recovery,
          },
        );

      return {
        isPrimary: false,
        keyType: EAccountKeyType.LOCAL_PRIVATE_KEY,
        publicKey: key.publicKey,
        keyMeta: {
          knownSeedPhrase: key.phrase != null,
        },
        encryption: {
          salt: keyEncrypted.salt,
          encrypted: keyEncrypted.payload,
        },
        label: oldAccount.accessKeyLabels?.find((lab) => lab.publicKey === key.publicKey)?.label,
      };
    }) ?? [],
  );

  const keyData: TAccountKeyItem[] = [primaryKey, ...restKeyData];
  const signedInKeyData: TSignedInAccountKeyItem[] = await Promise.all(
    keyData.map(async (keyItem) =>
      account_data_transformers.decryptAccountKeyItem(keyItem, newCipherHash),
    ),
  );

  return {
    newAccount: {
      id: oldAccount.id,
      num: oldAccount.num,
      type: oldAccount.type,
      fundingStatus: oldAccount.fundingStatus,
      keyData,
      network: oldAccount.network,
      dateAdded: oldAccount.dateAdded,
      label: oldAccount.label,
    },
    signedInKeyData,
  };
}

interface IOChangeWalletUserEncryption_Input {
  walletUser: IAppWalletUser_New;
  prevPassword: string;
  nextPassword: string;
}

interface IOChangeWalletUserEncryption_Output {
  newWalletUser: IAppWalletUser_New;
  newSignedInWalletUser: ISignedInWalletUserData;
}

async function changeWalletUserEncryption({
  walletUser,
  prevPassword,
  nextPassword,
}: IOChangeWalletUserEncryption_Input): Promise<IOChangeWalletUserEncryption_Output> {
  const prevPassData = await MeteorEncryptionUtils.getNewPasswordDataFromPassword(
    prevPassword,
    walletUser.userSalt,
  );

  const nextPassData = await MeteorEncryptionUtils.getNewPasswordDataFromPassword(
    nextPassword,
    walletUser.userSalt,
  );

  const { matchHash } = nextPassData;

  const accountsTransformed = await Promise.all(
    walletUser.accounts.map(async (account) =>
      changeWalletAccountEncryption({
        account,
        prevCipherHash: prevPassData.cipherHash,
        nextCipherHash: nextPassData.cipherHash,
      }),
    ),
  );

  const decryptedKnownKeys = await Promise.all(
    walletUser.knownExternalKeys.map((keyItem) =>
      decryptAccountKeyItem(keyItem, prevPassData.cipherHash),
    ),
  );

  const encryptedKnownKeys = await Promise.all(
    decryptedKnownKeys.map((keyItem) => encryptAccountKeyItem(keyItem, nextPassData.cipherHash)),
  );

  const newWalletUser: IAppWalletUser_New = {
    ...walletUser,
    passwordMatchHash: matchHash,
    knownExternalKeys: encryptedKnownKeys.map((keyData) => keyData.keyItem),
    accounts: accountsTransformed.map((at) => at.newAccount),
  };

  const signedInAccounts = accountsTransformed.map((at) => at.signedInNewAccount);

  return {
    newWalletUser,
    newSignedInWalletUser: {
      paddedPasswordHash: nextPassData.paddedPasswordHash,
      signedInAccounts,
      signedInExternalKeys: encryptedKnownKeys.map((keyData) => keyData.signedInKeyItem),
      selectedAccount: signedInAccounts.find((acc) => acc.id === newWalletUser.selectedAccountId),
    },
  };
}

interface IOChangeWalletAccountEncryption_Input {
  account: IAccount_New;
  prevCipherHash: string;
  nextCipherHash: string;
}

interface IOChangeWalletAccountEncryption_Output {
  newAccount: IAccount_New;
  signedInNewAccount: ISignedInSessionAccount_New;
}

async function changeWalletAccountEncryption({
  account,
  prevCipherHash,
  nextCipherHash,
}: IOChangeWalletAccountEncryption_Input): Promise<IOChangeWalletAccountEncryption_Output> {
  if (nullEmptyArray(account.keyData)) {
    throw new Error("Can't change encryption of wallet account that has no key data");
  }

  const decryptedKeys: TSignedInAccountKeyItem[] = await Promise.all(
    account.keyData.map(
      async (keyItem): Promise<TSignedInAccountKeyItem> =>
        decryptAccountKeyItem(keyItem, prevCipherHash),
    ),
  );

  const newAccount: IAccount_New = {
    ...account,
    keyData: await Promise.all(
      decryptedKeys.map(async (keyItem) => {
        const nextKeyItem = await encryptAccountKeyItem(keyItem, nextCipherHash);
        return nextKeyItem.keyItem;
      }),
    ),
  };

  return {
    newAccount,
    signedInNewAccount: await convertAccountToSignedInAccount({
      account: newAccount,
      cipherHash: nextCipherHash,
    }),
  };
}

async function decryptAccountKeyItem<
  T extends TAccountKeyItem | TWalletUserKnownExternalKey = TAccountKeyItem,
  O extends
    | TSignedInAccountKeyItem
    | TWalletUserKnownExternalKeySignedIn = T extends TWalletUserKnownExternalKey
    ? TWalletUserKnownExternalKeySignedIn
    : TSignedInAccountKeyItem,
>(keyItem: T, cipherHash: string): Promise<O> {
  if (keyItem.keyType === EAccountKeyType.HARDWARE) {
    return keyItem as unknown as O;
  }

  const sensitive: any = await EncryptionDecryptionUtils.decrypt(
    cipherHash,
    keyItem.encryption.salt,
    keyItem.encryption.encrypted,
  );

  return {
    ...keyItem,
    sensitive,
  } as unknown as O;
}

async function encryptAccountKeyItem<
  T extends TSignedInAccountKeyItem | TWalletUserKnownExternalKeySignedIn = TSignedInAccountKeyItem,
  O extends
    | TAccountKeyItem
    | TWalletUserKnownExternalKey = T extends TWalletUserKnownExternalKeySignedIn
    ? TWalletUserKnownExternalKey
    : TAccountKeyItem,
>(
  keyItem: T,
  cipherHash: string,
): Promise<{
  keyItem: O;
  signedInKeyItem: T;
}> {
  if (keyItem.keyType === EAccountKeyType.HARDWARE) {
    return {
      keyItem: keyItem as unknown as O,
      signedInKeyItem: keyItem as unknown as T,
    };
  }

  const { salt, payload } = await EncryptionDecryptionUtils.encrypt(cipherHash, keyItem.sensitive);

  return {
    keyItem: {
      ...keyItem,
      sensitive: undefined,
      encryption: {
        salt,
        encrypted: payload,
      },
    } as unknown as O,
    signedInKeyItem: {
      ...keyItem,
      encryption: {
        salt,
        encrypted: payload,
      },
    } as unknown as T,
  };
}

interface IOConvertAccountToSignedInAccount_Input {
  account: IAccount_New;
  cipherHash: string;
}

async function convertAccountToSignedInAccount({
  account,
  cipherHash,
}: IOConvertAccountToSignedInAccount_Input): Promise<ISignedInSessionAccount_New> {
  return {
    ...account,
    signedInKeyData: await decryptAccountKeyItem(
      // Get the primary key- or if none is available just use the first one in the list
      account.keyData.find((key) => key.isPrimary) ?? account.keyData[0],
      cipherHash,
    ),
  };
}

interface IOConvertWalletUserToSignedInWalletUser_Input {
  walletUser: IAppWalletUser_New;
  paddedPasswordHash: string;
}

async function convertWalletUserToSignedInWalletUser({
  walletUser,
  paddedPasswordHash,
}: IOConvertWalletUserToSignedInWalletUser_Input): Promise<ISignedInWalletUserData> {
  const passwordData = await MeteorEncryptionUtils.getNewPasswordDataFromPaddedHash(
    paddedPasswordHash,
    walletUser.userSalt,
  );

  const signedInAccounts: ISignedInSessionAccount_New[] = await Promise.all(
    walletUser.accounts.map(
      async (account): Promise<ISignedInSessionAccount_New> =>
        account_data_transformers.convertAccountToSignedInAccount({
          account,
          cipherHash: passwordData.cipherHash,
        }),
    ),
  );

  const signedInExternalKeys = await Promise.all(
    walletUser.knownExternalKeys.map(async (key) =>
      account_data_transformers.decryptAccountKeyItem(key, passwordData.cipherHash),
    ),
  );

  return {
    paddedPasswordHash,
    signedInAccounts,
    selectedAccount: signedInAccounts.find((acc) => acc.id === walletUser.selectedAccountId),
    signedInExternalKeys,
  };
}

async function createNewAccountKeyItem(
  keyItem: TAccountKeyItem_NewKey,
  cipherHash: string,
): Promise<{
  keyItem: TAccountKeyItem;
  signedInKeyItem: TSignedInAccountKeyItem;
}> {
  if (keyItem.keyType === EAccountKeyType.HARDWARE) {
    return {
      keyItem: keyItem,
      signedInKeyItem: keyItem,
    };
  }

  const { salt, payload } = await EncryptionDecryptionUtils.encrypt(cipherHash, keyItem.sensitive);

  const encryption = {
    salt,
    encrypted: payload,
  };

  if (keyItem.keyType === EAccountKeyType.LOCAL_PRIVATE_KEY) {
    const signedInKeyItem: TAccountKeyItem_PasswordEncryptedPrivate_SignedIn = {
      ...keyItem,
      keyMeta: {
        knownSeedPhrase: notNullEmpty(keyItem.sensitive.recovery?.seedPhrase),
      },
      encryption,
    };

    const encryptedKeyItem: IAccountKeyItem_PasswordEncryptedPrivate =
      structuredClone(signedInKeyItem);
    delete encryptedKeyItem.sensitive;

    return {
      signedInKeyItem,
      keyItem: encryptedKeyItem,
    };
  }

  if (keyItem.keyType === EAccountKeyType.WEB3AUTH) {
    const signedInKeyItem: TAccountKeyItem_Web3Auth_SignedIn = {
      ...keyItem,
      encryption,
    };

    const encryptedKeyItem: IAccountKeyItem_Web3Auth = structuredClone(signedInKeyItem);
    delete encryptedKeyItem.sensitive;

    return {
      signedInKeyItem,
      keyItem: encryptedKeyItem,
    };
  }

  throw new Error("Unknown Key Item Type");
}

export const account_data_transformers = {
  convertFromOldProfileToNewWalletUser,
  changeWalletUserEncryption,
  convertWalletUserToSignedInWalletUser,
  convertAccountToSignedInAccount,
  decryptAccountKeyItem,
  createNewAccountKeyItem,
};
