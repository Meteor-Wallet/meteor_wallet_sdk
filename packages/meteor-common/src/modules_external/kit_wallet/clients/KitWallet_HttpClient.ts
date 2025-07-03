import { PublicKey } from "../../../modules_feature/accounts/keys/PublicKey";
import { BaseHttpClient } from "../../../modules_utility/http_utilities/BaseHttpClient";
import { ENearNetwork } from "../../near/types/near_basic_types";

// This class is using a singleton design
export class KitWallet_HttpClient extends BaseHttpClient {
  private readonly current_network: ENearNetwork;
  private static instance: KitWallet_HttpClient;

  private constructor(network: ENearNetwork) {
    super();
    this.current_network = network;
  }

  public static getInstance(network): KitWallet_HttpClient {
    if (
      !KitWallet_HttpClient.instance ||
      KitWallet_HttpClient.instance.current_network !== network
    ) {
      KitWallet_HttpClient.instance = new KitWallet_HttpClient(network);
    }

    return KitWallet_HttpClient.instance;
  }

  public async getStakingPools(): Promise<Array<string>> {
    return await this.getJson("/stakingPools");
  }

  public async getStakedValidators(accountId: string) {
    return await this.getJson(`/staking-deposits/${accountId}`);
  }

  public async getAccountIds(publicKey: PublicKey | string): Promise<string[]> {
    publicKey = publicKey.toString();
    return await this.getJson(`/publicKey/${publicKey}/accounts`);
  }

  // Private/protected functions
  protected getBaseUrl(): string {
    switch (this.current_network) {
      case ENearNetwork.testnet:
        return "https://helper.testnet.near.org";
      default:
        return "https://helper.mainnet.near.org";
    }
  }
}
