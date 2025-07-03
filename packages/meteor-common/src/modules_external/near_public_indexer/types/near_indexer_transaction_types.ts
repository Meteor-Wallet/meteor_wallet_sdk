import { EFunctionCallMethod_FungibleTokenStandard } from "../../near/types/standards/fungible_token_standard_types";
import { ENearFunctionCallMethod_NftStandard } from "../../near/types/standards/nft_standard_types";
import { ENearIndexer_AccessKeyPermission } from "./near_indexer_basic_types";

export enum ENearIndexer_TransactionStatus {
  SUCCESS_VALUE = "SUCCESS_VALUE",
  SUCCESS_RECEIPT_ID = "SUCCESS_RECEIPT_ID",
  FAILURE = "FAILURE",
  UNKNOWN = "UNKNOWN",
}

export interface INearIndexer_Transaction {
  transaction_hash: string;
  included_in_block_hash: string;
  included_in_chunk_hash: string;
  index_in_chunk: number;
  /** unit: picosecond */
  block_timestamp: string;
  signer_account_id: string;
  signer_public_key: string;
  nonce: string;
  receiver_account_id: string;
  signature: string;
  status: ENearIndexer_TransactionStatus;
  converted_into_receipt_id: string;
  receipt_conversion_gas_burnt: string;
  receipt_conversion_tokens_burnt: string;
}

export enum ENearIndexer_ActionKind {
  CREATE_ACCOUNT = "CREATE_ACCOUNT",
  DELETE_ACCOUNT = "DELETE_ACCOUNT",
  DEPLOY_CONTRACT = "DEPLOY_CONTRACT",
  FUNCTION_CALL = "FUNCTION_CALL",
  STAKE = "STAKE",
  TRANSFER = "TRANSFER",
  ADD_KEY = "ADD_KEY",
  DELETE_KEY = "DELETE_KEY",
}

export interface INearIndexer_TransactionAction_Base {
  transaction_hash: string;
  index_in_transaction: number;
}

export interface INearIndexer_TransactionAction_Any<TArgs = any>
  extends INearIndexer_TransactionAction_Base {
  action_kind: ENearIndexer_ActionKind;
  args: TArgs;
}

export type TNearIndexer_TransactionAction = INearIndexer_TransactionAction_Base &
  TNearIndexer_TransactionAction_Stripped;

export type TNearIndexer_TransactionAction_Stripped =
  | {
      action_kind: ENearIndexer_ActionKind.TRANSFER;
      args: INearIndexer_ActionArgs_Transfer;
    }
  | {
      action_kind: ENearIndexer_ActionKind.FUNCTION_CALL;
      args: INearIndexer_ActionArgs_FunctionCall;
    }
  | {
      action_kind: ENearIndexer_ActionKind.ADD_KEY;
      args: INearIndexer_ActionArgs_AddKey;
    }
  | {
      action_kind: ENearIndexer_ActionKind.DELETE_KEY;
      args: INearIndexer_ActionArgs_DeleteKey;
    }
  | {
      action_kind: ENearIndexer_ActionKind.CREATE_ACCOUNT;
      args: INearIndexer_ActionArgs_CreateAccount;
    }
  | {
      action_kind: ENearIndexer_ActionKind.DELETE_ACCOUNT;
      args: INearIndexer_ActionArgs_DeleteAccount;
    }
  | {
      action_kind: ENearIndexer_ActionKind.DEPLOY_CONTRACT;
      args: INearIndexer_ActionArgs_DeployContract;
    }
  | {
      action_kind: ENearIndexer_ActionKind.STAKE;
      args: INearIndexer_ActionArgs_Stake;
    };

export interface IFCActionArgsJson {}

export interface IFCActionArgsJson_FtTransfer extends IFCActionArgsJson {
  amount: string;
  receiver_id: string;
  content?: string;
  // for transfer_call
  msg?: string;
}

export interface IFCActionArgsJson_NftTransfer extends IFCActionArgsJson {
  token_id: string;
  receiver_id: string;
  // for transfer_call
  msg?: string;
}

export interface IFCActionArgsJson_FtTransferCall extends IFCActionArgsJson_FtTransfer {
  msg: string;
}

export interface IFCActionArgsJson_NftTransferCall extends IFCActionArgsJson_NftTransfer {
  msg: string;
}

export type TFtTransferActionArgs = INearIndexer_ActionArgs_FunctionCall<
  EFunctionCallMethod_FungibleTokenStandard.ft_transfer,
  IFCActionArgsJson_FtTransfer
>;

export type TNftTransferActionArgs = INearIndexer_ActionArgs_FunctionCall<
  ENearFunctionCallMethod_NftStandard.nft_transfer,
  IFCActionArgsJson_NftTransfer
>;

export interface INearIndexer_ActionArgs_FunctionCall<
  TName extends string = string,
  TActionArgsJson extends IFCActionArgsJson = any,
> {
  gas: string;
  deposit: string;
  method_name: TName;
  args_json?: TActionArgsJson;
  args_base64: string;
}

export interface INearIndexer_ActionArgs_CreateAccount {}

export interface INearIndexer_ActionArgs_DeleteAccount {
  beneficiary_id: string;
}

export interface INearIndexer_ActionArgs_AddKey {
  access_key: {
    nonce: 0;
    permission: {
      permission_kind: ENearIndexer_AccessKeyPermission;
      /** Only have in FUNCTION_CALL Access */
      permission_details?: {
        allowance: string;
        method_names: string[];
        receiver_id: string;
      };
    };
  };
  public_key: string;
}

export interface INearIndexer_ActionArgs_DeleteKey {
  public_key: string;
}

export interface INearIndexer_ActionArgs_DeployContract {
  code_sha256: string;
}

export interface INearIndexer_ActionArgs_Transfer {
  deposit: string;
}

export interface INearIndexer_ActionArgs_Stake {
  stake: string;
  public_key: string;
}

export interface INearIndexer_Transaction_WithActions extends INearIndexer_Transaction {
  actions: TNearIndexer_TransactionAction[];
}
