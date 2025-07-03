import { GraphQLClient } from "graphql-request";
import { ENearNetwork } from "../../../near/types/near_basic_types";
import { NearBlocks_GqlConfig } from "./NearBlocks_GqlConfig";

const testnetConfig = NearBlocks_GqlConfig["testnet"];
const mainnetConfig = NearBlocks_GqlConfig["mainnet"];

export const NearBlocks_GqlClient = {
  [ENearNetwork.testnet]: new GraphQLClient(testnetConfig.endpoint, {
    headers: testnetConfig.headers,
  }),
  [ENearNetwork.mainnet]: new GraphQLClient(mainnetConfig.endpoint, {
    headers: mainnetConfig.headers,
  }),
};
