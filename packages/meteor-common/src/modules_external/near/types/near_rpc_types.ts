import { Transaction } from "near-api-js/lib/transaction";
import { IPromiseTimeoutRetryOptions } from "../../../modules_utility/javascript_helpers/PromiseUtils";
import {
  INearChunkReceipt,
  INear_FinalExecutionOutcome,
  TNearAccessKeyPermission,
} from "./near_blockchain_data_types";
import { SignedTransaction } from "@near-js/transactions";

export interface INearRpc_SuccessResponse<T> {
  jsonrpc: string;
  result: T;
  id: string;
}

export enum ENearRpc_ViewRequestType {
  view_access_key = "view_access_key",
  view_access_key_list = "view_access_key_list",
  call_function = "call_function",
  block = "block",
}

export enum ENearRpc_Finality {
  final = "final",
  included = "included",
  optimistic = "optimistic",
}

export type TNearRpc_FinalityOrBlockId =
  | {
      block_id: string;
      finality?: undefined;
    }
  | {
      block_id?: undefined;
      finality: ENearRpc_Finality;
    };

export interface INearRpc_FinalityOrBlock_Optional {
  block_id?: string;
  finality?: ENearRpc_Finality;
}

export interface INearRpc_Query_WithRequestType {
  request_type: ENearRpc_ViewRequestType;
}

export type TNearRpc_Query_InputsWithExtras<T extends INearRpc_Query_WithRequestType> = T &
  TNearRpc_FinalityOrBlockId;

export type TNearRpc_Query_MinimalInputs<T extends INearRpc_Query_WithRequestType> = Omit<
  T,
  "request_type"
> &
  INearRpc_FinalityOrBlock_Optional;

interface INearRpc_Query_ResponseBase {
  block_height: number;
  block_hash: string;
}

export interface IONearRpc_Query_ViewAccessKey_Input {
  request_type: ENearRpc_ViewRequestType.view_access_key;
  account_id: string;
  public_key: string;
}

export interface IONearRpc_Query_ViewAccessKey_Output extends INearRpc_Query_ResponseBase {
  nonce: number;
  permission: TNearAccessKeyPermission;
}

export interface IONearRpc_Query_CallFunction_Input {
  request_type: ENearRpc_ViewRequestType.call_function;
  account_id: string;
  method_name: string;
  args_base64: string;
}

export interface IONearRpc_Query_CallFunctionObjectArgs_Input {
  request_type: ENearRpc_ViewRequestType.call_function;
  account_id: string;
  method_name: string;
  args?: object;
}

export interface IONearRpc_Query_CallFunction_RawOutput extends INearRpc_Query_ResponseBase {
  result: number[];
  logs: string[];
}

export interface IONearRpc_Query_CallFunction_ParsedOutput<T = any>
  extends INearRpc_Query_ResponseBase {
  result: T;
  logs: string[];
}

export interface INearRpc_MethodOptions {
  retryOptions?: IPromiseTimeoutRetryOptions;
  returnFullRpcResponse?: boolean;
  withRetry?: boolean;
}

export interface INearRpc_SuccessResponse<T> {
  result: T;
  jsonrpc: string;
  id: string;
  error: undefined;
}

export interface INearRpc_ErrorCause {
  name: string;
}

export interface INearRpc_Error {
  name: string;
  cause: INearRpc_ErrorCause;
  code: number;
  data: any;
  message: string;
}

export interface INearRpc_ErrorResponse {
  result: undefined;
  jsonrpc: string;
  id: number;
  error: INearRpc_Error;
}

export interface INearRpc_FinalityOrBlock_Optional {
  block_id?: string;
  finality?: ENearRpc_Finality;
}

export interface INearRpc_Query_WithRequestType {
  request_type: ENearRpc_ViewRequestType;
}

export interface INearRpc_TransactionStatus_Input {
  transaction_hash: string;
  sender_account_id: string;
}

export interface INearRpc_BroadcastTxAwaitOutcome_Input extends INearRpc_BroadcastTxCommit_Input {
  sender_account_id: string;
  transaction: Transaction;
}

export interface INearRpc_BroadcastTxCommit_Input {
  signed_transaction: SignedTransaction;
  signed_transaction_base64: string;
}

export interface IONearRpc_Query_ViewAccessKey_Input {
  request_type: ENearRpc_ViewRequestType.view_access_key;
  account_id: string;
  public_key: string;
}

export interface IONearRpc_Query_ViewAccessKey_Output extends INearRpc_Query_ResponseBase {
  nonce: number;
  permission: TNearAccessKeyPermission;
}

export interface IONearRpc_Query_ViewAccessKeyList_Input {
  request_type: ENearRpc_ViewRequestType.view_access_key_list;
  account_id: string;
}

export interface IONearRpc_Query_ViewAccessKeyList_Key_Output {
  public_key: string;
  access_key: IONearRpc_Query_ViewAccessKey_Output;
}

export interface IONearRpc_Query_ViewAccessKeyList_Output extends INearRpc_Query_ResponseBase {
  keys: IONearRpc_Query_ViewAccessKeyList_Key_Output[];
}
export interface IONearRpc_Query_CallFunction_Input {
  request_type: ENearRpc_ViewRequestType.call_function;
  account_id: string;
  method_name: string;
  args_base64: string;
}

export interface IONearRpc_Query_CallFunctionObjectArgs_Input {
  request_type: ENearRpc_ViewRequestType.call_function;
  account_id: string;
  method_name: string;
  args?: object;
}

export interface IONearRpc_Query_CallFunction_Failure extends INearRpc_Query_ResponseBase {
  logs: string[];
  error: string;
  result: undefined;
}

export interface IONearRpc_Query_CallFunction_RawOutput_Success
  extends INearRpc_Query_ResponseBase {
  result: number[];
  logs: string[];
  error: undefined;
}

export interface IONearRpc_Query_CallFunction_ParsedOutput_Success<T>
  extends INearRpc_Query_ResponseBase {
  result: T;
  logs: string[];
  error: undefined;
}

export interface INearRPC_ExperimentalTxStatus_ResponseBody extends INear_FinalExecutionOutcome {
  receipts: INearChunkReceipt[];
}

export type TNearRpc_Response<T> = INearRpc_ErrorResponse | INearRpc_SuccessResponse<T>;

export type TNearRpc_CallFunction_Outcome_ParsedResult<T> =
  | IONearRpc_Query_CallFunction_Failure
  | IONearRpc_Query_CallFunction_ParsedOutput_Success<T>;
export type TNearRpc_CallFunction_Outcome_RawResult =
  | IONearRpc_Query_CallFunction_Failure
  | IONearRpc_Query_CallFunction_RawOutput_Success;

export type TNearRpc_Response_CallFunction_ParsedOutput<T> =
  | INearRpc_ErrorResponse
  | INearRpc_SuccessResponse<TNearRpc_CallFunction_Outcome_ParsedResult<T>>;
export type TNearRpc_Response_CallFunction_RawOutput =
  | INearRpc_ErrorResponse
  | INearRpc_SuccessResponse<TNearRpc_CallFunction_Outcome_RawResult>;
export type TNearRpc_Response_ExperimentalTxStatus_Response =
  | INearRpc_ErrorResponse
  | INearRpc_SuccessResponse<INearRPC_ExperimentalTxStatus_ResponseBody>;

export enum ENearRpc_MethodType {
  query = "query",
  block = "block",
  gas_price = "gas_price",
  status = "status",
  network_info = "network_info",
  validators = "validators",
  broadcast_tx_async = "broadcast_tx_async",
  broadcast_tx_commit = "broadcast_tx_commit",
  tx = "tx",
  send_tx = "send_tx",
  EXPERIMENTAL_changes = "EXPERIMENTAL_changes",
  EXPERIMENTAL_tx_status = "EXPERIMENTAL_tx_status",
  EXPERIMENTAL_receipt = "EXPERIMENTAL_receipt",
  EXPERIMENTAL_genesis_config = "EXPERIMENTAL_genesis_config",
  EXPERIMENTAL_protocol_config = "EXPERIMENTAL_protocol_config",
}

export enum ENearApiRpc_ErrorCauseName {
  /** The requested account_id has not been found while viewing since
   *  the account has not been created or has been already deleted */
  UNKNOWN_ACCOUNT = "UNKNOWN_ACCOUNT",
  /** The requested block has not been produced yet or it has been
   *  garbage-collected (cleaned up to save space on the RPC node) */
  UNKNOWN_BLOCK = "UNKNOWN_BLOCK",
  /** The requested account_id is invalid */
  INVALID_ACCOUNT = "INVALID_ACCOUNT",
  /** The node was unable to find the requested data because it
   *  does not track the shard where data is present */
  UNAVAILABLE_SHARD = "UNAVAILABLE_SHARD",
  /** The node is still syncing and the requested block is not in the database yet */
  NO_SYNCED_BLOCKS = "NO_SYNCED_BLOCKS",
  /** Passed arguments can't be parsed by JSON RPC server (missing arguments, wrong format, etc.) */
  PARSE_ERROR = "PARSE_ERROR",
  /** Something went wrong with the node itself or overloaded */
  INTERNAL_ERROR = "INTERNAL_ERROR",
}
