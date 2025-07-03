import { notNullEmpty } from "../../../../modules_utility/data_type_utils/StringUtils";
import { ENearNetwork } from "../../types/near_basic_types";
import {
  ENearRpc_Finality,
  ENearRpc_ViewRequestType,
  INearRpc_Query_WithRequestType,
  IONearRpc_Query_CallFunctionObjectArgs_Input,
  IONearRpc_Query_CallFunction_Input,
  IONearRpc_Query_CallFunction_ParsedOutput,
  IONearRpc_Query_CallFunction_RawOutput,
  IONearRpc_Query_ViewAccessKey_Input,
  IONearRpc_Query_ViewAccessKey_Output,
  TNearRpc_Query_InputsWithExtras,
  TNearRpc_Query_MinimalInputs,
  IONearRpc_Query_ViewAccessKeyList_Input,
  IONearRpc_Query_ViewAccessKeyList_Output,
} from "../../types/near_rpc_types";

import { Provider } from "@near-js/providers";
import { QueryResponseKind } from "@near-js/types";
import { NEAR_BASE_CONFIG_FOR_NETWORK } from "../../near_static_data";
import {
  getNearFailoverRpcProvider,
  getNearRpcProvider,
} from "../../../../modules_feature/rpc/rpc_utils";

function parseObjectFromRawResponse(response: Uint8Array | number[]): any {
  return JSON.parse(Buffer.from(response).toString());
}

function expandQueryInputs<T extends INearRpc_Query_WithRequestType>(
  inputs: TNearRpc_Query_MinimalInputs<any>,
  requestType: ENearRpc_ViewRequestType,
): TNearRpc_Query_InputsWithExtras<any> {
  if (notNullEmpty(inputs.block_id)) {
    return {
      ...inputs,
      request_type: requestType,
    };
  }

  if (notNullEmpty(inputs.finality)) {
    return {
      ...inputs,
      request_type: requestType,
    };
  }

  return {
    ...inputs,
    request_type: requestType,
    finality: ENearRpc_Finality.final,
  };
}

export class NearRpcClient {
  private _network: ENearNetwork;
  private _provider: Provider;

  constructor(network: ENearNetwork, nodeUrl: string) {
    this._network = network;
    this._provider = getNearRpcProvider(network);
    // this._provider = getNearFailoverRpcProvider(network);
    /*this._provider = new JsonRpcProvider(
      {
        url: nodeUrl,
      },
      {
        retries: 5,
        backoff: 1.7,
      },
    );*/
  }

  async query<R extends QueryResponseKind>(inputs: any): Promise<R> {
    /*const promiseFunc = async (): Promise<R> => {
      return this._provider.query(inputs);
    };

    return PromiseUtils.timeoutRetryPromise(promiseFunc, {
      attempts: 4,
      initialTimeout: 500,
      maximumTimeout: 3000,
      errorRetryAttempts: 1,
    });*/
    return this._provider.query<R>(inputs);
  }

  async view_access_key_list(
    inputs: TNearRpc_Query_MinimalInputs<IONearRpc_Query_ViewAccessKeyList_Input>,
  ): Promise<IONearRpc_Query_ViewAccessKeyList_Output> {
    const { ...copiedInputs } = inputs;

    if (inputs.finality == null) {
      copiedInputs.finality = ENearRpc_Finality.optimistic;
    }

    return this.query(
      expandQueryInputs(copiedInputs, ENearRpc_ViewRequestType.view_access_key_list),
    );
  }

  async view_access_key(
    inputs: TNearRpc_Query_MinimalInputs<IONearRpc_Query_ViewAccessKey_Input>,
  ): Promise<IONearRpc_Query_ViewAccessKey_Output> {
    const { ...copiedInputs } = inputs;

    if (inputs.finality == null) {
      copiedInputs.finality = ENearRpc_Finality.optimistic;
    }

    return this.query(expandQueryInputs(copiedInputs, ENearRpc_ViewRequestType.view_access_key));
  }

  async call_function<T = any>(
    inputs: TNearRpc_Query_MinimalInputs<IONearRpc_Query_CallFunction_Input>,
  ): Promise<IONearRpc_Query_CallFunction_ParsedOutput<T>> {
    const response = await this.query<IONearRpc_Query_CallFunction_RawOutput>(
      expandQueryInputs(inputs, ENearRpc_ViewRequestType.call_function),
    );

    return { ...response, result: parseObjectFromRawResponse(response.result) };
  }

  async call_function_object_args<T = any>(
    inputs: TNearRpc_Query_MinimalInputs<IONearRpc_Query_CallFunctionObjectArgs_Input>,
  ): Promise<IONearRpc_Query_CallFunction_ParsedOutput<T>> {
    const { args, ...rest } = inputs;

    return await this.call_function<T>({
      ...rest,
      args_base64: Buffer.from(JSON.stringify(args ?? {})).toString("base64"),
    });
  }

  /*async broadcastTxAsync(inputs: INearRpc_BroadcastTxCommit_Input): Promise<
    INearRpc_SuccessResponse<{
      // TODO: may have other statuses
      final_execution_status: "INCLUDED";
    }>
  > {
    const response = await this._provider.sendTransactionUntil(
      inputs.signed_transaction,
      "INCLUDED",
    );
    //   ENearRpc_MethodType.send_tx,
    //   {
    //     signed_tx_base64: inputs.signed_transaction_base64,
    //     wait_until: "INCLUDED",
    //   },
    //   {
    //     retryOptions: {
    //       attempts: 1,
    //       initialTimeout: 20,
    //     },
    //   },
    // );

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
    return this._provider.txStatus(inputs.transaction_hash, inputs.sender_account_id);
    //   ENearRpc_MethodType.EXPERIMENTAL_tx_status,
    //   [inputs.transaction_hash, inputs.sender_account_id],
    //   {
    //     returnFullRpcResponse: true,
    //     withRetry: false,
    //   },
    // );
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
  }*/
}

type TNetworkAndNodeUrl = `${ENearNetwork}_${string}`;

const clientForNetworkAndNodeUrl: {
  [key: TNetworkAndNodeUrl]: NearRpcClient;
} = {};

export function getNearRpcClient(network: ENearNetwork) {
  const nodeUrl = NEAR_BASE_CONFIG_FOR_NETWORK[network].nodeUrl;
  const key: TNetworkAndNodeUrl = `${network}_${nodeUrl}`;

  if (clientForNetworkAndNodeUrl[key] == null) {
    clientForNetworkAndNodeUrl[key] = new NearRpcClient(network, nodeUrl);
  }

  return clientForNetworkAndNodeUrl[key]!;
}
