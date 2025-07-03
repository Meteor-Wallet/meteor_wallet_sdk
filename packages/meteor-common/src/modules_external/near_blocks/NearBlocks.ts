import { nearBlocks_dataAdapters_transactions } from "./adapters/nearBlocks_dataAdapters_transactions";
import { nearBlocks_api1_gqlQuery_getRelatedTransactionsWithActions } from "./clients/graphql-api1/queries/nearBlocks_api1_gqlQuery_getRelatedTransactionsWithActions";
import { nearBlocks_api1_gqlQuery_getTransactionWithActions } from "./clients/graphql-api1/queries/nearBlocks_api1_gqlQuery_getTransactionWithActions";
import { nearBlocks_api2_gqlQuery_getRelatedTransactionsWithActions } from "./clients/graphql-api2/queries/nearBlocks_api2_gqlQuery_getRelatedTransactionsWithActions";

export const NearBlocks = {
  dataAdapters: {
    transactions: nearBlocks_dataAdapters_transactions,
  },
  async_functions: {
    api1_getRelatedTransactionsWithActions:
      nearBlocks_api1_gqlQuery_getRelatedTransactionsWithActions.executeQuery,
    api1_getTransactionWithActions: nearBlocks_api1_gqlQuery_getTransactionWithActions.executeQuery,
    api2_getRelatedTransactionsWithActions:
      nearBlocks_api2_gqlQuery_getRelatedTransactionsWithActions.executeQuery,
  },
};
