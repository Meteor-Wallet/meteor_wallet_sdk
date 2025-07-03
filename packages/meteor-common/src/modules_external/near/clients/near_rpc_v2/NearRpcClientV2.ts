import { MeteorSdkErrorV1 } from "@meteorwallet/core-sdk/errors/MeteorSdkErrorV1";
import { EErrorId_Near_Rpc } from "@meteorwallet/core-sdk/errors/ids/MeteorErrorIds.near";
import { MeteorError, MeteorInternalError } from "@meteorwallet/errors";
import { encodeTransaction } from "@near-js/transactions";
import { AccountView, FinalExecutionOutcome, ViewAccountRequest } from "@near-js/types";
import Big from "big.js";
import { sha256 } from "js-sha256";
import { encoding_base58 } from "../../../../modules_utility/encoding/encoding_base58.utils";
import { PromiseUtils } from "../../../../modules_utility/javascript_helpers/PromiseUtils";
import { IPollingWaitingPeriod } from "../../../../modules_utility/javascript_helpers/TimeUtils";
import { NEAR_BASE_CONFIG_FOR_NETWORK } from "../../near_static_data";
import { ENearNetwork } from "../../types/near_basic_types";
import { INearBlock } from "../../types/near_blockchain_data_types";
import {
  ENearRpc_Finality,
  ENearRpc_MethodType,
  ENearRpc_ViewRequestType,
  INearRpc_BroadcastTxAwaitOutcome_Input,
  INearRpc_BroadcastTxCommit_Input,
  INearRpc_MethodOptions,
  INearRpc_SuccessResponse,
  INearRpc_TransactionStatus_Input,
  IONearRpc_Query_CallFunctionObjectArgs_Input,
  IONearRpc_Query_CallFunction_Input,
  IONearRpc_Query_CallFunction_ParsedOutput_Success,
  IONearRpc_Query_ViewAccessKeyList_Input,
  IONearRpc_Query_ViewAccessKeyList_Output,
  IONearRpc_Query_ViewAccessKey_Input,
  IONearRpc_Query_ViewAccessKey_Output,
  TNearRpc_FinalityOrBlockId,
  TNearRpc_Query_MinimalInputs,
  TNearRpc_Response,
  TNearRpc_Response_CallFunction_RawOutput,
  TNearRpc_Response_ExperimentalTxStatus_Response,
} from "../../types/near_rpc_types";
import { default_transaction_waiting_periods } from "../near_rpc/near_rpc.static";
import { expandParams } from "./near_rpc_v2.utils";
function parseObjectFromRawResponse(response: Uint8Array | number[]): any {
  return JSON.parse(Buffer.from(response).toString());
}

/// Keep ids unique across all connections.
let _nextId = 123;

export class NearRpcClientV2 {
  private readonly _nodeUrl: string;

  constructor(nodeUrl: string) {
    this._nodeUrl = nodeUrl;
  }

  async send<R = any>(
    method: ENearRpc_MethodType,
    params: object,
    options: INearRpc_MethodOptions = {},
  ): Promise<R> {
    const request = {
      method,
      params,
      id: _nextId++,
      jsonrpc: "2.0",
    };
    const promiseFunc = async (): Promise<any> => {
      const response = await fetch(this._nodeUrl, {
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

    return promiseFunc();
    /*if (options.withRetry) {
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
    }*/
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

    const response = await this.query<TNearRpc_Response<IONearRpc_Query_ViewAccessKeyList_Output>>(
      expandParams(copiedInputs, ENearRpc_ViewRequestType.view_access_key_list),
    );

    if (response.error != null) {
      throw new MeteorInternalError(
        "Something went wrong trying to view access key list",
        response.error,
      );
    }

    return response.result;
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

  async callFunction<T>(
    inputs: TNearRpc_Query_MinimalInputs<IONearRpc_Query_CallFunction_Input>,
  ): Promise<IONearRpc_Query_CallFunction_ParsedOutput_Success<T>> {
    const response = await this.query<TNearRpc_Response_CallFunction_RawOutput>(
      expandParams(inputs, ENearRpc_ViewRequestType.call_function),
    );

    if (response.result?.error != null) {
      if (response.result.error.includes("MethodNotFound")) {
        throw MeteorSdkErrorV1.fromContext({
          [EErrorId_Near_Rpc.near_call_function_failed]: response.result,
          [EErrorId_Near_Rpc.near_call_function_method_not_found]: response.result,
        });
      }
      throw MeteorError.fromId(EErrorId_Near_Rpc.near_call_function_failed, response.result);
    }

    if (response.error != null) {
      throw MeteorError.fromId(EErrorId_Near_Rpc.near_rpc_error, response.error);
    }

    return {
      ...response.result,
      result: parseObjectFromRawResponse(response.result.result),
    };
  }

  async callFunctionObjectArgs<T>(
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
    options?: INearRpc_MethodOptions,
  ): Promise<FinalExecutionOutcome> {
    console.log("broadcast_tx_commit", inputs);

    return this.send(
      ENearRpc_MethodType.broadcast_tx_commit,
      [inputs.signed_transaction_base64],
      options,
    );
  }

  async broadcastTxAsync(inputs: INearRpc_BroadcastTxCommit_Input): Promise<
    INearRpc_SuccessResponse<{
      // TODO: may have other statuses
      final_execution_status: "INCLUDED";
    }>
  > {
    const response: TNearRpc_Response<{
      final_execution_status: "INCLUDED";
    }> = await this.send(
      ENearRpc_MethodType.send_tx,
      {
        signed_tx_base64: inputs.signed_transaction_base64,
        wait_until: "INCLUDED",
      },
      {
        retryOptions: {
          attempts: 1,
          initialTimeout: 20,
        },
      },
    );

    if (response.error != null) {
      if (response.error?.data?.TxExecutionError?.InvalidTxError?.NotEnoughBalance) {
        const { balance, cost, signer_id } =
          response.error?.data?.TxExecutionError?.InvalidTxError?.NotEnoughBalance ?? {};

        throw MeteorError.fromId(EErrorId_Near_Rpc.near_rpc_error, response.error).withMessage(
          `Sender ${signer_id} does not have enough balance ${Big(balance).div(Big(10).pow(24)).toFixed()} for operation costing ${Big(cost).div(Big(10).pow(24)).toFixed()} `,
        );
      }
      throw MeteorError.fromId(EErrorId_Near_Rpc.near_rpc_error, response.error);
    }

    return response;
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
    await this.broadcastTxAsync(inputs);

    const message = encodeTransaction(inputs.transaction);
    const hash = new Uint8Array(sha256.array(message));

    return this.customTxStatusWaitAllReceipts({
      transaction_hash: encoding_base58.encode(hash),
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
          if (response.error.cause.name === "REQUEST_VALIDATION_ERROR") {
            throw MeteorError.fromIds([
              EErrorId_Near_Rpc.near_rpc_error,
              EErrorId_Near_Rpc.near_rpc_error_request_validation_failed,
            ]);
          }

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

type TNetworkAndNodeUrl = `${ENearNetwork}_${string}`;

const clientForNetworkAndNodeUrl: {
  [key: TNetworkAndNodeUrl]: NearRpcClientV2;
} = {};

export function getNearRpcClientV2(network: ENearNetwork) {
  const nodeUrl = NEAR_BASE_CONFIG_FOR_NETWORK[network].nodeUrl;
  const key: TNetworkAndNodeUrl = `${network}_${nodeUrl}`;

  if (clientForNetworkAndNodeUrl[key] == null) {
    clientForNetworkAndNodeUrl[key] = new NearRpcClientV2(nodeUrl);
  }

  return clientForNetworkAndNodeUrl[key]!;
}
