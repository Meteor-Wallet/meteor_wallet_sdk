import { BaseHttpClient } from "../../../modules_utility/http_utilities/BaseHttpClient";
import { IGeoJsCountryInfo } from "../geojs_types";

// This class is using a singleton design
export class GeoJs_HttpClient extends BaseHttpClient {
  private static instance: GeoJs_HttpClient;

  private constructor() {
    super();
  }

  public static getInstance(): GeoJs_HttpClient {
    if (!GeoJs_HttpClient.instance) {
      GeoJs_HttpClient.instance = new GeoJs_HttpClient();
    }

    return GeoJs_HttpClient.instance;
  }

  public async getCountryCode(): Promise<IGeoJsCountryInfo> {
    return await this.getJson("/v1/ip/country.json");
  }

  // Private/protected functions
  protected getBaseUrl(): string {
    return "https://get.geojs.io";
  }
}
