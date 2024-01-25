// @ts-nocheck

import { Account } from "../../core/account/Account";
import { Signer } from "../../core/keys_and_signers/signers/Signer";
import { EthereumBlockchain } from "./EthereumBlockchain";
import { TransactionExecutionPlan } from "../../core/transactions/TransactionExecutionPlan";
import { BasicAccount } from "../../core/account/BasicAccount";
import { AccountFeatureManager } from "../../core/account/features/AccountFeatureManager.ts";
import { PubSub } from "../../core/utility/pubsub/PubSub";
import { IPubSub_Account } from "../../core/account/Account.pubsub";
import { EGenericBlockchainNetworkId } from "../../core/blockchain/network/blockchain_network.enums";
import { BlockchainTransaction } from "../../core/transactions/BlockchainTransaction";
import { ListManager } from "../../core/utility/managers/list_manager/ListManager";
import { IOrdIdentifiable } from "../../core/utility/managers/list_manager/list_manager.interfaces";
import { getNetworkIdFromProps } from "../../core/blockchain/network/blockchain_network.utils.ts";

export class EthereumAccount extends Account {
  basic: BasicAccount;
  features: AccountFeatureManager<any> = {} as any;
  pubSub: PubSub<IPubSub_Account> = new PubSub<IPubSub_Account>();
  blockchain: EthereumBlockchain;

  constructor({
    signers,
    blockchain,
    id,
    customNetworkId,
    genericNetworkId,
  }: {
    id: string;
    signers: any[];
    blockchain: EthereumBlockchain;
    genericNetworkId: EGenericBlockchainNetworkId;
    customNetworkId?: string;
  }) {
    super();
    this.blockchain = blockchain;
    this.basic = this.blockchain.createBasicAccount({
      id,
      networkId: getNetworkIdFromProps({
        genericNetworkId,
        customNetworkId,
      }),
    });
    this.signers.addMultiple(signers);
  }

  transactionExecutionPlans: ListManager<TransactionExecutionPlan, IOrdIdentifiable> =
    new ListManager<TransactionExecutionPlan, IOrdIdentifiable>();

  planTransactions(transactions: BlockchainTransaction[]): TransactionExecutionPlan {
    throw new Error("Method not implemented.");
  }
}
