import { NearBlocks } from "../../../modules_external/near_blocks/NearBlocks";
import { TFRSuccessPayload } from "../../../modules_utility/api_utilities/task_function/TaskFunctionResponses";
import { ApiAction_Transaction } from "./ApiAction_Transaction";

ApiAction_Transaction.setValidation(
  // z.object({
  //   network: z.fromEnum(ENearNetwork),
  //   hash: z.string(),
  // }),
);

ApiAction_Transaction.implement(async ({ network, hash }) => {
  const { transactions } = await NearBlocks.async_functions.api1_getTransactionWithActions({
    network,
    hash,
  });
  return TFRSuccessPayload({
    transaction:
      transactions.length > 0
        ? NearBlocks.dataAdapters.transactions.api1_convertTransaction(transactions[0])
        : undefined,
  });
});

export const ApiAction_Transaction_Impl = ApiAction_Transaction;
