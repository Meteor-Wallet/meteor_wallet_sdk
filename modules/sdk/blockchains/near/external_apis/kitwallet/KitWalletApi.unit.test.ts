import { EGenericBlockchainNetworkId } from "../../../../core/blockchain/network/blockchain_network.enums";
import { KitWalletApi } from "./KitWalletApi";

describe("KitWalletApi", () => {
  test("should able to call api", async () => {
    const kitwallet = new KitWalletApi(EGenericBlockchainNetworkId.testnet);

    const res = await kitwallet.getUserTokenList("pebbledev.testnet");

    // console.log(res);
    expect(Array.isArray(res)).toBe(true);
  });
});
