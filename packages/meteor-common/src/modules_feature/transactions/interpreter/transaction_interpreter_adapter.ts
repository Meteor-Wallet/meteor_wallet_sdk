import { Action } from "@near-js/transactions";
import { sha256 } from "js-sha256";
import { TNearAction } from "../../../modules_external/near/types/near_blockchain_data_types";
import { near_type_matching_util } from "../../../modules_external/near/utils/near_type_matching_util";
import { ENearIndexer_AccessKeyPermission } from "../../../modules_external/near_public_indexer/types/near_indexer_basic_types";
import {
  ENearIndexer_ActionKind,
  TNearIndexer_TransactionAction_Stripped,
} from "../../../modules_external/near_public_indexer/types/near_indexer_transaction_types";
import { transaction_utils } from "../transaction_utils";
import {
  INearApiJsTransaction_Stripped,
  INearBlockchainTransaction_Stripped,
  INearIndexerTransaction_Stripped,
  TNearIndexerAction_Stripped,
} from "./transaction_interpreter_types";

const nearApiJsActionKeyMapToNativeActionKey: {
  [key in keyof Omit<Action, "enum">]: string;
} = {
  addKey: "AddKey",
  deleteKey: "DeleteKey",
  createAccount: "CreateAccount",
  deleteAccount: "DeleteAccount",
  deployContract: "DeployContract",
  stake: "Stake",
  transfer: "Transfer",
  functionCall: "FunctionCall",
};

function convertNearApiJsActionToIndexerAction(action: Action): TNearIndexerAction_Stripped {
  const nativeBlockchainAction: any = {};

  for (const key of Object.keys(action)) {
    if (key === "enum") {
      continue;
    }

    if (key === "createAccount") {
      return convertNearBlockchainActionToIndexerAction("CreateAccount");
    }

    nativeBlockchainAction[nearApiJsActionKeyMapToNativeActionKey[key]] = action[key];
  }

  return nativeBlockchainAction as TNearIndexerAction_Stripped;
}

function convertNearBlockchainActionToIndexerAction(
  action: TNearAction,
): TNearIndexerAction_Stripped {
  if (near_type_matching_util.actions.isTransferAction(action)) {
    return {
      action_kind: ENearIndexer_ActionKind.TRANSFER,
      args: {
        deposit: action.Transfer.deposit,
      },
    } as TNearIndexer_TransactionAction_Stripped;
  }

  if (near_type_matching_util.actions.isAddKeyAction(action)) {
    return {
      action_kind: ENearIndexer_ActionKind.ADD_KEY,
      args: {
        access_key: {
          nonce: action.AddKey.access_key.nonce,
          permission: {
            permission_kind:
              action.AddKey.access_key.permission === "FullAccess"
                ? ENearIndexer_AccessKeyPermission.FULL_ACCESS
                : ENearIndexer_AccessKeyPermission.FUNCTION_CALL,
            permission_details:
              action.AddKey.access_key.permission === "FullAccess"
                ? undefined
                : action.AddKey.access_key.permission.FunctionCall,
          },
        },
        public_key: action.AddKey.public_key,
      },
    } as TNearIndexer_TransactionAction_Stripped;
  }

  if (near_type_matching_util.actions.isStakeAction(action)) {
    return {
      action_kind: ENearIndexer_ActionKind.STAKE,
      args: {
        ...action.Stake,
      },
    } as TNearIndexer_TransactionAction_Stripped;
  }

  if (near_type_matching_util.actions.isCreateAccountAction(action)) {
    return {
      action_kind: ENearIndexer_ActionKind.CREATE_ACCOUNT,
      args: {},
    } as TNearIndexer_TransactionAction_Stripped;
  }

  if (near_type_matching_util.actions.isDeleteAccountAction(action)) {
    return {
      action_kind: ENearIndexer_ActionKind.DELETE_ACCOUNT,
      args: {
        ...action.DeleteAccount,
      },
    } as TNearIndexer_TransactionAction_Stripped;
  }

  if (near_type_matching_util.actions.isDeleteKeyAction(action)) {
    return {
      action_kind: ENearIndexer_ActionKind.DELETE_KEY,
      args: {
        ...action.DeleteKey,
      },
    } as TNearIndexer_TransactionAction_Stripped;
  }

  if (near_type_matching_util.actions.isDeployContractAction(action)) {
    return {
      action_kind: ENearIndexer_ActionKind.DEPLOY_CONTRACT,
      args: {
        code_sha256: sha256.hex(action.DeployContract.code),
      },
    } as TNearIndexer_TransactionAction_Stripped;
  }

  if (near_type_matching_util.actions.isFunctionCallAction(action)) {
    return {
      action_kind: ENearIndexer_ActionKind.FUNCTION_CALL,
      args: {
        method_name: action.FunctionCall.method_name,
        deposit: action.FunctionCall.deposit,
        gas: `${action.FunctionCall.gas}`,
        args_base64: action.FunctionCall.args,
        args_json: transaction_utils.tryParseArgsBase64Json(action.FunctionCall.args),
      },
    } as TNearIndexer_TransactionAction_Stripped;
  }

  return {
    action_kind: "NOT_FOUND",
  };
}

function convertNearBlockchainTransactionToIndexerTransaction(
  transaction: INearBlockchainTransaction_Stripped,
): INearIndexerTransaction_Stripped {
  return {
    actions: transaction.actions.map(convertNearBlockchainActionToIndexerAction),
    receiver_account_id: transaction.receiver_id,
    signer_account_id: transaction.signer_id,
  };
}

function convertNearApiJsTransactionToIndexerTransaction(
  transaction: INearApiJsTransaction_Stripped,
): INearIndexerTransaction_Stripped {
  return {
    actions: transaction.actions.map(convertNearApiJsActionToIndexerAction),
    signer_account_id: transaction.signerId,
    receiver_account_id: transaction.receiverId,
  };
}

export const transaction_interpreter_adapter = {
  convertNearBlockchainTransactionToIndexerTransaction,
  convertNearApiJsTransactionToIndexerTransaction,
};
