// @ts-nocheck

import { Blockchain } from "../../core/blockchain/Blockchain";
import { EBlockchain } from "../../core/blockchain/blockchain.enums";
import { EthereumAccountBuilder } from "./EthereumAccountBuilder";
import { RpcProvider } from "../../core/blockchain/network/RpcProvider";
import { EthereumBasicAccount } from "./EthereumBasicAccount";
import { TBlockchainNetworkId } from "../../core/blockchain/network/blockchain_network.types.ts";
import { IOCreateBasicAccount_Input } from "../../core/blockchain/blockchain.interfaces.ts";
import { convertNetworkIdToUniqueProps } from "../../core/blockchain/network/blockchain_network.utils.ts";

export class EthereumBlockchain extends Blockchain {
  id = EBlockchain.ethereum;

  getRpcProvider(networkId: TBlockchainNetworkId): RpcProvider {
    throw new Error("Not ready");
  }

  getAccountBuilder(): EthereumAccountBuilder {
    return new EthereumAccountBuilder({ blockchain: this });
  }

  createBasicAccount({ id, networkId }: IOCreateBasicAccount_Input): EthereumBasicAccount {
    return new EthereumBasicAccount({
      blockchain: this,
      blockchainId: this.id,
      id,
      ...convertNetworkIdToUniqueProps(networkId),
    });
  }

  addRpcProvider(rpcProvider: RpcProvider): void {}
}
