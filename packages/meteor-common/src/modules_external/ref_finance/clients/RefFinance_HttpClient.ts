import { FetchHelper } from "../../../modules_utility/http_utilities/FetchHelper";
import { ENearNetwork } from "../../near/types/near_basic_types";
import { TIOGetTokenPriceList_Output } from "../ref_finance_type";

export class RefFinance_HttpClient extends FetchHelper {
  private network: ENearNetwork;

  constructor(network: ENearNetwork) {
    super();
    this.network = network;
  }

  getBaseUrl(): string {
    if (this.network === ENearNetwork.mainnet) {
      // return "https://indexer.ref.finance";
      return "https://api.ref.finance";
    } else {
      return "https://testnet-indexer.ref-finance.com";
    }
  }

  /*******************************/
  //
  // 	Functions start from here
  //
  /*******************************/
  public getTokenPriceList(): Promise<TIOGetTokenPriceList_Output> {
    const apiCall = this.getJson("/list-token-price");

    // A promise that resolves after 3 seconds
    const timeout = new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({
          "wrap.near": "",
        });
      }, 3000);
    });

    // Using Promise.race to enforce the timeout
    if (this.network === ENearNetwork.mainnet) {
      return apiCall;
    }
    return Promise.race([apiCall, timeout]);
  }
}
