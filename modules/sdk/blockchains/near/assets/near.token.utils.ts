import { NearToken } from "./NearToken.ts";
import { convertNetworkIdToUniqueProps } from "../../../core/blockchain/network/blockchain_network.utils.ts";
import { NearBlockchain } from "../NearBlockchain.ts";
import { EBlockchain } from "../../../core/blockchain/blockchain.enums.ts";
import { near_token_static } from "./near.token.static.ts";

function createNearNativeToken(blockchain: NearBlockchain, networkId: string): NearToken {
  return new NearToken({
    ...convertNetworkIdToUniqueProps(networkId),
    isNative: true,
    blockchain,
    decimals: 24,
    blockchainId: EBlockchain.near,
    id: "near",
    metadata: near_token_static.near_native_token.metadata,
    isBridged: false,
  });
}

export const near_token_utils = {
  createNearNativeToken,
};
