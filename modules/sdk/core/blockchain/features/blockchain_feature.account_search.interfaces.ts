import { PublicKey } from "../../keys_and_signers/keys/PublicKey.ts";
import { BasicAccount } from "../../account/BasicAccount.ts";
import { IBlockchainFeature } from "./blockchain_feature.interfaces.ts";
import { TBlockchainNetworkId } from "../network/blockchain_network.types.ts";

export interface IOSearchFromPublicKey<P extends PublicKey = PublicKey> {
  publicKey: P;
  networkId: TBlockchainNetworkId;
}

export interface IBlockchainAccountSearchFeature extends IBlockchainFeature {
  searchFromPublicKey: (inputs: IOSearchFromPublicKey) => Promise<BasicAccount[]>;
}
