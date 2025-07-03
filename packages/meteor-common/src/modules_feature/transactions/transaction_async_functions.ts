import { FinalExecutionOutcome, FinalExecutionStatus } from "@near-js/types";
import { transactions } from "near-api-js";
import {
  IWithAccountIdAndNetwork,
  IWithContractId,
  IWithGas,
  IWithNetwork,
} from "../../modules_external/near/types/near_input_helper_types";
import { StringUtils } from "../../modules_utility/data_type_utils/StringUtils";
import { NearAccountSignerExecutor } from "../accounts/near_signer_executor/NearAccountSignerExecutor";
import { TTransactionSimpleNoSigner } from "../accounts/near_signer_executor/NearAccountSignerExecutor.types";
import { near_action_creators } from "../accounts/transactions/near_action_creators";

interface IOSignAndSendMultipleTransactions_Input extends IWithNetwork {
  transactions: transactions.Transaction[];
}

interface IOSignAndSendMultipleTransactions_Output {
  executionOutcomes: FinalExecutionOutcome[];
}

export const transaction_async_functions = {
  signAndSendMultipleTransactionsSync,
  transferStorageDeposit,
};

async function signAndSendMultipleTransactionsSync({
  transactions: incomingTransactions,
  network,
}: IOSignAndSendMultipleTransactions_Input): Promise<IOSignAndSendMultipleTransactions_Output> {
  let executionOutcomes: FinalExecutionOutcome[] = [];

  const groupedTransactions: {
    [signerId: string]: TTransactionSimpleNoSigner[];
  } = incomingTransactions.reduce((result, transaction) => {
    const { signerId } = transaction;
    if (!result[signerId]) {
      result[signerId] = [];
    }
    result[signerId].push(transaction);
    return result;
  }, {});

  try {
    for (const signerId in groupedTransactions) {
      const transactions = groupedTransactions[signerId];
      const response: FinalExecutionOutcome[] = await NearAccountSignerExecutor.getInstance(
        signerId,
        network,
      ).startTransactionsAwait(transactions);

      for (const [index, transaction] of response.entries()) {
        if (transaction.status["Failure"]?.ActionError?.kind) {
          throw new Error(
            StringUtils.addSpacesBetweenStrings(
              Object.keys(transaction.status["Failure"]?.ActionError.kind)[0],
            ),
          );
        }
        if (transaction.status["Failure"]?.error_message) {
          throw new Error(
            StringUtils.addSpacesBetweenStrings(transaction.status["Failure"]?.error_message),
          );
        }

        // TODO: Shouldn't throw more specific errors on failure?
        if ((transaction.status as FinalExecutionStatus).Failure !== undefined) {
          throw new Error(
            `Transaction failure for transaction hash: ${transaction.transaction.hash}, receiver_id: ${transaction.transaction.receiver_id} .`,
          );
        }

        executionOutcomes.push(transaction);
      }
    }
  } catch (error: any) {
    console.error(`Transactions failed: ${error.message}`, error);
    throw new Error(error?.message ?? null);
  }

  return { executionOutcomes };
}

async function transferStorageDeposit({
  accountId,
  network,
  contractId,
  storageDepositAmount,
  gasAmount,
}: IWithAccountIdAndNetwork &
  IWithContractId &
  IWithGas & {
    storageDepositAmount: bigint;
  }): Promise<FinalExecutionOutcome> {
  const results = await NearAccountSignerExecutor.getInstance(
    accountId,
    network,
  ).startTransactionsAwait([
    {
      receiverId: contractId,
      actions: [
        near_action_creators.functionCall({
          contractId,
          methodName: "storage_deposit",
          args: {
            account_id: accountId,
            registration_only: true,
          },
          attachedDeposit: BigInt(storageDepositAmount),
        }),
      ],
    },
  ]);
  return results[0];
}
