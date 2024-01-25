import { GraphQLClient } from "graphql-request";

export const IndexerGraphQLClient = new GraphQLClient("https://api.indexer.xyz/graphql", {
  headers: {
    "x-api-user": "Meteor",
    "x-api-key": "NDzSLjZ.20fd49b0843e5ad94e172e70f99ce848",
  },
});
