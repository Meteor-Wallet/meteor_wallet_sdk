import { TBlockchainNetworkId } from "../../../../core/blockchain/network/blockchain_network.types.ts";
import { MeteorInternalError } from "../../../../core/errors/MeteorError.ts";
import { refFinanceApiForNetwork } from "./ref_finance.static.ts";
import { IOTokenPriceList_Output } from "./ref_finance.types.ts";

export class RefFinanceApi {
  private apiURL: string;

  constructor(networkId: TBlockchainNetworkId) {
    this.apiURL = refFinanceApiForNetwork[networkId];
  }

  async getAllTokenPriceList(): Promise<IOTokenPriceList_Output> {
    const responses = await fetch(`${this.apiURL}/list-token-price`);

    if (!responses.ok) {
      const message = `An error has occured: ${responses.status}`;
      throw new MeteorInternalError(`Error: RefFinanceApi's getAllTokenPriceList ${message}`);
    }

    const tokenPriceList: IOTokenPriceList_Output = await responses.json();
    return tokenPriceList;
  }
}

const clients: {
  api?: RefFinanceApi;
} = {};

export const getRefFinanceApi = (networkId: TBlockchainNetworkId): RefFinanceApi => {
  if (!clients.api) {
    clients.api = new RefFinanceApi(networkId);
  }

  return clients.api;
};
