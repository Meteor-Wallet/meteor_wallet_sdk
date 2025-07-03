import { MeteorAppUtils } from "@meteorwallet/app/src/utils/MeteorAppUtils";
import { ENearNetwork } from "../../../../modules_external/near/types/near_basic_types";
import { IWithAccountId } from "../../../../modules_external/near/types/near_input_helper_types";
import { account_data_transformers } from "../../../../modules_feature/accounts/account_data_transformers";
import {
  EAccountFundingStatus,
  EAccountKeyType,
  IAccount_New,
  IProfileAddressRecent,
  ISignedInSessionAccount_New,
  TAccountKeyItem,
  TAccountKeyItem_NewKey,
} from "../../../../modules_feature/accounts/account_types";
import { MeteorEncryptionUtils } from "../../../../modules_utility/cryptography/MeteorEncryptionUtils";
import { ECommonStateTaskErrorEndTags } from "../../utils/state_tasks.enums";
import { TStateTaskOutput, TStateTaskOutputPromise } from "../../utils/state_tasks.types";
import { taskFail, taskSuccess } from "../../utils/state_tasks.utils";
import { AppStore } from "../AppStore";
import { IOUpdateAccountFundingState_Input } from "./old_account.state_tasks";

export interface IOEnsureCurrentWalletUserSetup_Input {
  password: string;
}

async function ensureCurrentWalletUserSetup({
  password,
}: IOEnsureCurrentWalletUserSetup_Input): TStateTaskOutputPromise<ECommonStateTaskErrorEndTags.incorrect_password> {
  const walletUser = AppStore.getRawState().walletUser;

  const passwordData = await MeteorEncryptionUtils.getNewPasswordDataFromPassword(
    password,
    walletUser.userSalt,
  );

  if (walletUser.passwordMatchHash == null) {
    AppStore.update((s, o) => {
      s.walletUser.passwordMatchHash = passwordData.matchHash;
    });

    return taskSuccess();
  } else if (walletUser.passwordMatchHash === passwordData.matchHash) {
    return taskSuccess();
  }

  return taskFail("incorrect_password");
}

/*export interface IOChangeWalletPassword {
  prevPassword: string;
  nextPassword: string;
}

async function changeWalletPassword({
  prevPassword,
  nextPassword,
}: IOChangeWalletPassword): TStateTaskOutputPromise<ECommonStateTaskErrorEndTags.incorrect_password> {
  const { walletUser } = AppStore.getRawState();

  const passwordData =
    await MeteorEncryptionUtils.getNewPasswordDataFromPassword(
      prevPassword,
      walletUser.userSalt,
    );

  if (walletUser.passwordMatchHash !== passwordData.matchHash) {
    return taskFail("incorrect_password");
  }

  const { newWalletUser, newSignedInWalletUser } =
    await account_data_transformers.changeWalletUserEncryption({
      walletUser,
      prevPassword,
      nextPassword,
    });

  AppStore.update((s) => {
    s.walletUser = newWalletUser;
    s.signedInWalletUser = newSignedInWalletUser;
  });

  return taskSuccess();
}*/

interface IOSignIn {
  paddedPasswordHash: string;
}

async function signInWalletUser({
  paddedPasswordHash,
}: IOSignIn): TStateTaskOutputPromise<ECommonStateTaskErrorEndTags.incorrect_password> {
  const { walletUser } = AppStore.getRawState();

  const passwordData = await MeteorEncryptionUtils.getNewPasswordDataFromPaddedHash(
    paddedPasswordHash,
    walletUser.userSalt,
  );

  if (passwordData.matchHash !== walletUser.passwordMatchHash) {
    return taskFail(ECommonStateTaskErrorEndTags.incorrect_password);
  }

  const signedInWalletUser = await account_data_transformers.convertWalletUserToSignedInWalletUser({
    walletUser,
    paddedPasswordHash: passwordData.paddedPasswordHash,
  });

  AppStore.update((s) => {
    s.signedInWalletUser = signedInWalletUser;
  });

  return taskSuccess();
}

function signOutWalletUser(): TStateTaskOutput {
  AppStore.update((s) => {
    s.signedInWalletUser = undefined;
  });

  return taskSuccess();
}

interface IOAddNewWalletAccount_Input {
  accountId: string;
  network: ENearNetwork;
  keyData: TAccountKeyItem_NewKey[];
  paddedPasswordHash: string;
}

async function addNewWalletAccount({
  accountId,
  keyData,
  network,
  paddedPasswordHash,
}: IOAddNewWalletAccount_Input): TStateTaskOutputPromise<
  | ECommonStateTaskErrorEndTags.malformed_account_id
  | ECommonStateTaskErrorEndTags.incorrect_password
  | "no_key_data"
> {
  if (keyData.length === 0) {
    return taskFail("no_key_data");
  }

  const { walletUser } = AppStore.getRawState();

  const idData = MeteorAppUtils.checkAccountId(accountId);

  if (!idData.good) {
    return taskFail(ECommonStateTaskErrorEndTags.malformed_account_id);
  }

  const passwordData = await MeteorEncryptionUtils.getNewPasswordDataFromPaddedHash(
    paddedPasswordHash,
    walletUser.userSalt,
  );

  if (walletUser.passwordMatchHash !== passwordData.matchHash) {
    return taskFail(ECommonStateTaskErrorEndTags.incorrect_password);
  }

  const nextAccountNum = walletUser.currentAccountNum + 1;

  if (!keyData.some((keyItem) => keyItem.isPrimary)) {
    keyData[0].isPrimary = true;
  }

  const encryptedKeyData = await Promise.all(
    keyData.map(async (keyItem) =>
      account_data_transformers.createNewAccountKeyItem(keyItem, passwordData.cipherHash),
    ),
  );

  const newAccount: IAccount_New = {
    id: accountId,
    namedPart: idData.namedPart,
    fundingStatus: EAccountFundingStatus.UNFUNDED,
    network,
    keyData: encryptedKeyData.map((item) => item.keyItem),
    type: idData.type,
    num: nextAccountNum,
    dateAdded: new Date(),
  };

  const newSignedInAccount: ISignedInSessionAccount_New = {
    ...newAccount,
    signedInKeyData: encryptedKeyData.find((item) => item.keyItem.isPrimary)!.signedInKeyItem,
  };

  AppStore.update((s, o) => {
    s.walletUser.accounts = [...o.walletUser.accounts, newAccount];

    if (o.signedInWalletUser != null) {
      s.signedInWalletUser!.signedInAccounts = [
        ...o.signedInWalletUser.signedInAccounts,
        newSignedInAccount,
      ];
    }

    s.walletUser.currentAccountNum = nextAccountNum;
  });

  return taskSuccess();
}

function removeWalletAccount(accountId: string): TStateTaskOutput {
  const { walletUser } = AppStore.getRawState();
  const newAccounts = walletUser.accounts.filter((account) => account.id !== accountId);

  AppStore.update((s, o) => {
    s.walletUser.accounts = newAccounts;

    if (o.signedInWalletUser != null) {
      s.signedInWalletUser!.signedInAccounts = o.signedInWalletUser.signedInAccounts.filter(
        (account) => account.id !== accountId,
      );
    }

    if (accountId === o.walletUser.selectedAccountId) {
      const newId = newAccounts[0]?.id;
      s.walletUser.selectedAccountId = newId;

      if (o.signedInWalletUser != null) {
        s.signedInWalletUser!.selectedAccount = o.signedInWalletUser.signedInAccounts.find(
          (acc) => acc.id === newId,
        );
      }
    }
  });

  return taskSuccess();
}

interface IOChangeAccountPrimaryKey_Input {
  accountId: string;
  publicKey: string;
  keyType: EAccountKeyType;
  paddedPasswordHash: string;
}

async function changeAccountPrimaryKey({
  accountId,
  publicKey,
  keyType,
  paddedPasswordHash,
}: IOChangeAccountPrimaryKey_Input): TStateTaskOutputPromise<
  | ECommonStateTaskErrorEndTags.account_not_found
  | ECommonStateTaskErrorEndTags.account_key_unknown_to_meteor
> {
  const { walletUser } = AppStore.getRawState();

  const account = walletUser.accounts.find((account) => account.id === accountId);

  if (account == null) {
    return taskFail(ECommonStateTaskErrorEndTags.account_not_found);
  }

  const matchKeyFunc = (key: TAccountKeyItem) =>
    key.publicKey === publicKey && key.keyType === keyType;

  let newPrimaryKey = account.keyData.find(matchKeyFunc);

  if (newPrimaryKey == null) {
    return taskFail(ECommonStateTaskErrorEndTags.account_key_unknown_to_meteor);
  }

  newPrimaryKey = {
    ...newPrimaryKey,
    isPrimary: true,
  };

  const newKeyData: TAccountKeyItem[] = [
    // Make new primary key first in array
    newPrimaryKey,
    ...account.keyData
      // Make all old keys non-primary
      .map((key) => {
        return {
          ...key,
          isPrimary: false,
        };
      })
      // Remove the new primary key from the old keys array
      .filter((key) => !matchKeyFunc(key)),
  ];

  const passwordData = await MeteorEncryptionUtils.getNewPasswordDataFromPaddedHash(
    paddedPasswordHash,
    walletUser.userSalt,
  );

  const newSignedInKey = await account_data_transformers.decryptAccountKeyItem(
    newPrimaryKey,
    passwordData.cipherHash,
  );

  AppStore.update((s, o) => {
    s.walletUser.accounts = o.walletUser.accounts.map((account) => {
      if (account.id === accountId) {
        return {
          ...account,
          keyData: newKeyData,
        };
      }

      return account;
    });

    if (o.signedInWalletUser != null) {
      s.signedInWalletUser!.signedInAccounts = o.signedInWalletUser!.signedInAccounts?.map(
        (account) => {
          if (account.id === accountId) {
            return {
              ...account,
              signedInKeyData: newSignedInKey,
            };
          }

          return account;
        },
      );

      if (o.signedInWalletUser?.selectedAccount?.id === accountId) {
        s.signedInWalletUser!.selectedAccount = {
          ...o.signedInWalletUser.selectedAccount,
          signedInKeyData: newSignedInKey,
        };
      }
    }
  });

  return taskSuccess();
}

interface IOAddNewKeyToWalletAccount {
  accountId: string;
  paddedPasswordHash: string;
  keyData: TAccountKeyItem_NewKey;
}

async function addNewKeyToWalletAccount({
  accountId,
  keyData,
  paddedPasswordHash,
}: IOAddNewKeyToWalletAccount): TStateTaskOutputPromise<
  ECommonStateTaskErrorEndTags.account_not_found | ECommonStateTaskErrorEndTags.unknown_error
> {
  const { walletUser } = AppStore.getRawState();

  const account = walletUser.accounts.find((account) => account.id === accountId);

  if (account == null) {
    return taskFail(ECommonStateTaskErrorEndTags.account_not_found);
  }

  const passwordData = await MeteorEncryptionUtils.getNewPasswordDataFromPaddedHash(
    paddedPasswordHash,
    walletUser.userSalt,
  );

  const newKey = await account_data_transformers.createNewAccountKeyItem(
    keyData,
    passwordData.cipherHash,
  );

  const keyExists = account.keyData.find(
    (key) => key.keyType === keyData.keyType && key.publicKey === keyData.publicKey,
  );

  // If key already exists, do nothing (use same previous keys)
  const newAccountKeyData: TAccountKeyItem[] = keyExists
    ? account.keyData
    : [...account.keyData, newKey.keyItem];

  AppStore.update((s, o) => {
    s.walletUser.accounts = o.walletUser.accounts.map((account) => {
      if (account.id === accountId) {
        return {
          ...account,
          keyData: newAccountKeyData,
        };
      }

      return account;
    });
  });

  if (keyData.isPrimary) {
    const response = await changeAccountPrimaryKey({
      accountId,
      paddedPasswordHash,
      keyType: keyData.keyType,
      publicKey: keyData.publicKey,
    });

    if (!response.success) {
      return response;
    }
  }

  return taskSuccess();
}

export interface IOPushAccountToRecent_Input {
  network: ENearNetwork;
  accountId: string;
  type: "ft" | "nft";
  contractName: string;
  symbol?: string;
  amount?: string;
  decimals?: number;
  tokenId?: string;
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
    const newRecentAddresses: IProfileAddressRecent[] =
      o.walletUser.addresses?.recentlyUsed.filter(
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

    s.walletUser.addresses = {
      ...o.walletUser.addresses,
      recentlyUsed: newRecentAddresses,
    };
  });

  return taskSuccess();
}

function updateAccountFundingStatus({
  newStatus,
  accountId,
}: IOUpdateAccountFundingState_Input): TStateTaskOutput {
  AppStore.update((s, o) => {
    s.walletUser.accounts = o.walletUser.accounts.map((acc) => {
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

function changeSelectedAccount({
  accountId,
}: IWithAccountId): TStateTaskOutput<ECommonStateTaskErrorEndTags.account_not_found> {
  const { walletUser } = AppStore.getRawState();

  if (!walletUser.accounts.some((acc) => acc.id === accountId)) {
    return taskFail(ECommonStateTaskErrorEndTags.account_not_found);
  }

  AppStore.update((s) => {
    s.walletUser.selectedAccountId = accountId;
  });

  return taskSuccess();
}

interface IOUpdateAccountKeyLabelNew_Input {
  accountId: string;
  newLabel?: string;
  publicKey: string;
  keyType: EAccountKeyType;
}

function updateKeyLabel({
  newLabel,
  accountId,
  publicKey,
  keyType,
}: IOUpdateAccountKeyLabelNew_Input): TStateTaskOutput {
  const updateKeyLabelForMatch = <T extends TAccountKeyItem>(keyItem: T): T => {
    if (keyItem.keyType === keyType && keyItem.publicKey === publicKey) {
      return {
        ...keyItem,
        label: newLabel,
      };
    }
    return keyItem;
  };

  const updateAccountForMatch = <T extends IAccount_New>(acc: T): T => {
    if (acc.id === accountId) {
      return {
        ...acc,
        keyData: acc.keyData.map(updateKeyLabelForMatch),
      };
    }

    return acc;
  };

  AppStore.update((s, o) => {
    s.walletUser.accounts = o.walletUser.accounts.map(updateAccountForMatch);

    if (o.signedInWalletUser != null) {
      s.signedInWalletUser!.signedInAccounts.map(updateAccountForMatch);

      if (o.signedInWalletUser.selectedAccount?.id === accountId) {
        s.signedInWalletUser!.selectedAccount!.keyData =
          o.signedInWalletUser.selectedAccount.keyData.map(updateKeyLabelForMatch);
      }
    }
  });

  return taskSuccess();
}

export const wallet_user_state_tasks = {
  signInWalletUser,
  signOutWalletUser,
  addNewWalletAccount,
  removeWalletAccount,
  ensureCurrentWalletUserSetup,
  // changeWalletPassword,
  pushAccountToRecent,
  updateAccountFundingStatus,
  addNewKeyToWalletAccount,
  changeAccountPrimaryKey,
  changeSelectedAccount,
  updateKeyLabel,
};
