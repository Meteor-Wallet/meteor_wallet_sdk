import { IBlockchainFeature } from "./blockchain_feature.interfaces.ts";
import { Token } from "../../assets/token/Token.ts";
import { TBlockchainNetworkId } from "../network/blockchain_network.types.ts";
import { ListManager } from "../../utility/managers/list_manager/ListManager.ts";

export interface IBlockchainTokenFeature extends IBlockchainFeature {
  tokens: ListManager<Token>;
  getToken: (contract: { id: string; networkId: TBlockchainNetworkId }) => Promise<Token>;
}
