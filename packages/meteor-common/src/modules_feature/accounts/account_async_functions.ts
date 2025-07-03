import { Transaction, actionCreators } from "@near-js/transactions";
import type { AccessKeyView, FinalExecutionOutcome } from "@near-js/types";
import type { Transaction as WalletSelectorTransaction } from "@near-wallet-selector/core";
import Big from "big.js";
import { canonicalize } from "json-canonicalize";
import { providers, transactions, utils } from "near-api-js";
import { GoogleRecaptcha_HttpClient } from "../../modules_external/google_recaptcha/GoogleRecaptcha_HttpClient";
import { getNearApi } from "../../modules_external/near/clients/near_api_js/NearApiJsClient";
import { getNearRpcClient } from "../../modules_external/near/clients/near_rpc/NearRpcClient";
import { NEAR_MIN_BALANCE_FOR_GAS_REGULAR_HUMAN_NUM } from "../../modules_external/near/near_constants";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import {
  IWithAccountIdAndNetwork,
  IWithContractId,
  IWithGas,
} from "../../modules_external/near/types/near_input_helper_types";
import {
  IONearRpc_Query_ViewAccessKeyList_Output,
  IONearRpc_Query_ViewAccessKey_Output,
} from "../../modules_external/near/types/near_rpc_types";
import {
  INep0413_PayloadToSign,
  INep0413_SignedMessage,
} from "../../modules_external/near/types/standards/wallet_standard_types";
import { fromYoctoNear } from "../../modules_external/near/utils/near_formatting_utils";
import { convertStorageToNearCost } from "../../modules_external/near/utils/near_storage_utils";
import { near_wallet_utils } from "../../modules_external/near/utils/near_wallet_utils";
import { MeteorActionError } from "../../modules_utility/api_utilities/async_action_utils";
import { nullEmpty } from "../../modules_utility/data_type_utils/StringUtils";
import { EOldMeteorErrorId } from "../../modules_utility/old_errors/old_error_ids";
import { getAccountIdsByPublicKeyFromAllIndexers } from "../core_indexer/core_indexer_async_actions";
import { EFeatureEnrollmentRecord_ConsentStatus } from "../missions/feature_enrollment_records/feature_enrollment_records.enum";
import { getMeteorPointsContractId } from "../missions/mission.utils";
import { meteor_mission_async_function } from "../missions/mission_async_functions";
import { transaction_async_functions } from "../transactions/transaction_async_functions";
import { transaction_utils } from "../transactions/transaction_utils";
import { IAccountSignedRequestInputs, ISignedInSessionAccount_Old } from "./account_types";
import { NearAccountSignerExecutor } from "./near_signer_executor/NearAccountSignerExecutor";
import { TTransactionSimpleNoSigner } from "./near_signer_executor/NearAccountSignerExecutor.types";

const TypedError = providers.TypedError;

/*******************************/
//
// 				Main Export
//
/*******************************/

export const account_async_functions = {
  getStorageBalance: getStorageBalance,
  getAccessKey,
  getAccessKeys,
  revokeFunctionCallAccessKey,
  addFunctionCallAccessKey,
  revokeAccessKey: revokeFunctionCallAccessKey,
  addFullAccessKeyToAccount,
  hydrateSignAndSendTransactionsWithAccount,
  getAccountState,
  checkAndDepositStorage,
  getAvailableNearBalance,
  signMessage,
  signRequestInputs,
  findAccountsWithPublicKey,
  verifyCaptcha,
  acceptEnrollmentStatus,
  rejectEnrollmentStatus,
};

/*******************************/
//
// 					Functions
//
/*******************************/
async function revokeFunctionCallAccessKey({ accountId, network, publicKey }): Promise<boolean> {
  const accessKey = await getAccessKey({ accountId, network, publicKey });
  if (accessKey?.permission === "FullAccess") {
    console.log("FullAccess key cannot be revoked with this method");
    return false;
  }

  try {
    const [res] = await NearAccountSignerExecutor.getInstance(
      accountId,
      network,
    ).startTransactionsAwait([
      {
        asDelegated: true,
        receiverId: accountId,
        actions: [actionCreators.deleteKey(utils.PublicKey.from(publicKey))],
      },
    ]);

    return true;
  } catch (e) {
    console.log(`Something went wrong during revoking access key:\n ${JSON.stringify(e)}`);
    return false;
  }
}

async function addFunctionCallAccessKey({
  accountId,
  network,
  contractId,
  publicKey,
  methods,
  allowance,
}: IWithAccountIdAndNetwork & {
  contractId: string;
  publicKey: string;
  methods: string[];
  allowance?: bigint;
}): Promise<IONearRpc_Query_ViewAccessKey_Output | null> {
  try {
    await NearAccountSignerExecutor.getInstance(accountId, network).startTransactionsAwait([
      {
        receiverId: accountId,
        actions: [
          actionCreators.addKey(
            utils.PublicKey.from(publicKey),
            actionCreators.functionCallAccessKey(contractId, methods, allowance),
          ),
        ],
      } satisfies TTransactionSimpleNoSigner,
    ]);

    return await getAccessKey({ accountId, network, publicKey });
  } catch (e) {
    console.error(e);
    throw e;
  }
}

async function getAccessKey({
  accountId,
  network,
  publicKey,
}: IWithAccountIdAndNetwork & {
  publicKey: string;
}): Promise<IONearRpc_Query_ViewAccessKey_Output | null> {
  try {
    const accessKey = await getNearRpcClient(network).view_access_key({
      account_id: accountId,
      public_key: publicKey,
    });
    return accessKey;
  } catch (e) {
    return null;
  }
}

async function getAccessKeys({
  accountId,
  network,
}: IWithAccountIdAndNetwork): Promise<IONearRpc_Query_ViewAccessKeyList_Output | null> {
  try {
    const accessKeys = await getNearRpcClient(network).view_access_key_list({
      account_id: accountId,
    });
    return accessKeys;
  } catch (e) {
    return null;
  }
}

export interface IOSetEnrollmentStatus_Input {
  account: ISignedInSessionAccount_Old;
  enrollmentPublicKey?: string;
}

async function acceptEnrollmentStatus({
  account,
  enrollmentPublicKey,
}: IOSetEnrollmentStatus_Input) {
  const accountId = account.id;
  const networkId = account.network;
  console.log(
    "Setting quest status for account",
    accountId,
    EFeatureEnrollmentRecord_ConsentStatus.accepted,
    enrollmentPublicKey,
  );

  if (nullEmpty(enrollmentPublicKey)) {
    throw new Error("Enrollment public key is empty- can't accept");
  }

  try {
    const [res] = await NearAccountSignerExecutor.getInstance(
      account.id,
      account.network,
    ).startTransactionsAwait([
      {
        asDelegated: true,
        receiverId: accountId,
        actions: [
          actionCreators.addKey(
            utils.PublicKey.from(enrollmentPublicKey),
            actionCreators.functionCallAccessKey(getMeteorPointsContractId(account.network), []),
          ),
        ],
      },
    ]);

    await meteor_mission_async_function.setMeteorMissionFeatureEnrollment({
      data: {
        public_key: enrollmentPublicKey,
        consent_status: EFeatureEnrollmentRecord_ConsentStatus.accepted,
      },
      network: account.network,
      wallet_id: account.id,
    });
  } catch (error) {
    console.error(error);
    console.log({ ...(error as any) });

    if (error instanceof TypedError && error.type === "NotEnoughBalance") {
      throw new MeteorActionError([
        EOldMeteorErrorId.merr_enrollment_failed,
        EOldMeteorErrorId.merr_enrollment_failed_no_gas,
      ]);
    }

    try {
      const keyCheck = await getNearRpcClient(networkId).view_access_key({
        account_id: accountId,
        public_key: enrollmentPublicKey,
      });

      await meteor_mission_async_function.setMeteorMissionFeatureEnrollment({
        data: {
          public_key: enrollmentPublicKey,
          consent_status: EFeatureEnrollmentRecord_ConsentStatus.accepted,
        },
        network: account.network,
        wallet_id: account.id,
      });
    } catch (error) {
      throw new MeteorActionError([EOldMeteorErrorId.merr_enrollment_failed]);
    }
  }
}

async function rejectEnrollmentStatus({
  account,
  enrollmentPublicKey,
}: IOSetEnrollmentStatus_Input) {
  const accountId = account.id;
  const networkId = account.network;
  console.log(
    "Removing quest enrollment for account",
    accountId,
    EFeatureEnrollmentRecord_ConsentStatus.denied,
    enrollmentPublicKey,
  );

  if (nullEmpty(enrollmentPublicKey)) {
    return;
  }

  try {
    const keyCheck = await getNearRpcClient(networkId).view_access_key({
      account_id: accountId,
      public_key: enrollmentPublicKey,
    });

    try {
      const [res] = await NearAccountSignerExecutor.getInstance(
        accountId,
        networkId,
      ).startTransactionsAwait([
        {
          asDelegated: true,
          receiverId: accountId,
          actions: [actionCreators.deleteKey(utils.PublicKey.from(enrollmentPublicKey))],
        },
      ]);

      await meteor_mission_async_function.setMeteorMissionFeatureEnrollment({
        data: {
          public_key: enrollmentPublicKey,
          consent_status: EFeatureEnrollmentRecord_ConsentStatus.denied,
        },
        network: account.network,
        wallet_id: account.id,
      });
    } catch (error) {
      console.error(error);
      console.log({ ...(error as any) });

      if (error instanceof TypedError && error.type === "NotEnoughBalance") {
        throw new MeteorActionError([
          EOldMeteorErrorId.merr_enrollment_failed,
          EOldMeteorErrorId.merr_enrollment_failed_no_gas,
        ]);
      }

      throw new MeteorActionError([EOldMeteorErrorId.merr_enrollment_failed]);
    }
  } catch (e) {
    await meteor_mission_async_function.setMeteorMissionFeatureEnrollment({
      data: {
        public_key: enrollmentPublicKey,
        consent_status: EFeatureEnrollmentRecord_ConsentStatus.denied,
      },
      network: account.network,
      wallet_id: account.id,
    });
  }
}

export interface IOAddFullAccessKeyToAccount_Input extends IWithAccountIdAndNetwork {
  publicKey: string;
}

async function addFullAccessKeyToAccount(inputs: IOAddFullAccessKeyToAccount_Input): Promise<void> {
  console.log("Executing", inputs);
  const { publicKey, accountId, network } = inputs;

  const response: FinalExecutionOutcome[] = await NearAccountSignerExecutor.getInstance(
    accountId,
    network,
  ).startTransactionsAwait([
    {
      receiverId: accountId,
      actions: [
        actionCreators.addKey(utils.PublicKey.from(publicKey), actionCreators.fullAccessKey()),
      ],
    } satisfies TTransactionSimpleNoSigner,
  ]);
}

export interface IOHydrateSignAndSendTransactionsWithAccount_Input
  extends IWithAccountIdAndNetwork {
  transactions: Transaction[] | WalletSelectorTransaction[];
}

export interface IOHydrateSignAndSendTransactionsWithAccount_Output {
  executionOutcomes: FinalExecutionOutcome[];
}

async function hydrateSignAndSendTransactionsWithAccount({
  accountId,
  transactions: incomingTransactions,
  network,
}: IOHydrateSignAndSendTransactionsWithAccount_Input): Promise<IOHydrateSignAndSendTransactionsWithAccount_Output> {
  const account = await getNearApi(network).nativeApi.account(accountId);

  const { networkId, signer, provider } = account.connection;

  const currentAccessPublicKey = await signer.getPublicKey(account.accountId, networkId);

  const accessKey: AccessKeyView = await provider.query<AccessKeyView>(
    `access_key/${account.accountId}/${currentAccessPublicKey.toString()}`,
    "",
  );

  const transformedTransactions = incomingTransactions.map((transaction, index: number) =>
    transactions.createTransaction(
      account.accountId,
      currentAccessPublicKey,
      transaction.receiverId,
      accessKey.nonce + BigInt(index) + BigInt(1),
      transaction.actions.map((action) => transaction_utils.createAction(action)),
      utils.serialize.base_decode(accessKey.block_hash),
    ),
  );

  return await transaction_async_functions.signAndSendMultipleTransactionsSync({
    transactions: transformedTransactions,
    network,
  });
}

export interface IOGetAccountState_Output {
  amount_usable: string;
  amount: string;
  block_hash: string;
  block_height: number;
  code_hash: string;
  locked: string;
  storage_paid_at: number;
  storage_usage: number;
}

async function getAccountState({
  accountId,
  network,
}: IWithAccountIdAndNetwork): Promise<IOGetAccountState_Output> {
  const accountApi = await getNearApi(network).nativeApi.account(accountId);
  // console.log(await accountApi.state())
  try {
    const accountState = await accountApi.state();

    const amount_usable: string = Big(accountState.amount)
      .minus(convertStorageToNearCost(accountState.storage_usage))
      .toFixed();

    return {
      ...accountState,
      amount_usable,
    };
  } catch (e: unknown) {
    console.error(e);
    if (e instanceof TypedError) {
      if (e.message.includes("does not exist")) {
        throw new MeteorActionError(["AccountDoesNotExist", e.type], e);
      } else {
        throw new MeteorActionError([e.type], e);
      }
    }

    throw new MeteorActionError([], e as any);
  }
}

export async function getStorageBalance({
  contractId,
  accountId,
  network,
}: IWithAccountIdAndNetwork & IWithContractId): Promise<null | {
  total: string;
  available: string;
}> {
  const account = await getNearApi(network).nativeApi.account(accountId);
  return await account.viewFunction({
    contractId,
    args: {
      account_id: accountId,
    },
    methodName: "storage_balance_of",
  });
}

// This function helps to check user's storage deposit and deposit storage fee if necessary
export interface IOCheckAndDepositStorage_Input
  extends IWithAccountIdAndNetwork,
    IWithContractId,
    IWithGas {
  storageDepositAmount: bigint;
}

async function checkAndDepositStorage({
  accountId,
  network,
  contractId,
  storageDepositAmount,
  gasAmount,
}: IOCheckAndDepositStorage_Input) {
  const storageAvailable = await getStorageBalance({
    contractId,
    accountId,
    network,
  });

  if (storageAvailable?.total === undefined) {
    console.log("no deposit, transfer storage deposit");
    await transaction_async_functions.transferStorageDeposit({
      accountId,
      network,
      contractId: contractId,
      gasAmount: gasAmount,
      storageDepositAmount: storageDepositAmount,
    });
  }
}

async function getAvailableNearBalance({
  accountId,
  network,
}: IWithAccountIdAndNetwork): Promise<string> {
  const accountState = await getAccountState({
    network: network,
    accountId: accountId,
  });
  let calculated_max =
    Number.parseFloat(fromYoctoNear(accountState.amount_usable, 8)) -
    NEAR_MIN_BALANCE_FOR_GAS_REGULAR_HUMAN_NUM;

  if (calculated_max < 0) {
    calculated_max = 0;
  }
  return calculated_max.toString();
}

interface IOSignMessage extends IWithAccountIdAndNetwork {
  payload: INep0413_PayloadToSign;
}

async function signMessage({
  accountId,
  network,
  payload,
}: IOSignMessage): Promise<INep0413_SignedMessage> {
  const key = await getNearApi(network).keystore.getKey(network, accountId);

  if (key != null) {
    const signedMessage = near_wallet_utils.nep0413_signMessageWithAccountAndPrivateKey({
      privateKey: key.toString(),
      accountId,
      ...payload,
    });

    console.log("Signed message", signedMessage);

    return signedMessage;
  }

  throw new Error("No key found for account");
}

interface IOSignRequestInputs_Input<T> extends IWithAccountIdAndNetwork {
  inputs: T;
  receiver?: string;
}

async function signRequestInputs<T>(
  inputs: IOSignRequestInputs_Input<T>,
): Promise<IAccountSignedRequestInputs<T>> {
  const key = await getNearApi(inputs.network).keystore.getKey(inputs.network, inputs.accountId);

  if (key == null) {
    throw new Error("No key found for account");
  }

  let nonceBuffer = Buffer.alloc(32);
  nonceBuffer = crypto.getRandomValues(nonceBuffer);

  const receiver = inputs.receiver ?? "meteorwallet.app";

  const inputsString = canonicalize(inputs.inputs);

  const payload: INep0413_PayloadToSign = {
    nonce: nonceBuffer,
    recipient: receiver,
    message: inputsString,
  };

  const signedMessage = near_wallet_utils.nep0413_signMessageWithAccountAndPrivateKey({
    privateKey: key,
    accountId: inputs.accountId,
    ...payload,
  });

  return {
    inputs: inputs.inputs,
    receiver,
    nonce: [...nonceBuffer],
    signed: signedMessage,
    accountId: inputs.accountId,
    network: inputs.network,
  };
}

function throwErrorIfEmpty(ids) {
  if (!ids.length) {
    throw new Error("Fetch findAccountsWithPublicKey empty");
  }
  return ids;
}

async function findAccountsWithPublicKey({
  publicKey,
  network,
}: {
  publicKey: string;
  network: ENearNetwork;
}): Promise<{
  accountIds: string[];
}> {
  let accountIds: string[] = [];

  await getAccountIdsByPublicKeyFromAllIndexers.run({
    publicKey,
    network,
    onResult: (result) => {
      accountIds = result;
    },
  });

  return {
    accountIds,
  };
}

async function verifyCaptcha({ captchaToken }) {
  const googleClient = GoogleRecaptcha_HttpClient.getInstance();
  const verificaitonResult = await googleClient.verifyToken({ captchaToken });

  return verificaitonResult;
}
