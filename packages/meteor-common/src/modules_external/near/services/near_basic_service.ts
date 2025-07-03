import { NearApiJsClient, getNearApi } from "../clients/near_api_js/NearApiJsClient";
import { NearRpcClient, getNearRpcClient } from "../clients/near_rpc/NearRpcClient";
import { ENearNetwork } from "../types/near_basic_types";

export abstract class NearBasicService {
  protected network: ENearNetwork;
  protected nearApi: NearApiJsClient;
  protected rpcClient: NearRpcClient;

  public constructor(network: ENearNetwork) {
    this.network = network;
    this.nearApi = getNearApi(network);
    this.rpcClient = getNearRpcClient(network);
  }
}
