import { TNearStaticTokenDefinition } from "./near.token.interfaces.ts";
import { ENearFtSpec } from "./near.token.enums.ts";
import { TBlockchainNetworkId } from "../../../core/blockchain/network/blockchain_network.types.ts";
import { EGenericBlockchainNetworkId } from "../../../core/blockchain/network/blockchain_network.enums.ts";

const near_native_token: Omit<TNearStaticTokenDefinition, "genericNetworkId" | "customNetworkId"> =
  {
    id: "near",
    metadata: {
      spec: ENearFtSpec.native,
      name: "Near",
      symbol: "NEAR",
      icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAAXNSR0IArs4c6QAAA/1JREFUWEfVmV1IFFEUx/9X8bHdVtgPQ3vqg3CDHuohKwProYisDPqiqKhNjcCgMCgtygpMhQzLaIuKojLI0oh6KCELX/ShSIs+nnJJXcFt7THWG2fcGWfc2Zm507Zs93Hnnju/e878zzn3LoPN4XLnreBZWMk4FoPzeWCYBWBGfLlf4PgBxr5whj42gdeR0aE3dl7FRIwcbvecbJYdALADQL6ILYAQgHsxHguOj45+s2prCdDj8Xh/I+sUgEqrC5vMa83BxOlwODxitp4pYK7Xu49z1gTAabaY4PMoY/zI2MjIDSM7Q0CXx3clhV5LxtEaCQ8fTPYwKaDLk/cE4BsEvWJzOuuIhIc26hnrAqYXTsbSh0wATFNYLYdbAxgXxHWbcUqJGWN8v1o4CmA8lXz+B2oVBY/mYGK+nIIUQLPQLi8qQvmBANatXYNnz1/gUFUVotFxyy/fsW0rqo8ewffBQVxoaMLbnh4jW0XZEmC8Qnw1sujuegl/YaEy5UP/AFauWm0JkDbX+fiRkG2Mx+ZSxZEAXR5fPYBqo7eNjQwlPL73oA2Hqg4bQjqdDrx+9RKzCwo083K9eWabuxAJDx+TAQfNaqseIL3hRO1JtF4LJn3Z+bNnUBGg8q0dFgBDkfBwAaOuBIx3m21HDXi/7SG2b92imOzas1f6LqcPdWhpI+fqzihTLAACnBWzmd68GsZ5nQggLX75UrMCSWIpLSsDfZfyoNC+6+0FY8DO3XslUag3aQWQM1bLrFaN6YsTwNPH7YpwCHLRkiWKsu/evomFfj927t6jgIsCAqyDudy+j2BYIOpBmk+Q7/t64XA4JHPyIHnS6XCCANdvKtOkImFAjk/M5fH9tJKcky2+0F8oeVKGNFK2MCAQJcAYgCw7HpRtKAm3NF9UlqhvbEJ9Q2PCkjYAJ1ICSCSVBwIalVJ+JG+qh13AvwqxGsBM2TYAo38lElkone3toFxIdVZdEknZVA7pdxrCgJMisdY56y1OAiG4+w/bcLzmpARByu7ueoWC/MlDn6xsghUGpDRjN1FTV9PS3IzxX+MoLlmlSSfTlU1VhjwsCjiZqG2UOvIW1VgapZs267ZOtIE7t24qnyhB0m/ysFJJpFJHBi6Pz1azcDUYVEKrl6ampx/1HAuAk81CHFC43RoMhRJCqwepVrYg4FS7ZadhTRZaPUiqNMuKliqP+gcGUFxi3OxqGta4Fw0P6dQ6VZQHpMbz6rVgQhI2qkSk7PN1ddI3SKo+Xlur6Xx0bLUtP03I+EMTQWb0sVN2s9npziiUKXiWcE/z/119THnSWglMgddAnbPQ5VGaw23v+m2qJGXwBaYMmdFXwOpvLGMv0fWEkK6/If4AZZ4hlYPP4SgAAAAASUVORK5CYII=",
      reference: null,
      reference_hash: null,
      decimals: 24,
    },
    isNative: true,
    isBridged: false,
    decimals: 24,
  };

const near_token_bridged_overrides: {
  id: string;
  isBridged: boolean;
  symbol: string;
  name: string;
  networkId: TBlockchainNetworkId;
}[] = [
  {
    id: "dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near",
    symbol: "Bridged USDT",
    isBridged: true,
    name: "Bridged USDT",
    networkId: EGenericBlockchainNetworkId.mainnet,
  },
  {
    id: "usdt.fakes.testnet",
    symbol: "Bridged USDT",
    isBridged: true,
    name: "Bridged USDT",
    networkId: EGenericBlockchainNetworkId.testnet,
  },
  {
    id: "usdt.tether-token.near",
    symbol: "Native USDT",
    isBridged: false,
    name: "USDT",
    networkId: EGenericBlockchainNetworkId.mainnet,
  },
  {
    id: "usdtt.fakes.testnet",
    symbol: "Native USDT",
    isBridged: false,
    name: "USDT",
    networkId: EGenericBlockchainNetworkId.testnet,
  },
  {
    id: "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near",
    symbol: "Bridged USDC",
    name: "USDC.e",
    isBridged: true,
    networkId: EGenericBlockchainNetworkId.mainnet,
  },
  {
    id: "usdc.fakes.testnet",
    symbol: "Bridged USDC",
    name: "USDC.e",
    isBridged: true,
    networkId: EGenericBlockchainNetworkId.testnet,
  },
];

export const near_token_static = {
  near_native_token,
  near_token_bridged_overrides,
};
