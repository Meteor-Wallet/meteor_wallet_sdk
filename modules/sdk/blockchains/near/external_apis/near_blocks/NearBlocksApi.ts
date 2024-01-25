import {
  INearBlocks_BaseTransaction,
  INearBlocks_FtTransaction,
  INearBlocks_GeneralTransaction,
  INearBlocks_NftTransaction,
} from "./near_blocks.types";

const LIMIT_TX = 3;

export class NearBlocksApi {
  private apiURL: string;

  constructor() {
    this.apiURL = "https://api.nearblocks.io/v1";
  }

  //NOTE: Nearblocks has 3 different endpoints for different type of transactions and we are aggregating them all here
  async getTransactionHistoryHashesByAccountId(account_id: string): Promise<string[]> {
    const res: any = await Promise.all([
      this.getGeneralTransactionsByAccountId(account_id),
      this.getFtTransactionsByAccountId(account_id),
      this.getNftTransactionsByAccountId(account_id),
    ]);
    const transactionListFromNearBlocks: INearBlocks_BaseTransaction[] = res.flat();
    return [...new Set(transactionListFromNearBlocks.map((trx) => trx.transaction_hash))];
  }

  /**************************/
  /****  Private Functions **/
  /**************************/
  private async getGeneralTransactionsByAccountId(
    account_id: string,
  ): Promise<INearBlocks_GeneralTransaction[]> {
    const response = await fetch(
      `${this.apiURL}/account/${account_id}/txns?&order=desc&page=1&per_page=${LIMIT_TX}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );
    const json = await response.json();
    return json.txns || [];
  }

  private async getFtTransactionsByAccountId(
    account_id: string,
  ): Promise<INearBlocks_FtTransaction[]> {
    const response = await fetch(
      `${this.apiURL}/account/${account_id}/ft-txns?&order=desc&page=1&per_page=${LIMIT_TX}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );
    const json = await response.json();
    return json.txns || [];
  }

  private async getNftTransactionsByAccountId(
    account_id: string,
  ): Promise<INearBlocks_NftTransaction[]> {
    const response = await fetch(
      `${this.apiURL}/account/${account_id}/nft-txns?&order=desc&page=1&per_page=${LIMIT_TX}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );
    const json = await response.json();
    return json.txns || [];
  }
}
