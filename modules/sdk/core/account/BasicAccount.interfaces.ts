import { BasicAccount } from "./BasicAccount.ts";
import { EBlockchain } from "../blockchain/blockchain.enums.ts";
import { EGenericBlockchainNetworkId } from "../blockchain/network/blockchain_network.enums.ts";

export interface IBasicAccountEditableProps extends Pick<BasicAccount, "label"> {}

export interface IBasicAccountStorableData {
  blockchainId: EBlockchain;
  genericNetworkId: EGenericBlockchainNetworkId;
  customNetworkId?: string;
  id: string;
  label?: string;
}
