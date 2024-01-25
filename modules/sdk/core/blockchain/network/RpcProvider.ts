import { OrdIdentity } from "../../utility/managers/list_manager/OrdIdentity";
import { RpcEndpoint } from "./RpcEndpoint";
import { IListManageable } from "../../utility/managers/list_manager/list_manager.interfaces";
import { TBlockchainNetworkId } from "./blockchain_network.types";
import { IUniqueRpcProviderProps } from "./blockchain_network.interfaces";

export abstract class RpcProvider implements IListManageable<IUniqueRpcProviderProps> {
  _ord = new OrdIdentity();
  protected rpcEndpoint: RpcEndpoint;
  networkId: TBlockchainNetworkId;

  protected constructor(rpcEndpoint: RpcEndpoint) {
    this.rpcEndpoint = rpcEndpoint;
    this.networkId = rpcEndpoint.network.getNetworkId();
  }

  getRuntimeUniqueKey(): string | number {
    return this._ord.getOrd();
  }

  isEqualTo(other: IUniqueRpcProviderProps): boolean {
    return this.networkId === other.networkId && this.rpcEndpoint.isEqualTo(other.rpcEndpoint);
  }
}
