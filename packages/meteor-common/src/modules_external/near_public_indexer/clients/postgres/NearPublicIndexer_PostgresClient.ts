import { ENVS } from "@meteorwallet/meteor-backend-service/src/constants/env";
import postgres from "postgres";
import { ENearNetwork } from "../../../near/types/near_basic_types";
import {
  INearIndexer_Transaction,
  INearIndexer_TransactionAction_Any,
  INearIndexer_Transaction_WithActions,
} from "../../types/near_indexer_transaction_types";

export type TSql_Pagination = {
  offset?: number;
  limit?: number;
};

export type TSql_BlockTimestamp = {
  start?: number;
  end?: number;
};

export type TParams_GetAccountRelatedTrxs = { accountId: string };
export type TParams_GetAccountRelatedTrxsWithPagination = TParams_GetAccountRelatedTrxs &
  TSql_Pagination;

const dbNetworkURI: { [net in ENearNetwork]: string } = {
  [ENearNetwork.mainnet]: ENVS.INDEXER_DB.MAINNET || "",
  [ENearNetwork.testnet]: ENVS.INDEXER_DB.TESTNET || "",
  [ENearNetwork.betanet]: ENVS.INDEXER_DB.BETANET || "",
  [ENearNetwork.localnet]: ENVS.INDEXER_DB.LOCALNET || "",
};

// eslint-disable-next-line @typescript-eslint/ban-types
type TTypeMap = {};

// console.log(postgres)

export class NearPublicIndexer_PostgresClient {
  network: ENearNetwork;
  sql: postgres.Sql<TTypeMap>;

  constructor(network: ENearNetwork) {
    this.network = network;
    const uri = dbNetworkURI[network];
    if (!uri) {
      throw new Error(`network "${network}" hasn't provided a indexer db URI`);
    }
    // console.log(postgres)
    this.sql = postgres(uri, {
      transform: {
        column: {
          to: postgres.fromCamel,
          from: postgres.toCamel,
        },
      },
    });
  }

  async getTransactionsWithActionsForAccountId(
    params: TParams_GetAccountRelatedTrxsWithPagination,
  ): Promise<INearIndexer_Transaction_WithActions[]> {
    const transactions = await this.getRelatedTransaction(params);
    const actions = await this.getTransactionsActions(transactions.map((t) => t.transaction_hash));

    return transactions.map((trx): INearIndexer_Transaction_WithActions => {
      return {
        ...trx,
        actions: actions.filter((action) => action.transaction_hash === trx.transaction_hash),
      };
    });
  }

  async getTransactionsActions(trxHashes: string[]): Promise<INearIndexer_TransactionAction_Any[]> {
    return this.sql<INearIndexer_TransactionAction_Any[]>`
        SELECT *
        FROM transaction_actions
        WHERE transaction_hash IN ${this.sql(trxHashes)}
    `;
  }

  async getRelatedTransaction(
    params: TParams_GetAccountRelatedTrxsWithPagination,
  ): Promise<INearIndexer_Transaction[]> {
    return this.genRelatedTrxsQuery(params);
  }

  async countRelatedTransaction(params: TParams_GetAccountRelatedTrxs): Promise<number> {
    return await this.queryCount(this.genRelatedTrxsQuery(params));
  }

  private genPaginationQuery({ limit, offset }: TSql_Pagination) {
    return this.sql`
        ${
          offset !== undefined
            ? this.sql`OFFSET
                        ${offset}`
            : this.sql``
        }
        ${
          limit !== undefined
            ? this.sql`LIMIT
                        ${limit}`
            : this.sql``
        }
    `;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async queryCount(sql: postgres.PendingQuery<any[]>): Promise<number> {
    const row = (
      await this.sql`SELECT COUNT(*)
                     FROM (${sql}) AS count_table`
    ).at(0);
    if (row === undefined) {
      throw new Error("no row returned while count");
    }
    console.log(row);
    return row["0"];
  }

  private genRelatedTrxsQuery({ accountId, ...rest }: TParams_GetAccountRelatedTrxsWithPagination) {
    console.log("making postgres query", { accountId, ...rest });
    // Use UNION but not WHERE & OR to hit the index
    return this.sql<INearIndexer_Transaction[]>`
        SELECT *
        FROM transactions
        WHERE transaction_hash IN (SELECT originated_from_transaction_hash
                                   FROM receipts
                                   WHERE receipt_id IN (SELECT emitted_for_receipt_id
                                                        FROM assets__fungible_token_events
                                                        WHERE token_old_owner_account_id = ${accountId}
                                                           OR token_new_owner_account_id = ${accountId}

                                                        UNION DISTINCT

        SELECT emitted_for_receipt_id
        FROM assets__non_fungible_token_events
        WHERE token_old_owner_account_id = ${accountId}
           OR token_new_owner_account_id = ${accountId} )
      )

        UNION
        DISTINCT

        SELECT *
        FROM transactions
        WHERE signer_account_id = ${accountId}
           OR receiver_account_id = ${accountId}

        ORDER BY block_timestamp DESC
            ${this.genPaginationQuery(rest)}
    `;
  }

  async close(): Promise<void> {
    await this.sql.end({ timeout: 5 });
  }
}
