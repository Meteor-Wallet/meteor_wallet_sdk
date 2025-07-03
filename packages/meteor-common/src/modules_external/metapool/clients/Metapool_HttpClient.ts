import { BaseHttpClient } from "../../../modules_utility/http_utilities/BaseHttpClient";

// This class is using a singleton design
export class Metapool extends BaseHttpClient {
  private static instance: Metapool;

  private constructor() {
    super();
  }

  public static getInstance(): Metapool {
    if (!Metapool.instance) {
      Metapool.instance = new Metapool();
    }

    return Metapool.instance;
  }

  public async getMetrics() {
    return await this.getJson("https://validators.narwallets.com/metrics_json", {
      headers: { "Content-Type": "-1" },
    });
  }
}
