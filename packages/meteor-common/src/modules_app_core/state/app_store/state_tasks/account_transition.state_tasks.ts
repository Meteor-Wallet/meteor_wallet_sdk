import { IWithAccountId } from "../../../../modules_external/near/types/near_input_helper_types";
import { account_data_transformers } from "../../../../modules_feature/accounts/account_data_transformers";
import {
  EAccountKeyType,
  IAccount_Base,
  IAccount_Old,
  TAccountKeyItem_NewKey,
} from "../../../../modules_feature/accounts/account_types";
import { MeteorEncryptionUtils } from "../../../../modules_utility/cryptography/MeteorEncryptionUtils";
import { notNullEmpty, nullEmpty } from "../../../../modules_utility/data_type_utils/StringUtils";
import { memory_state } from "../../memory_state";
import { ECommonStateTaskErrorEndTags } from "../../utils/state_tasks.enums";
import {
  IStateTaskOutput_Failure,
  TStateTaskOutput,
  TStateTaskOutputPromise,
} from "../../utils/state_tasks.types";
import {
  handleLogging_stateTask,
  handleSettledPromiseResultLogging_stateTask,
  taskErrorCatcherSync,
  taskFail,
  taskSuccess,
} from "../../utils/state_tasks.utils";
import { AppStore } from "../AppStore";
import { EWalletEncryptionType } from "../AppStore_types";
import {
  IOAddNewKeyDataToWalletAccount_Old,
  IOAddNewWalletAccount_Old,
  IOAddVerifyHostToAccount_Input,
  IOChangeAccountPrimaryKey_Input_Old,
  IODeleteWalletAccount,
  IOSetAccountKeyBackedUp_Input_Old,
  IOSetHardwareBackendPrivateKey_Input,
  IOUpdateAccountFundingState_Input,
  old_account_state_tasks,
} from "./old_account.state_tasks";
import {
  IOEnsureCurrentWalletUserSetup_Input,
  IOPushAccountToRecent_Input,
  wallet_user_state_tasks,
} from "./wallet_user.state_tasks";

function overridePasswordInputValueIfInsecure<I>(inputs: I): I & { password: string } {
  const { walletEncryption } = AppStore.getRawState();
  if (notNullEmpty(memory_state.enteredPassword)) {
    inputs["password"] = memory_state.enteredPassword;
  }

  if (walletEncryption.type === EWalletEncryptionType.insecure_key) {
    inputs["password"] = walletEncryption.insecureKey;
  }

  return inputs as I & { password: string };
}

async function runBothTasksAndReturn<T extends string = string, P = undefined>(
  oldTaskRun: () => Promise<TStateTaskOutput<T, P>>,
  newTaskRun: () => Promise<TStateTaskOutput<T, P>>,
  contextName: string,
): TStateTaskOutputPromise<T, P> {
  const [oldResult, newResult] = await Promise.allSettled([oldTaskRun(), newTaskRun()]);

  handleSettledPromiseResultLogging_stateTask(oldResult, contextName);
  handleSettledPromiseResultLogging_stateTask(newResult, contextName);

  // Initially return the old account results
  if (oldResult.status === "fulfilled") {
    return oldResult.value;
  } else {
    return taskFail(ECommonStateTaskErrorEndTags.unknown_error) as IStateTaskOutput_Failure<T>;
  }
}

async function ensureCurrentWalletUserSetup(
  inputs: IOEnsureCurrentWalletUserSetup_Input,
): TStateTaskOutputPromise<
  ECommonStateTaskErrorEndTags.incorrect_password | ECommonStateTaskErrorEndTags.unknown_error
> {
  overridePasswordInputValueIfInsecure(inputs);
  console.log("Ensuring user set up", inputs);

  if (nullEmpty(inputs.password)) {
    return taskFail(ECommonStateTaskErrorEndTags.incorrect_password);
  }

  return runBothTasksAndReturn(
    () => old_account_state_tasks.ensureUserProfileSetup(inputs),
    () => wallet_user_state_tasks.ensureCurrentWalletUserSetup(inputs),
    "Ensure current wallet is setup",
  );
}
/*
async function changeWalletPassword(
  inputs: IOChangeWalletPassword & {
    profileId: string;
  },
): TStateTaskOutputPromise<ECommonStateTaskErrorEndTags.incorrect_password> {
  const response = await runBothTasksAndReturn(
    () =>
      old_account_state_tasks.changeWalletPassword({
        oldPassword: inputs.prevPassword,
        newPassword: inputs.nextPassword,
        profileId: inputs.profileId,
      }),
    () =>
      wallet_user_state_tasks.changeWalletPassword({
        prevPassword: inputs.prevPassword,
        nextPassword: inputs.nextPassword,
      }),
    "Change wallet password",
  );

  if (response.success) {
    AppStore.update((s) => {
      s.walletEncryption = {
        type: EWalletEncryptionType.set_password,
      };
    });

    memory_state.enteredPassword = inputs.nextPassword;
  }

  return response;
}*/

interface IOSignIn_Inputs_Transitional {
  profileId: string;
  password: string;
  accountIds?: string[];
  overwriteCurrentSessionAccounts?: boolean;
}

async function convertFromOldAndSignInNewWalletUser({
  password,
}: IOSignIn_Inputs_Transitional): TStateTaskOutputPromise<ECommonStateTaskErrorEndTags.incorrect_password> {
  const { allAccounts, currentProfile, selectedAccountId } = AppStore.getRawState();

  const oldPasswordMatchHash = await MeteorEncryptionUtils.getOldPasswordMatchHash(password);

  if (currentProfile.passwordMatchHash !== oldPasswordMatchHash) {
    return taskFail(ECommonStateTaskErrorEndTags.incorrect_password);
  }

  const newUser = await account_data_transformers.convertFromOldProfileToNewWalletUser({
    accounts: allAccounts,
    profile: currentProfile,
    selectedAccountId,
    password,
  });

  const passwordData = await MeteorEncryptionUtils.getNewPasswordDataFromPassword(
    password,
    newUser.userSalt,
  );

  const signedInUser = await account_data_transformers.convertWalletUserToSignedInWalletUser({
    walletUser: newUser,
    paddedPasswordHash: passwordData.paddedPasswordHash,
  });

  AppStore.update((s) => {
    s.walletUser = newUser;
    s.signedInWalletUser = signedInUser;
  });

  return taskSuccess();
}

async function signInWalletUser(
  inputs: IOSignIn_Inputs_Transitional,
): TStateTaskOutputPromise<
  ECommonStateTaskErrorEndTags.incorrect_password | ECommonStateTaskErrorEndTags.unknown_error
> {
  const [oldResult] = await Promise.allSettled([old_account_state_tasks.signIn(inputs)]);

  handleSettledPromiseResultLogging_stateTask(oldResult);

  if (oldResult.status === "rejected") {
    return taskFail(ECommonStateTaskErrorEndTags.unknown_error);
  }

  if (!oldResult.value.success) {
    return oldResult.value;
  }

  let newResult: PromiseSettledResult<TStateTaskOutput>;

  const paddedPasswordHash = await MeteorEncryptionUtils.createPaddedPasswordHash(inputs.password);

  // Wallet User has never been setup before- we need to transform the old accounts
  // to the new structures
  if (AppStore.getRawState().walletUser.passwordMatchHash == null) {
    newResult = (await Promise.allSettled([convertFromOldAndSignInNewWalletUser(inputs)]))[0];
  } else {
    newResult = (
      await Promise.allSettled([wallet_user_state_tasks.signInWalletUser({ paddedPasswordHash })])
    )[0];
  }

  handleSettledPromiseResultLogging_stateTask(newResult);

  // Make sure that we save the new password hash to the local storage as well
  if (newResult.status === "fulfilled" && newResult.value.success) {
    const oldPasswordData = await MeteorEncryptionUtils.getOldPasswordHashes(inputs.password);

    memory_state.enteredPassword = inputs.password;

    AppStore.update((s) => {
      s.localStorageSessionState = {
        state: {
          passwordEncryptKeyHash: oldPasswordData.cipherHash,
          passwordMatchHash: oldPasswordData.matchHash,
          signedInProfileId: inputs.profileId,
        },
        newState: {
          paddedPasswordHash,
        },
        lastTouched: Date.now(),
      };
    });
  }

  if (oldResult.status === "fulfilled") {
    return oldResult.value;
  } else {
    return taskFail(ECommonStateTaskErrorEndTags.unknown_error);
  }
}

function signOutWalletUser() {
  const walletEncryption = AppStore.getRawState().walletEncryption;

  if (walletEncryption.type === EWalletEncryptionType.set_password) {
    old_account_state_tasks.signOut();
    wallet_user_state_tasks.signOutWalletUser();
  }
}

function deleteWalletAccount(inputs: IODeleteWalletAccount): TStateTaskOutput {
  const oldResult = old_account_state_tasks.deleteWalletAccount(inputs);
  const newResult = wallet_user_state_tasks.removeWalletAccount(inputs.accountId);

  handleLogging_stateTask(oldResult);
  handleLogging_stateTask(newResult);

  return oldResult;
}

async function addWalletAccount(
  inputs: IOAddNewWalletAccount_Old,
): TStateTaskOutputPromise<
  | ECommonStateTaskErrorEndTags.unknown_error
  | ECommonStateTaskErrorEndTags.malformed_account_id
  | ECommonStateTaskErrorEndTags.incorrect_password
  | "no_key_data",
  IAccount_Old
> {
  overridePasswordInputValueIfInsecure(inputs);

  console.log("adding new wallet account", inputs);

  if (!inputs.skipWalletSetupCheck) {
    const result = await ensureCurrentWalletUserSetup({
      password: inputs.password,
    });

    if (!result.success) {
      return result;
    }
  }

  const { walletUser } = AppStore.getRawState();

  const passwordData = await MeteorEncryptionUtils.getNewPasswordDataFromPassword(
    inputs.password,
    walletUser.userSalt,
  );

  const keyData: TAccountKeyItem_NewKey =
    inputs.key.keyType === EAccountKeyType.LOCAL_PRIVATE_KEY
      ? {
          keyType: EAccountKeyType.LOCAL_PRIVATE_KEY,
          publicKey: inputs.key.publicKey,
          isPrimary: true,
          sensitive: {
            privateKey: inputs.key.privateKey,
            recovery: inputs.key.recovery,
          },
        }
      : {
          keyType: EAccountKeyType.HARDWARE,
          hardwareType: inputs.key.hardwareType,
          publicKey: inputs.key.publicKey,
          isPrimary: true,
          path: inputs.key.path,
        };

  const [oldResult] = await Promise.allSettled([
    old_account_state_tasks.addNewWalletAccount(inputs),
  ]);
  const [newResult] = await Promise.allSettled([
    wallet_user_state_tasks.addNewWalletAccount({
      accountId: inputs.accountId,
      network: inputs.network,
      paddedPasswordHash: passwordData.paddedPasswordHash,
      keyData: [keyData],
    }),
  ]);

  handleSettledPromiseResultLogging_stateTask(oldResult);
  handleSettledPromiseResultLogging_stateTask(newResult);

  if (oldResult.status === "fulfilled") {
    return oldResult.value;
  } else {
    return taskFail(ECommonStateTaskErrorEndTags.unknown_error);
  }
}

function addVerifyHostToAccount(inputs: IOAddVerifyHostToAccount_Input): TStateTaskOutput {
  const oldResult = old_account_state_tasks.addVerifyHostToAccount(inputs);
  // const newResult = wallet_user_state_tasks.addVerifyHostToAccount(inputs);

  handleLogging_stateTask(oldResult);
  // handleLogging_stateTask(newResult);

  return oldResult;
}

function pushAccountToRecent(inputs: IOPushAccountToRecent_Input): TStateTaskOutput {
  const oldResult = taskErrorCatcherSync(() => old_account_state_tasks.pushAccountToRecent(inputs));
  const newResult = taskErrorCatcherSync(() => wallet_user_state_tasks.pushAccountToRecent(inputs));

  handleLogging_stateTask(oldResult);
  handleLogging_stateTask(newResult);

  return oldResult;
}

function updateAccountFundingStatus(inputs: IOUpdateAccountFundingState_Input): TStateTaskOutput {
  const oldResult = taskErrorCatcherSync(() =>
    old_account_state_tasks.updateAccountFundingStatus(inputs),
  );
  const newResult = taskErrorCatcherSync(() =>
    wallet_user_state_tasks.updateAccountFundingStatus(inputs),
  );

  handleLogging_stateTask(oldResult);
  handleLogging_stateTask(newResult);

  return oldResult;
}

async function addNewKeyToWalletAccount(
  inputs: IOAddNewKeyDataToWalletAccount_Old,
): TStateTaskOutputPromise<
  ECommonStateTaskErrorEndTags.account_not_found | ECommonStateTaskErrorEndTags.unknown_error
> {
  overridePasswordInputValueIfInsecure(inputs);

  return await old_account_state_tasks.addNewKeyToWalletAccount(inputs);

  // We don't use the new account stuff at all, so ignore it

  /*return runBothTasksAndReturn(
    () => old_account_state_tasks.addNewKeyToWalletAccount(inputs),
    async () => {
      const { walletUser } = AppStore.getRawState();
      const passwordData =
        await MeteorEncryptionUtils.getNewPasswordDataFromPassword(
          inputs.password,
          walletUser.userSalt,
        );

      return wallet_user_state_tasks.addNewKeyToWalletAccount({
        accountId: inputs.accountId,
        keyData: {
          publicKey: inputs.publicKey,
          keyType: EAccountKeyType.LOCAL_PRIVATE_KEY,
          isPrimary: false,
          sensitive: {
            privateKey: inputs.privateKey,
            // phrase: inputs.phrase,
            recovery: inputs.recovery,
          },
        },
        paddedPasswordHash: passwordData.paddedPasswordHash,
      });
    },
    "Add New Key To Wallet Account",
  );*/
}

async function setHardwareBackendPrivateKey(
  inputs: Omit<IOSetHardwareBackendPrivateKey_Input, "password">,
): TStateTaskOutputPromise<
  | ECommonStateTaskErrorEndTags.account_not_found
  | ECommonStateTaskErrorEndTags.unknown_error
  | ECommonStateTaskErrorEndTags.account_key_doesnt_match_public_key
> {
  const inputsWithPassword = overridePasswordInputValueIfInsecure(inputs);
  return old_account_state_tasks.setHardwareBackendPrivateKey(inputsWithPassword);
}

async function setKeyToBackedUp(
  inputs: Omit<IOSetAccountKeyBackedUp_Input_Old, "password">,
): TStateTaskOutputPromise<
  | ECommonStateTaskErrorEndTags.account_not_found
  | ECommonStateTaskErrorEndTags.unknown_error
  | ECommonStateTaskErrorEndTags.account_key_is_not_seed_phrase
  | ECommonStateTaskErrorEndTags.account_key_doesnt_match_public_key
> {
  const inputsWithPassword = overridePasswordInputValueIfInsecure(inputs);
  return old_account_state_tasks.setAccountKeyBackedUp(inputsWithPassword);
}

async function changeAccountPrimaryKey(
  inputs: IOChangeAccountPrimaryKey_Input_Old,
): TStateTaskOutputPromise<
  | ECommonStateTaskErrorEndTags.account_not_found
  | ECommonStateTaskErrorEndTags.account_key_unknown_to_meteor
  | ECommonStateTaskErrorEndTags.unknown_error
> {
  overridePasswordInputValueIfInsecure(inputs);

  return runBothTasksAndReturn(
    () => old_account_state_tasks.changeAccountPrimaryKey(inputs),
    async () => {
      const { walletUser } = AppStore.getRawState();
      const passwordData = await MeteorEncryptionUtils.getNewPasswordDataFromPassword(
        inputs.password,
        walletUser.userSalt,
      );

      return wallet_user_state_tasks.changeAccountPrimaryKey({
        accountId: inputs.accountId,
        publicKey: inputs.publicKey,
        keyType: EAccountKeyType.LOCAL_PRIVATE_KEY,
        paddedPasswordHash: passwordData.paddedPasswordHash,
      });
    },
    "Change Account Primary Key",
  );
}

function changeSelectedAccount({
  accountId,
}: IWithAccountId): TStateTaskOutput<ECommonStateTaskErrorEndTags.account_not_found> {
  AppStore.update((s) => {
    s.selectedAccountId = accountId;
  });

  return wallet_user_state_tasks.changeSelectedAccount({ accountId });
}

export interface IOUpdateAccountLabel_Inputs {
  accountId: string;
  label?: string;
}

function updateAccountLabel({ accountId, label }: IOUpdateAccountLabel_Inputs) {
  const updateAccountLabelOnMatchId = <T extends IAccount_Base>(acc: T): T => {
    if (acc.id === accountId) {
      return {
        ...acc,
        label,
      };
    }

    return acc;
  };

  AppStore.update((s, o) => {
    s.allAccounts = o.allAccounts.map(updateAccountLabelOnMatchId);
    s.walletUser.accounts = o.walletUser.accounts.map(updateAccountLabelOnMatchId);

    if (o.signedInWalletUser != null) {
      s.signedInWalletUser!.signedInAccounts = o.signedInWalletUser.signedInAccounts.map(
        updateAccountLabelOnMatchId,
      );

      if (o.signedInWalletUser.selectedAccount?.id === accountId) {
        s.signedInWalletUser!.selectedAccount!.label = label;
      }
    }
  });
}

interface IOUpdateAccountKeyLabel_Input {
  accountId: string;
  newLabel: string;
  publicKey: string;
}

function updateKeyLabel(inputs: IOUpdateAccountKeyLabel_Input): TStateTaskOutput {
  const oldResult = taskErrorCatcherSync(() => old_account_state_tasks.updateKeyLabel(inputs));
  const newResult = taskErrorCatcherSync(() =>
    wallet_user_state_tasks.updateKeyLabel({
      ...inputs,
      keyType: EAccountKeyType.LOCAL_PRIVATE_KEY,
    }),
  );

  handleLogging_stateTask(oldResult);
  handleLogging_stateTask(newResult);

  return oldResult;
}

export const account_transition_state_tasks = {
  ensureCurrentWalletUserSetup,
  // changeWalletPassword,
  setHardwareBackendPrivateKey,
  signInWalletUser,
  signOutWalletUser,
  deleteWalletAccount,
  addWalletAccount,
  addVerifyHostToAccount,
  pushAccountToRecent,
  updateAccountFundingStatus,
  addNewKeyToWalletAccount,
  changeAccountPrimaryKey,
  updateAccountLabel,
  updateKeyLabel,
  setKeyToBackedUp,
};
