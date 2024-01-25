import {
  INear_FinalExecutionOutcome,
  INearChunkReceipt,
  TNearAccessKeyPermission,
} from "../near_native/near_blockchain_data.types.ts";
import { ENearRpc_Finality, ENearRpc_ViewRequestType } from "./near_rpc.enums";

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

export interface INearRpc_Query_ResponseBase {
  block_height: number;
  block_hash: string;
}

export interface INearRpc_TransactionStatus_Input {
  transaction_hash: string;
  sender_account_id: string;
}

export interface INearRpc_BroadcastTxAwaitOutcome_Input extends INearRpc_BroadcastTxCommit_Input {
  sender_account_id: string;
}

export interface INearRpc_BroadcastTxCommit_Input {
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

export interface IONearRpc_Query_CallFunction_ParsedOutput_Success<T extends any = any>
  extends INearRpc_Query_ResponseBase {
  result: T;
  logs: string[];
  error: undefined;
}

export interface INearRPC_ExperimentalTxStatus_ResponseBody extends INear_FinalExecutionOutcome {
  receipts: INearChunkReceipt[];
}
