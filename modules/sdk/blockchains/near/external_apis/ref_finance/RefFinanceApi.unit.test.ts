import { EGenericBlockchainNetworkId } from "../../../../core/blockchain/network/blockchain_network.enums";
import { RefFinanceApi } from "./RefFinanceApi";

describe("RefFinanceApi", () => {
  test("should able to call api", async () => {
    const refFinanceApi = new RefFinanceApi(EGenericBlockchainNetworkId.testnet);

    const res = await refFinanceApi.getAllTokenPriceList();

    const sampleResponses = {
      price: "",
      decimal: 2,
      symbol: "",
    };

    expect(Object.keys(res["wrap.testnet"]).sort()).toEqual(Object.keys(sampleResponses).sort());
  });
});
