import { EBlockchain } from "../blockchain/blockchain.enums";

import { EGenericBlockchainNetworkId } from "../blockchain/network/blockchain_network.enums";
import { BasicAccount } from "./BasicAccount";

export interface IUniqueAccountProps {
  // The blockchain of this account
  blockchainId: EBlockchain;
  // The generic network of this account
  genericNetworkId: EGenericBlockchainNetworkId;
  // Custom network ID, if there is one (generic network ID = custom)
  customNetworkId?: string;
  // ID representation as expected natively for this blockchain
  id: string;
}

export interface IWithBasicAccount<A extends BasicAccount = BasicAccount> {
  basic: A;
}

export interface IWithBasicAccountProps {
  basic: IUniqueAccountProps;
}

export interface IAccountStorableData {
  blockchainId: EBlockchain;
  genericNetworkId: EGenericBlockchainNetworkId;
  customNetworkId?: string;
  id: string;
  label?: string;
}
