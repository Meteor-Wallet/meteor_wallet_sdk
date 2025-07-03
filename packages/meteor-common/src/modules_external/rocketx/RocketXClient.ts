import { BaseHttpClient } from "../../modules_utility/http_utilities/BaseHttpClient";
import { IRocketX_Config, IRocketX_Token } from "./rocketx.types";

export class RocketXClient extends BaseHttpClient {
  private static instance: RocketXClient;

  private constructor() {
    super();
  }

  public static getInstance(): RocketXClient {
    if (!RocketXClient.instance) {
      RocketXClient.instance = new RocketXClient();
    }

    return RocketXClient.instance;
  }

  public async getConfigs(): Promise<IRocketX_Config> {
    return await this.getJson("/configs");
  }

  /**
   *  perPage must be <= 500
   */
  public async getTokensByChainId({
    chainId,
    perPage,
    page,
    keyword,
  }: {
    chainId: string;
    perPage: number;
    page: number;
    keyword?: string;
  }): Promise<IRocketX_Token[]> {
    const params: { [key: string]: string } = {
      chainId,
      perPage: perPage.toString(),
      page: page.toString(),
    };
    if (keyword) {
      params.keyword = keyword;
    }
    const paramsObj = new URLSearchParams(params);
    return await this.getJson(`/tokens?${paramsObj.toString()}`);
  }

  protected getBaseUrl(): string {
    return "https://api.rocketx.exchange/v1";
  }
}
