import { EGenericBlockchainNetworkId } from "../../../core/blockchain/network/blockchain_network.enums";
import { NearBlockchain } from "../NearBlockchain";
import { near_testnet_endpoint } from "../network/near_endpoint.static";
import { near_testnet_network } from "../network/near_network.static";
import { ENearRpc_Finality } from "./near_rpc.enums";

const initNearBlockChain = () => {
  const blockchain = new NearBlockchain();

  const testnet = blockchain.networkManager.createNetwork(near_testnet_network);

  blockchain.networkManager.addNetwork(testnet);

  const nearTestnetRpc = testnet.createRpcEndpoint(near_testnet_endpoint);

  testnet.addRpcEndpoint(nearTestnetRpc);

  const rpcProvider = blockchain.getRpcProvider(EGenericBlockchainNetworkId.testnet);

  return blockchain;
};

const getNearRpcProvider = () => {
  const blockchain = initNearBlockChain();
  return blockchain.getRpcProvider(EGenericBlockchainNetworkId.testnet);
};

describe("NearRpcProvider", () => {
  test("should able to call viewAccount api", async () => {
    const rpc = getNearRpcProvider();

    const sampleResponses = {
      amount: "any",
      block_hash: "any",
      block_height: 140182990,
      code_hash: "any",
      locked: "0",
      storage_paid_at: 0,
      storage_usage: 400,
    };

    const res = await rpc.viewAccount({
      account_id: "zigang.testnet",
    });

    expect(Object.keys(res).sort()).toEqual(Object.keys(sampleResponses).sort());
  });

  test("should able to call viewAccessKeyList api", async () => {
    const rpc = getNearRpcProvider();

    const sampleResponses = {
      keys: [],
      block_hash: "",
      block_height: 1,
    };

    const res = await rpc.viewAccessKeyList({
      account_id: "zigang.testnet",
    });

    expect(Object.keys(res).sort()).toEqual(Object.keys(sampleResponses).sort());
  });

  test("should able to call viewAccessKey api", async () => {
    const rpc = getNearRpcProvider();

    const sampleResponses = {
      nonce: 1,
      permission: {},
      block_hash: "",
      block_height: 1,
    };

    const allAccessKeyList = await rpc.viewAccessKeyList({
      account_id: "zigang.testnet",
    });

    const getFirstPublicKey = allAccessKeyList.keys[0].public_key;

    const res = await rpc.viewAccessKey({
      account_id: "zigang.testnet",
      public_key: getFirstPublicKey,
    });

    expect(Object.keys(res).sort()).toEqual(Object.keys(sampleResponses).sort());
  });

  test("should able to call block api", async () => {
    const rpc = getNearRpcProvider();

    const sampleResponses = {
      author: "",
      chunks: [],
      header: {},
    };

    const res = await rpc.block({
      finality: ENearRpc_Finality.final,
    });

    expect(Object.keys(res).sort()).toEqual(Object.keys(sampleResponses).sort());
  });

  test("should able to call contract call function api", async () => {
    const rpc = getNearRpcProvider();

    const sampleResponses = {
      result: [],
      logs: [],
      block_height: 17817336,
      block_hash: "4qkA4sUUG8opjH5Q9bL5mWJTnfR4ech879Db1BZXbx6P",
    };

    const res = await rpc.callFunction({
      account_id: "guest-book.testnet",
      method_name: "getMessages", // smart contract method name,
      args_base64: "",
    });

    expect(Object.keys(res).sort()).toEqual(Object.keys(sampleResponses).sort());
  });

  // TODO: stopper for create Tx
  // test("should able to call broadcastTxCommit api", async () => {

  // });
});
