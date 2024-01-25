import { gql } from "graphql-request";
import { MeteorInternalError } from "../../../../core/errors/MeteorError.ts";
import { IndexerGraphQLClient } from "./IndexerGraphQLClient.ts";
import { INftCollection } from "./indexer_xyz.types.ts";

export class IndexerXyzApi {
  constructor() {}

  async getNfts(accountId: string): Promise<INftCollection[]> {
    const res = IndexerGraphQLClient.request(
      gql`
        query AllNFTs($account_id: String!) {
          near {
            collections(where: { nfts: { owner: { _eq: $account_id } } }) {
              id
              title
              description
              cover_url
              floor
              contract {
                key
              }
              totalCount: nfts_aggregate(where: { owner: { _eq: $account_id } }) {
                aggregate {
                  count
                }
              }
              nfts(where: { owner: { _eq: $account_id } }) {
                id
                name
                media_url
                attributes {
                  type
                  value
                }
                collection {
                  description
                }
              }
            }
          }
        }
      `,
      {
        account_id: accountId,
      },
    )
      .then((res: any) => res.near.collections as INftCollection[])
      .catch((err) => {
        const message = `An error has occurred: ${err.status}`;
        throw new MeteorInternalError(`IndexerXyzApi.getNfts() ${message}`);
      });

    return res;
  }
}

const clients: {
  api?: IndexerXyzApi;
} = {};

export const getIndexerXyzApi = (): IndexerXyzApi => {
  if (!clients.api) {
    clients.api = new IndexerXyzApi();
  }

  return clients.api;
};
