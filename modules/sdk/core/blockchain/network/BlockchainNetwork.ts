import { ListManager } from "../../utility/managers/list_manager/ListManager";
import { RpcEndpoint } from "./RpcEndpoint";
import {
  INetworkDefinition,
  IRpcEndpointDefinition,
  IUniqueNetworkProps,
  IUniqueRpcEndpointProps,
} from "./blockchain_network.interfaces";
import { EGenericBlockchainNetworkId } from "./blockchain_network.enums";
import { Blockchain } from "../Blockchain";
import { MeteorError } from "../../errors/MeteorError";
import { EErrorId_BlockchainNetwork } from "../../errors/MeteorErrorIds";
import { IListManageable } from "../../utility/managers/list_manager/list_manager.interfaces";
import { OrdIdentity } from "../../utility/managers/list_manager/OrdIdentity";
import { TBlockchainNetworkId } from "./blockchain_network.types.ts";
import { getNetworkIdFromProps } from "./blockchain_network.utils.ts";

export class BlockchainNetwork implements IListManageable<IUniqueNetworkProps>, INetworkDefinition {
  _ord = new OrdIdentity();
  blockchain: Blockchain;
  isUserCreated: boolean;
  customNetworkId?: string;
  genericNetworkId: EGenericBlockchainNetworkId;
  label: string;

  private rpcEndpoints: ListManager<RpcEndpoint, IUniqueRpcEndpointProps> = new ListManager<
    RpcEndpoint,
    IUniqueRpcEndpointProps
  >();

  constructor(inputs: INetworkDefinition & { blockchain: Blockchain }) {
    this.blockchain = inputs.blockchain;
    this.isUserCreated = inputs.isUserCreated;
    this.customNetworkId = inputs.customNetworkId;
    this.genericNetworkId = inputs.genericNetworkId;
    this.label = inputs.label;
  }

  getRuntimeUniqueKey(): string | number {
    return this._ord.getOrd();
  }

  createRpcEndpoint(definition: IRpcEndpointDefinition): RpcEndpoint {
    return new RpcEndpoint({ network: this, ...definition });
  }

  addRpcEndpoint(endpoint: RpcEndpoint) {
    if (
      !this.isEqualTo(endpoint.network) ||
      !this.blockchain.isEqualTo(endpoint.network.blockchain)
    ) {
      throw MeteorError.fromId(EErrorId_BlockchainNetwork.incorrect_network_for_endpoint);
    }

    this.rpcEndpoints.add(endpoint);
  }

  isEqualTo(other: IUniqueNetworkProps): boolean {
    return (
      other.customNetworkId === this.customNetworkId &&
      other.genericNetworkId === this.genericNetworkId
    );
  }

  removeRpcEndpointByOrd(ord: number) {
    this.rpcEndpoints.removeByOrd(ord);
  }

  getRpcEndpoint(endpoint: { url: string }): RpcEndpoint {
    return this.rpcEndpoints.get({ requestInstruction: { url: endpoint.url } });
  }

  getRpcEndpoints(): RpcEndpoint[] {
    return this.rpcEndpoints.getAll();
  }

  getArchivalRpcEndpoints(): RpcEndpoint[] {
    return this.rpcEndpoints.getAll().filter((endpoint) => endpoint.isArchival);
  }

  getEnabledRpcEndpoints(): RpcEndpoint[] {
    return this.rpcEndpoints.getAll().filter((endpoint) => endpoint.isEnabled);
  }

  getNetworkId(): TBlockchainNetworkId {
    return getNetworkIdFromProps(this);
  }

  hasEnabledEndpoints(): boolean {
    return this.getEnabledRpcEndpoints().length > 0;
  }
}
