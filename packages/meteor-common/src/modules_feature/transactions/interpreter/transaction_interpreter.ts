import { ENearFunctionCallMethod_NftStandard } from "../../../modules_external/near/types/standards/nft_standard_types";
import { ENearIndexer_ActionKind } from "../../../modules_external/near_public_indexer/types/near_indexer_transaction_types";
import { EnumUtils } from "../../../modules_utility/data_type_utils/EnumUtils";
import {
  INearIndexerTransaction_Stripped,
  TTransactionAssetMovement,
} from "./transaction_interpreter_types";

const nft_methods: string[] = EnumUtils.getEnumValues(ENearFunctionCallMethod_NftStandard);

function extractAssetMovements(
  transaction: INearIndexerTransaction_Stripped,
): TTransactionAssetMovement[] {
  const assetMovements: TTransactionAssetMovement[] = [];

  for (const action of transaction.actions) {
    if (action.action_kind === ENearIndexer_ActionKind.FUNCTION_CALL) {
      if (nft_methods.includes(action.args.method_name)) {
        // NFT Transfer
      }

      // action.args.
    }
  }

  return assetMovements;
}

export const transaction_interpreter = {
  extractAssetMovements,
};
