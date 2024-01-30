import { EBlockchain } from "./blockchain.enums";
import { IUniqueAccountProps } from "../account/account.interfaces.ts";
import { TBlockchainNetworkId } from "./network/blockchain_network.types.ts";
import { IBlockchainFeatureMap } from "./features/blockchain_feature.interfaces.ts";

export interface IUniqueBlockchainProps {
  id: EBlockchain;
}

export interface IBlockchainFunctions {
  getFeature: <T extends keyof IBlockchainFeatureMap>(featureId: T) => IBlockchainFeatureMap[T];
  supportsFeature: <T extends keyof IBlockchainFeatureMap>(featureId: T) => boolean;
}

export interface IOCreateBasicAccount_Input
  extends Omit<IUniqueAccountProps, "genericNetworkId" | "customNetworkId" | "blockchainId"> {
  networkId: TBlockchainNetworkId;
}
