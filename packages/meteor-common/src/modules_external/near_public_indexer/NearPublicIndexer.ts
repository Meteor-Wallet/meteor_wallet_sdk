import { ENearNetwork } from "../near/types/near_basic_types";
import { NearPublicIndexer_PostgresClient } from "./clients/postgres/NearPublicIndexer_PostgresClient";

const clients: {
  [key in ENearNetwork]?: NearPublicIndexer_PostgresClient;
} = {};
function getClient(network: ENearNetwork): NearPublicIndexer_PostgresClient {
  if (clients[network] == null) {
    clients[network] = new NearPublicIndexer_PostgresClient(network);
  }

  return clients[network]!;
}

export const NearPublicIndexer = {
  getClient,
};
