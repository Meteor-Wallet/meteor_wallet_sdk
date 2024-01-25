import { EBlockchain } from "./blockchain.enums";
import { IUniqueAccountProps } from "../account/account.interfaces.ts";
import { TBlockchainNetworkId } from "./network/blockchain_network.types.ts";

export interface IUniqueBlockchainProps {
  id: EBlockchain;
}

export interface IOCreateBasicAccount_Input
  extends Omit<IUniqueAccountProps, "genericNetworkId" | "customNetworkId" | "blockchainId"> {
  networkId: TBlockchainNetworkId;
}
