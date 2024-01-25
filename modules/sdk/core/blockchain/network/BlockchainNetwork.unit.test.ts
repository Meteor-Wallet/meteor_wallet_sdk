import { NearBlockchain } from "../../../blockchains/near/NearBlockchain";
import { EGenericBlockchainNetworkId } from "./blockchain_network.enums";
import {
  near_mainnet_endpoint,
  near_testnet_endpoint,
} from "../../../blockchains/near/network/near_endpoint.static";
import {
  near_mainnet_network,
  near_testnet_network,
} from "../../../blockchains/near/network/near_network.static";

describe("BlockchainNetwork", () => {
  it("Should be able to create a new blockchain network and add some endpoints", () => {
    const blockchain = new NearBlockchain();

    const mainnet = blockchain.networkManager.createNetwork(near_mainnet_network);

    mainnet.createRpcEndpoint(near_mainnet_endpoint);

    const testnet = blockchain.networkManager.createNetwork(near_testnet_network);

    blockchain.networkManager.addNetwork(mainnet);
    blockchain.networkManager.addNetwork(testnet);

    const nearMainnetRpc = mainnet.createRpcEndpoint(near_mainnet_endpoint);
    const nearTestnetRpc = testnet.createRpcEndpoint(near_testnet_endpoint);

    mainnet.addRpcEndpoint(nearMainnetRpc);
    testnet.addRpcEndpoint(nearTestnetRpc);

    // Current implementation for createRpcProvider, is not prefect.
    // const rpc = blockchain.createRpcProvider(EGenericBlockchainNetworkId.testnet); // <-- this able return NearRPCProvider
    // await rpc.viewAccount({ account_id: 'zigang.testnet'})

    expect(blockchain.networkManager.getNetworkById(EGenericBlockchainNetworkId.mainnet)).toBe(
      mainnet,
    );
    expect(blockchain.networkManager.getNetworkById(EGenericBlockchainNetworkId.testnet)).toBe(
      testnet,
    );
    expect(
      blockchain.networkManager.getRpcEndpointsByNetworkId(EGenericBlockchainNetworkId.mainnet)[0],
    ).toBe(nearMainnetRpc);
    expect(
      blockchain.networkManager.getRpcEndpointsByNetworkId(EGenericBlockchainNetworkId.testnet)[0],
    ).toBe(nearTestnetRpc);
  });
});
