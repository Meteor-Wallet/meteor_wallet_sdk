import { RpcEndpoint } from "../../../core/blockchain/network/RpcEndpoint";
import { RpcProvider } from "../../../core/blockchain/network/RpcProvider";
import { PromiseUtils } from "../../../core/utility/javascript_helpers/promise.utils";
import { IPollingWaitingPeriod } from "../../../core/utility/javascript_helpers/time.interfaces";
import { default_transaction_waiting_periods } from "./near_rpc.static";
import { INearBlock } from "../near_native/near_blockchain_data.types.ts";
import {
  TNearRpc_FinalityOrBlockId,
  TNearRpc_Query_MinimalInputs,
  TNearRpc_Response,
  TNearRpc_Response_CallFunction_RawOutput,
  TNearRpc_Response_ExperimentalTxStatus_Response,
} from "./near_rpc.types";
import { expandParams, parseObjectFromRawResponse } from "./near_rpc.utils";

import { AccountView, FinalExecutionOutcome, ViewAccountRequest } from "@near-js/types";
import { ENearRpc_Finality, ENearRpc_MethodType, ENearRpc_ViewRequestType } from "./near_rpc.enums";
import {
  INearRpc_BroadcastTxAwaitOutcome_Input,
  INearRpc_BroadcastTxCommit_Input,
  INearRpc_TransactionStatus_Input,
  IONearRpc_Query_CallFunction_Input,
  IONearRpc_Query_CallFunction_ParsedOutput_Success,
  IONearRpc_Query_CallFunctionObjectArgs_Input,
  IONearRpc_Query_ViewAccessKey_Input,
  IONearRpc_Query_ViewAccessKey_Output,
  IONearRpc_Query_ViewAccessKeyList_Input,
  IONearRpc_Query_ViewAccessKeyList_Output,
} from "./near_rpc.interfaces";
import { IPromiseTimeoutRetryOptions } from "../../../core/utility/javascript_helpers/promise.interfaces";
import { MeteorError, MeteorInternalError } from "../../../core/errors/MeteorError.ts";
import { EErrorId_Near_Rpc } from "../../../core/errors/MeteorErrorIds.near.ts";

/// Keep ids unique across all connections.
let _nextId = 123;

interface IRpcMethodOptions {
  retryOptions?: IPromiseTimeoutRetryOptions;
  returnFullRpcResponse?: boolean;
  withRetry?: boolean;
}

export class NearRpcProvider extends RpcProvider {
  constructor(rpcEndpoint: RpcEndpoint) {
    super(rpcEndpoint);
  }

  async send<R = any>(
    method: ENearRpc_MethodType,
    params: object,
    options: IRpcMethodOptions = {},
  ): Promise<R> {
    const request = {
      method,
      params,
      id: _nextId++,
      jsonrpc: "2.0",
    };
    const promiseFunc = async (): Promise<any> => {
      const response = await fetch(this.rpcEndpoint.requestInstruction.url, {
        method: "POST",
        body: JSON.stringify(request),
        headers: { "Content-Type": "application/json" },
      });

      const json: TNearRpc_Response<any> = await response.json();

      if (json.error != null) {
        console.error("Near RPC Error", json.error);
        return json;
      }

      return json;
    };

    if (options.withRetry) {
      return PromiseUtils.timeoutRetryPromise(
        promiseFunc,
        options.retryOptions ?? {
          attempts: 4,
          initialTimeout: 500,
          maximumTimeout: 3000,
          errorRetryAttempts: 1,
        },
      );
    } else {
      return promiseFunc();
    }
  }

  async query<R>(inputs: any): Promise<R> {
    return this.send<R>(ENearRpc_MethodType.query, inputs);
  }

  async block(inputs: TNearRpc_FinalityOrBlockId): Promise<INearBlock> {
    return this.send(ENearRpc_MethodType.block, expandParams(inputs));
  }

  // Use this to get transaction details
  async experimentalTxStatus(inputs: {
    transaction_hash: string;
    account_id: string;
  }): Promise<TNearRpc_Response_ExperimentalTxStatus_Response> {
    return this.send(ENearRpc_MethodType.EXPERIMENTAL_tx_status, [
      inputs.transaction_hash,
      inputs.account_id,
    ]);
  }

  async viewAccount(
    inputs: Omit<ViewAccountRequest, "request_type">,
  ): Promise<TNearRpc_Response<AccountView>> {
    return this.query({
      ...inputs,
      request_type: "view_account",
      finality: ENearRpc_Finality.optimistic,
    });
  }

  async viewAccessKeyList(
    inputs: TNearRpc_Query_MinimalInputs<IONearRpc_Query_ViewAccessKeyList_Input>,
  ): Promise<IONearRpc_Query_ViewAccessKeyList_Output> {
    const { ...copiedInputs } = inputs;

    if (inputs.finality == null) {
      copiedInputs.finality = ENearRpc_Finality.optimistic;
    }

    return this.query(expandParams(copiedInputs, ENearRpc_ViewRequestType.view_access_key_list));
  }

  async viewAccessKey(
    inputs: TNearRpc_Query_MinimalInputs<IONearRpc_Query_ViewAccessKey_Input>,
  ): Promise<IONearRpc_Query_ViewAccessKey_Output> {
    const { ...copiedInputs } = inputs;

    if (inputs.finality == null) {
      copiedInputs.finality = ENearRpc_Finality.optimistic;
    }

    const response = await this.query<TNearRpc_Response<IONearRpc_Query_ViewAccessKey_Output>>(
      expandParams(copiedInputs, ENearRpc_ViewRequestType.view_access_key),
    );

    if (response.error != null) {
      throw new MeteorInternalError(
        "Something went wrong trying to view access key",
        response.error,
      );
    }

    return response.result;
  }

  async callFunction<T extends any = any>(
    inputs: TNearRpc_Query_MinimalInputs<IONearRpc_Query_CallFunction_Input>,
  ): Promise<IONearRpc_Query_CallFunction_ParsedOutput_Success<T>> {
    const response = await this.query<TNearRpc_Response_CallFunction_RawOutput>(
      expandParams(inputs, ENearRpc_ViewRequestType.call_function),
    );

    if (response.result?.error != null) {
      if (response.result.error.includes("MethodNotFound")) {
        throw MeteorError.withContext({
          [EErrorId_Near_Rpc.near_call_function_failed]: response.result,
          [EErrorId_Near_Rpc.near_call_function_method_not_found]: response.result,
        });
      }
      throw MeteorError.fromId(EErrorId_Near_Rpc.near_call_function_failed, response.result);
    }

    if (response.error != null) {
      throw MeteorError.fromId(EErrorId_Near_Rpc.near_rpc_error, response.error);
    }

    return { ...response.result, result: parseObjectFromRawResponse(response.result.result) };
  }

  async callFunctionObjectArgs<T extends any = any>(
    inputs: TNearRpc_Query_MinimalInputs<IONearRpc_Query_CallFunctionObjectArgs_Input>,
  ): Promise<IONearRpc_Query_CallFunction_ParsedOutput_Success<T>> {
    const { args, ...rest } = inputs;

    return await this.callFunction<T>({
      ...rest,
      args_base64: Buffer.from(JSON.stringify(args ?? {})).toString("base64"),
    });
  }

  async broadcastTxCommit(
    inputs: INearRpc_BroadcastTxCommit_Input,
    options?: IRpcMethodOptions,
  ): Promise<FinalExecutionOutcome> {
    console.log("broadcast_tx_commit", inputs);

    return this.send(
      ENearRpc_MethodType.broadcast_tx_commit,
      [inputs.signed_transaction_base64],
      options,
    );
  }

  async broadcastTxAsync(inputs: INearRpc_BroadcastTxCommit_Input): Promise<string> {
    return this.send(ENearRpc_MethodType.broadcast_tx_async, [inputs.signed_transaction_base64], {
      retryOptions: {
        attempts: 1,
        initialTimeout: 20,
      },
    });
  }

  async EXPERIMENTALTxStatus(
    inputs: INearRpc_TransactionStatus_Input,
  ): Promise<TNearRpc_Response<FinalExecutionOutcome>> {
    return this.send(
      ENearRpc_MethodType.EXPERIMENTAL_tx_status,
      [inputs.transaction_hash, inputs.sender_account_id],
      {
        returnFullRpcResponse: true,
        withRetry: false,
      },
    );
  }

  async customBroadcastTxAsyncWaitAllReceipts(
    inputs: INearRpc_BroadcastTxAwaitOutcome_Input,
  ): Promise<FinalExecutionOutcome> {
    const initialResponse = await this.broadcastTxAsync(inputs);
    return this.customTxStatusWaitAllReceipts({
      transaction_hash: initialResponse,
      sender_account_id: inputs.sender_account_id,
    });
  }

  async customTxStatusWaitAllReceipts(
    inputs: INearRpc_TransactionStatus_Input,
    options?: {
      timeoutSeconds?: number;
      waitingPeriods?: IPollingWaitingPeriod[];
    },
  ): Promise<FinalExecutionOutcome> {
    const pollingFunction = async () => this.EXPERIMENTALTxStatus(inputs);

    return await PromiseUtils.pollUntilFinished<
      TNearRpc_Response<FinalExecutionOutcome>,
      FinalExecutionOutcome
    >({
      pollingFunction,
      waitingPeriods: options?.waitingPeriods ?? default_transaction_waiting_periods,
      timeoutSeconds: options?.timeoutSeconds ?? 120,
      handleResponse: (response) => {
        if (response.error != null) {
          if (response.error.cause.name !== "UNKNOWN_TRANSACTION") {
            // TODO: createNearRpcError is not exist at system design yet
            // throw createNearRpcError(response.error);
          }
        } else {
          return { stopAndRespond: response.result };
        }
      },
    });
  }
}
