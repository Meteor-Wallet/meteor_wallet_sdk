import { InMemoryKeyStore } from "@near-js/keystores";
import { JsonRpcProvider, Provider } from "@near-js/providers";
import { AccountView, CodeResult } from "@near-js/types";
import { ConnectConfig, InMemorySigner, Near, connect, keyStores } from "near-api-js";
import { NEAR_BASE_CONFIG_FOR_NETWORK } from "../../near_static_data";
import { ENearNetwork } from "../../types/near_basic_types";
import { near_basic_utils } from "../../utils/near_basic_utils";
import {
  getNearFailoverRpcProviderConfig,
  getNearRpcProvider,
} from "../../../../modules_feature/rpc/rpc_utils";

function parseJsonFromRawResponse(response: Uint8Array): any {
  return JSON.parse(Buffer.from(response).toString());
}

function bytesJsonStringify(input: any): Buffer {
  return Buffer.from(JSON.stringify(input));
}

export type TNearConnectConfig = Omit<ConnectConfig, "headers"> & {
  name: string;
  explorerUrl?: string;
  archivalUrl?: string;
  networkId: ENearNetwork;
  headers?: string | number;
};
export type TNearBaseConnectConfig = Omit<TNearConnectConfig, "keyStore" | "keyPath" | "headers">;
export type TNearBaseConnectConfigNetwork = {
  [net in ENearNetwork]: TNearBaseConnectConfig;
};

export class NearApiJsClient {
  private config: TNearConnectConfig;
  private readonly keyStore: InMemoryKeyStore;
  private inMemorySigner: InMemorySigner;
  private near_api?: Near;
  private archival_near_provider?: Provider;
  private readonly current_network: ENearNetwork;
  public isInitialized: boolean = false;

  constructor(network: ENearNetwork) {
    this.keyStore = new keyStores.InMemoryKeyStore();
    this.inMemorySigner = new InMemorySigner(this.keyStore);
    this.current_network = network;
    this.config = {
      ...NEAR_BASE_CONFIG_FOR_NETWORK[network],
      keyStore: this.keyStore,
    };
  }

  get keystore() {
    return this.keyStore;
  }

  async initialize() {
    // this.near_api = await connect(this.config as unknown as ConnectConfig);
    // this.near_api = await connect({
    //   provider: getNearRpcProvider(this.current_network),
    // })

    this.near_api = await connect({
      networkId: this.current_network,
      provider: getNearRpcProvider(this.config.networkId) as any,
      nodeUrl: this.config.nodeUrl,
      keyStore: this.config.keyStore,
    });
    if (this.config.archivalUrl) {
      this.archival_near_provider = new JsonRpcProvider({
        url: this.config.archivalUrl,
      });
    }

    this.isInitialized = true;
  }

  get nativeApi(): Near {
    if (this.near_api == null) {
      throw new Error("Near API class needs to be initialized first.");
    }

    return this.near_api;
  }

  get hasArchivalRpcProvider() {
    return this.archival_near_provider != null;
  }

  get archivalRpcProvider(): Provider {
    if (this.archival_near_provider == null) {
      throw new Error("Near API class needs to be initialized first.");
    }

    return this.archival_near_provider;
  }

  /** @hidden */
  private printLogs(contractId: string, logs: string[], prefix = "") {
    for (const log of logs) {
      console.log(`${prefix}BlockLog [${contractId}]: ${log}`);
    }
  }

  /**
   * Invoke a contract view function using the RPC API.
   * @see {@link https://docs.near.org/docs/develop/front-end/rpc#call-a-contract-function}
   *
   * @param contractId NEAR account where the contract is deployed
   * @param methodName The view-only method (no state mutations) name on the contract as it is written in the contract code
   * @param args Any arguments to the view contract method, wrapped in JSON
   * @param options.parse Parse the result of the call. Receives a Buffer (bytes array) and converts it to any object. By default result will be treated as json.
   * @param options.stringify Convert input arguments into a bytes array. By default the input is treated as a JSON.
   * @returns {Promise<any>}
   */
  async viewFunction(
    contractId: string,
    methodName: string,
    args: any = {},
    { parse = parseJsonFromRawResponse, stringify = bytesJsonStringify } = {},
  ) {
    const serializedArgs = stringify(args).toString("base64");

    const result = await this.nativeApi.connection.provider.query<CodeResult>({
      request_type: "call_function",
      account_id: contractId,
      method_name: methodName,
      args_base64: serializedArgs,
      finality: "optimistic",
    });
    if (result.logs) {
      this.printLogs(contractId, result.logs);
    }

    return result.result && result.result.length > 0 && parse(Buffer.from(result.result));
  }

  /**
   * @deprecated This method is going to be moved out of this core API client
   */
  async state(accountId: string): Promise<AccountView> {
    return this.nativeApi.connection.provider.query<AccountView>({
      request_type: "view_account",
      account_id: accountId,
      finality: "optimistic",
    });
  }

  /**
   * @deprecated This method is going to be moved out of this core API client
   */
  async getAccessKeys(accountId: string) {
    const account = await this.near_api?.account(accountId);
    if (!account) {
      throw new Error("no account!");
    }
    return await account.getAccessKeys();
  }
}

export const nearApiForNetwork: { [network in ENearNetwork]?: NearApiJsClient } = {};

export function getNearApi(network: ENearNetwork): NearApiJsClient {
  if (nearApiForNetwork[network] == null) {
    if (near_basic_utils.isNearNetworkString(network)) {
      nearApiForNetwork[network] = new NearApiJsClient(network);
    } else {
      throw new Error(`Near API JS: Can't request client with network set to "${network}"`);
    }
  }

  return nearApiForNetwork[network]!;
}
