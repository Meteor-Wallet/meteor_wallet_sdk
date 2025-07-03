import { FetchHelper } from "../../../../modules_utility/http_utilities/FetchHelper";
import { ENearNetwork } from "../../../near/types/near_basic_types";
import { nearblocksExplorerForNetwork } from "./static_data";

export class NearBlocksExplorer extends FetchHelper {
  private apiURL: string;

  constructor({ network }: { network: ENearNetwork }) {
    super();
    this.apiURL = nearblocksExplorerForNetwork[network];
  }

  getUrlTransactionDetail(transactionId: string): string {
    return `${this.apiURL}/txns/${transactionId}`;
  }
}
