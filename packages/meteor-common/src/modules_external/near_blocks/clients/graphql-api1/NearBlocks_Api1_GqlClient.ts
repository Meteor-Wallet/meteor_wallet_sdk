import { GraphQLClient } from "graphql-request";
import { ENearNetwork } from "../../../near/types/near_basic_types";
import { NearBlocks_Api1_GqlConfig } from "./NearBlocks_Api1_GqlConfig";

const testnetConfig = NearBlocks_Api1_GqlConfig["testnet"];
const mainnetConfig = NearBlocks_Api1_GqlConfig["mainnet"];

export const NearBlocks_Api1_GqlClient = {
  [ENearNetwork.testnet]: new GraphQLClient(testnetConfig.endpoint, {
    headers: testnetConfig.headers,
  }),
  [ENearNetwork.mainnet]: new GraphQLClient(mainnetConfig.endpoint, {
    headers: mainnetConfig.headers,
  }),
};
