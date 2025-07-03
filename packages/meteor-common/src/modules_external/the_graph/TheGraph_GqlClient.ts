import { GraphQLClient } from "graphql-request";

const TheGraph_GqlConfig = {
  endpoint: "https://api.thegraph.com/subgraphs/name/inscriptionnear/neat",
  headers: {
    "content-type": "application/json",
  },
};

export const TheGraph_GqlClient = new GraphQLClient(TheGraph_GqlConfig.endpoint, {
  headers: TheGraph_GqlConfig.headers,
});
