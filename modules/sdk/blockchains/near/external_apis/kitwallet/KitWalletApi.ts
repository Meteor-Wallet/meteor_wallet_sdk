import { TBlockchainNetworkId } from "../../../../core/blockchain/network/blockchain_network.types.ts";
import { MeteorInternalError } from "../../../../core/errors/MeteorError.ts";
import { kitWalletUrlForNetwork } from "./kitwallet.static.ts";

export class KitWalletApi {
  private readonly apiUrl: string;

  constructor(networkId: TBlockchainNetworkId) {
    this.apiUrl = kitWalletUrlForNetwork[networkId];
  }

  async getUserTokenList(accountId: string): Promise<string[]> {
    const responses = await fetch(`${this.apiUrl}/account/${accountId}/likelyTokens`);

    if (!responses.ok) {
      const message = `An error has occurred: ${responses.status}`;
      throw new MeteorInternalError(`KitWalletApi.getUserTokenList() ${message}`);
    }

    return await responses.json();
  }
}

const clients: {
  api?: KitWalletApi;
} = {};

export const getKitWalletApi = (networkId: TBlockchainNetworkId): KitWalletApi => {
  if (!clients.api) {
    clients.api = new KitWalletApi(networkId);
  }

  return clients.api;
};
