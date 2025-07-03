import { EErrorId_Security } from "@meteorwallet/core-sdk/errors/ids/MeteorErrorIds";
import { MeteorError } from "@meteorwallet/errors";
import {
  EAccountKeyType,
  EDecryptionKeyType,
  EProfileStatus,
  IAccount_Old,
  IAppUserProfile_Old,
  ISignedInSessionAccount_Old,
  TAccountSecretData,
} from "../../../../modules_feature/accounts/account_types";
import { EncryptionDecryptionUtils } from "../../../../modules_utility/cryptography/EncryptionDecryptionUtils";
import { MeteorEncryptionUtils } from "../../../../modules_utility/cryptography/MeteorEncryptionUtils";
import { nullEmpty } from "../../../../modules_utility/data_type_utils/StringUtils";
import { memory_state } from "../../memory_state";
import { ECommonStateTaskErrorEndTags } from "../../utils/state_tasks.enums";
import { taskFail, taskSuccess } from "../../utils/state_tasks.utils";
import { AppStore } from "../AppStore";
import {
  EWalletEncryptionType,
  TWalletEncryption,
  TWalletEncryption_NextEncryptionData,
} from "../AppStore_types";
import { getDecryptedAccountData } from "./old_account.state_tasks";

interface IOChangeWalletEncryption_Input {
  previousEncryptionCipher?: string;
  nextEncryption: TWalletEncryption_NextEncryptionData;
}

async function setInitialWalletEncryption(data: TWalletEncryption_NextEncryptionData) {
  return changeWalletEncryption({
    nextEncryption: data,
  });
}

async function changeWalletEncryption({
  previousEncryptionCipher,
  nextEncryption,
}: IOChangeWalletEncryption_Input) {
  const { currentProfile, walletEncryption, allAccounts } = AppStore.getRawState();

  let newAccountsAndProfile: IOChangeAccountEncryption_Output | undefined;

  if (currentProfile.status === EProfileStatus.FRESH) {
    if (previousEncryptionCipher != null) {
      throw new Error("Fresh wallets cannot have old encryption data");
    }
  } else {
    if (nullEmpty(previousEncryptionCipher)) {
      throw new Error(
        "Old encryption data is required for non-fresh wallets, to decrypt the old data and encrypt it with the new encryption",
      );
    }

    let nextCipherKey: string | undefined = undefined;

    if (nextEncryption.type === EWalletEncryptionType.telegram_key) {
      nextCipherKey = nextEncryption.userTelegramKey;
    }

    if (nextEncryption.type === EWalletEncryptionType.insecure_key) {
      nextCipherKey = nextEncryption.insecureKey;
    }

    if (nextEncryption.type === EWalletEncryptionType.set_password) {
      nextCipherKey = nextEncryption.passwordValue;
    }

    if (nullEmpty(nextCipherKey)) {
      throw new Error("Invalid next password given");
    }

    try {
      newAccountsAndProfile = await getNewAccountsAndProfileWithChangedEncryptionKey({
        profile: currentProfile,
        accounts: allAccounts,
        nextKey: nextCipherKey,
        previousKey: previousEncryptionCipher,
      });
    } catch (e) {
      if (e instanceof MeteorError && e.hasId(EErrorId_Security.password_incorrect)) {
        return taskFail(ECommonStateTaskErrorEndTags.incorrect_password);
      } else {
        throw e;
      }
    }
  }

  let newWalletEncryption: TWalletEncryption;

  // Create the new wallet encryption
  switch (nextEncryption.type) {
    case EWalletEncryptionType.telegram_key:
      const { userTelegramKey, ...walletEncryption } = nextEncryption;
      memory_state.enteredPassword = userTelegramKey;
      newWalletEncryption = walletEncryption;
      break;
    case EWalletEncryptionType.insecure_key:
      memory_state.enteredPassword = nextEncryption.insecureKey;
      newWalletEncryption = nextEncryption;
      break;
    case EWalletEncryptionType.set_password:
      memory_state.enteredPassword = nextEncryption.passwordValue;
      newWalletEncryption = {
        type: EWalletEncryptionType.set_password,
      };
      break;
    default:
      throw new Error("Unknown wallet encryption type");
  }

  // Do all required updates at once
  AppStore.update((s, o) => {
    s.walletEncryption = newWalletEncryption;

    if (newAccountsAndProfile != null) {
      const { newEncryptedAccounts, newProfile, newSessionAccounts, newLocalStorageSessionState } =
        newAccountsAndProfile;

      s.allAccounts = o.allAccounts.map((account) => {
        if (newEncryptedAccounts[account.id] != null) {
          return newEncryptedAccounts[account.id];
        }

        return account;
      });

      s.sessionAccounts = newSessionAccounts;

      s.localStorageSessionState = {
        state: newLocalStorageSessionState,
        lastTouched: Date.now(),
      };

      s.profiles = o.profiles.map((profile) => {
        if (profile.id === newProfile.id) {
          return newProfile;
        }

        return profile;
      });
    }
  });

  return taskSuccess();
}

interface IOChangeAccountEncryption_Input {
  profile: IAppUserProfile_Old;
  accounts: IAccount_Old[];
  previousKey: string;
  nextKey: string;
}

interface IOChangeAccountEncryption_Output {
  newSessionAccounts: {
    [key: string]: ISignedInSessionAccount_Old;
  };
  newEncryptedAccounts: {
    [key: string]: IAccount_Old;
  };
  newProfile: IAppUserProfile_Old;
  newLocalStorageSessionState: {
    passwordMatchHash: string;
    passwordEncryptKeyHash: string;
    signedInProfileId: string;
  };
}

async function getNewAccountsAndProfileWithChangedEncryptionKey({
  profile,
  previousKey,
  nextKey,
  accounts,
}: IOChangeAccountEncryption_Input): Promise<IOChangeAccountEncryption_Output> {
  // Decrypt the wallet with the old encryption
  // Encrypt the wallet with the new encryption
  const previousMatchHash = await MeteorEncryptionUtils.getOldPasswordMatchHash(previousKey);
  const previousEncryptKeyHash =
    await MeteorEncryptionUtils.getOldPasswordCipherKeyHash(previousKey);

  const nextMatchHash = await MeteorEncryptionUtils.getOldPasswordMatchHash(nextKey);
  const nextEncryptKeyHash = await MeteorEncryptionUtils.getOldPasswordCipherKeyHash(nextKey);

  if (profile.passwordMatchHash !== previousMatchHash) {
    throw MeteorError.fromId(EErrorId_Security.password_incorrect).withMessage(
      "Previous password does not match the profile password",
    );
  }

  const newSessionAccounts: {
    [key: string]: ISignedInSessionAccount_Old;
  } = {};

  const newEncryptedAccounts: {
    [key: string]: IAccount_Old;
  } = {};

  for (const account of accounts) {
    if (account.profileId === profile.id && account.passwordMatchHash === previousMatchHash) {
      let decrypted: TAccountSecretData;

      const thisAccount = { ...account };

      if (account.passwordEncryptKeyType === EDecryptionKeyType.HASHED_SHA256_SALTED) {
        decrypted = await getDecryptedAccountData(account, previousEncryptKeyHash);
      } else {
        decrypted = await getDecryptedAccountData(account, previousKey);
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

      const { salt, payload } = await EncryptionDecryptionUtils.encrypt<TAccountSecretData>(
        nextEncryptKeyHash,
        decrypted,
      );

      newEncryptedAccounts[account.id] = {
        ...thisAccount,
        encrypted: payload,
        salt,
        passwordMatchHash: nextMatchHash,
        passwordEncryptKeyType: EDecryptionKeyType.HASHED_SHA256_SALTED,
      };
    }
  }

  return {
    newSessionAccounts,
    newEncryptedAccounts,
    newProfile: {
      ...profile,
      passwordMatchHash: nextMatchHash,
    },
    newLocalStorageSessionState: {
      passwordMatchHash: nextMatchHash,
      passwordEncryptKeyHash: nextEncryptKeyHash,
      signedInProfileId: profile.id,
    },
  };
}

export const security_state_tasks = {
  changeWalletEncryption,
  setInitialWalletEncryption,
};
