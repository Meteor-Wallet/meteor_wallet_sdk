import { ENearRpc_Finality } from "./near_rpc.enums";
import {
  INearRpc_ErrorResponse,
  INearRPC_ExperimentalTxStatus_ResponseBody,
  INearRpc_FinalityOrBlock_Optional,
  INearRpc_Query_WithRequestType,
  INearRpc_SuccessResponse,
  IONearRpc_Query_CallFunction_Failure,
  IONearRpc_Query_CallFunction_ParsedOutput_Success,
  IONearRpc_Query_CallFunction_RawOutput_Success,
} from "./near_rpc.interfaces";

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

export type TNearRpc_FinalityOrBlockId =
  | {
      block_id: string;
      finality?: undefined;
    }
  | {
      block_id?: undefined;
      finality: ENearRpc_Finality;
    };

export type TNearRpc_Query_InputsWithExtras<T extends INearRpc_Query_WithRequestType> = T &
  TNearRpc_FinalityOrBlockId;

export type TNearRpc_Query_MinimalInputs<T extends INearRpc_Query_WithRequestType> = Omit<
  T,
  "request_type"
> &
  INearRpc_FinalityOrBlock_Optional;
