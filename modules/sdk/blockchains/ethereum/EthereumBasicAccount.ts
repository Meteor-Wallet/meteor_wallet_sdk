// @ts-nocheck

import { BasicAccount } from "../../core/account/BasicAccount";
import { PubSub } from "../../core/utility/pubsub/PubSub";
import { IPubSub_BasicAccount } from "../../core/account/BasicAccount.pubsub";
import { EBlockchain } from "../../core/blockchain/blockchain.enums";
import { IUniqueAccountProps } from "../../core/account/account.interfaces";
import { EthereumBlockchain } from "./EthereumBlockchain";
import { AccountFeatureManager } from "../../core/account/features/AccountFeatureManager.ts";

export class EthereumBasicAccount extends BasicAccount {
  blockchain: EthereumBlockchain;
  pubSub: PubSub<IPubSub_BasicAccount> = new PubSub<IPubSub_BasicAccount>();
  blockchainId: EBlockchain.ethereum = EBlockchain.ethereum;
  features: AccountFeatureManager<any> = {} as any;

  constructor(inputs: IUniqueAccountProps & { blockchain: EthereumBlockchain }) {
    super(inputs);
    this.blockchain = inputs.blockchain;
  }
}
