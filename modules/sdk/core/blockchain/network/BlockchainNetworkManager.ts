import { RpcEndpoint } from "./RpcEndpoint";
import { Blockchain } from "../Blockchain";
import { EErrorId_BlockchainNetwork, EErrorId_ListManager } from "../../errors/MeteorErrorIds";
import { TBlockchainNetworkId } from "./blockchain_network.types";
import { ListManager } from "../../utility/managers/list_manager/ListManager";
import { BlockchainNetwork } from "./BlockchainNetwork";
import { convertNetworkIdToUniqueProps } from "./blockchain_network.utils";
import { MeteorError } from "../../errors/MeteorError";
import { INetworkDefinition } from "./blockchain_network.interfaces";
import { ISubscribable } from "../../utility/pubsub/pubsub.interfaces.ts";
import { PubSub } from "../../utility/pubsub/PubSub.ts";
import { TPubSubListener } from "../../utility/pubsub/pubsub.types.ts";
import { IPubSub_BlockchainNetworkManager } from "./BlockchainNetworkManager.pubsub.ts";

export class BlockchainNetworkManager implements ISubscribable<IPubSub_BlockchainNetworkManager> {
  blockchain: Blockchain;
  networks: ListManager<BlockchainNetwork> = new ListManager<BlockchainNetwork>({
    errorMap: {
      [EErrorId_ListManager.list_item_not_found]:
        EErrorId_BlockchainNetwork.blockchain_network_id_not_found,
    },
  });

  constructor(blockchain: Blockchain) {
    this.blockchain = blockchain;
  }

  pubSub: PubSub<IPubSub_BlockchainNetworkManager> = new PubSub<IPubSub_BlockchainNetworkManager>();

  subscribe<K extends keyof IPubSub_BlockchainNetworkManager>(
    id: K,
    listener: TPubSubListener<any>,
  ): () => void {
    return this.pubSub.subscribe(id, listener);
  }

  unsubscribe<K extends keyof IPubSub_BlockchainNetworkManager>(
    id: K,
    listener: TPubSubListener<any>,
  ): void {
    return this.pubSub.unsubscribe(id, listener);
  }

  createNetwork(definition: INetworkDefinition) {
    return new BlockchainNetwork({ blockchain: this.blockchain, ...definition });
  }

  addNetwork(network: BlockchainNetwork) {
    if (!this.blockchain.isEqualTo(network.blockchain)) {
      throw MeteorError.fromId(EErrorId_BlockchainNetwork.incorrect_blockchain_for_network);
    }

    this.networks.add(network);
  }

  getAvailableNetworks(): BlockchainNetwork[] {
    return this.networks.getAll().filter((network) => network.getEnabledRpcEndpoints().length > 0);
  }

  getFirstAvailableNetwork(): BlockchainNetwork {
    const networks = this.getAvailableNetworks();

    if (networks.length === 0) {
      throw MeteorError.fromId(EErrorId_BlockchainNetwork.blockchain_has_no_available_networks);
    }

    return networks[0];
  }

  getNetworkById(networkId: TBlockchainNetworkId): BlockchainNetwork {
    return this.networks.get(convertNetworkIdToUniqueProps(networkId));
  }

  getRpcEndpointsByNetworkId(networkId: TBlockchainNetworkId): RpcEndpoint[] {
    return this.getNetworkById(networkId).getRpcEndpoints();
  }

  getEnabledRpcEndpointsByNetworkId(networkId: TBlockchainNetworkId): RpcEndpoint[] {
    const endpoints = this.getNetworkById(networkId).getEnabledRpcEndpoints();

    if (endpoints.length === 0) {
      throw MeteorError.fromId(EErrorId_BlockchainNetwork.no_blockchain_endpoint_enabled_for_id);
    }

    return endpoints;
  }

  getFirstEnabledRpcEndpointByNetworkId(networkId: TBlockchainNetworkId): RpcEndpoint {
    return this.getEnabledRpcEndpointsByNetworkId(networkId)[0];
  }

  includesNetworkWithAvailableEndpoints(network: BlockchainNetwork): boolean {
    return this.networks.includes(network) && network.hasEnabledEndpoints();
  }
}
