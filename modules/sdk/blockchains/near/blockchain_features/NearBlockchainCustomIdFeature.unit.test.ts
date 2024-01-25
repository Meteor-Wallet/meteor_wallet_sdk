import { initializeBlockchains } from "../../initializeBlockchains.ts";
import { EGenericBlockchainNetworkId } from "../../../core/blockchain/network/blockchain_network.enums.ts";

describe("NearBlockchainCustomIdFeature", () => {
  const [nearBlockchain] = initializeBlockchains();

  it("Should be able to check account exist", async () => {
    const isExist = await nearBlockchain.customId().checkIdAvailability({
      fullId: "asdf.testnet",
      network: nearBlockchain.networkManager.getNetworkById(EGenericBlockchainNetworkId.testnet),
    });

    expect(isExist).toBe(true);
  });
});
