import { IBasicAccountTransactionFeature } from "../../../../core/account/features/account_feature.transactions.interfaces";
import { IWithBasicAccount } from "../../../../core/account/account.interfaces";
import { ListManager } from "../../../../core/utility/managers/list_manager/ListManager";
import { MeteorTransaction } from "../../../../core/transactions/MeteorTransaction";
import { EAccountFeature } from "../../../../core/account/features/account_feature.enums";
import { NearBasicAccount } from "../NearBasicAccount";
import { NearBlocksApi } from "../../external_apis/near_blocks/NearBlocksApi";
import { NearBlockchain } from "../../NearBlockchain";
import { NearFinalizedTransaction } from "../../transactions/NearFinalizedTransaction";
import { INearRPC_ExperimentalTxStatus_ResponseBody } from "../../rpc/near_rpc.interfaces";
import { NearTransaction } from "../../transactions/NearTransaction";

export class NearBasicAccountTransactionFeature implements IBasicAccountTransactionFeature {
  account: IWithBasicAccount<NearBasicAccount>;
  blockchain: NearBlockchain;
  id: EAccountFeature.transaction = EAccountFeature.transaction;
  // TODO: How to properly use ListManager
  transactionHistoryList: ListManager<MeteorTransaction>;

  constructor(account: IWithBasicAccount<NearBasicAccount>) {
    this.account = account;
    this.blockchain = account.basic.blockchain;
    this.transactionHistoryList = new ListManager<MeteorTransaction>();
  }

  getTransactionHistoryList(): Promise<NearFinalizedTransaction[]> {
    const nearblockApi = new NearBlocksApi();

    // Step 1: Begin by fetching the transaction history hashes for the account.
    return nearblockApi
      .getTransactionHistoryHashesByAccountId(this.account.basic.id)
      .then(async (res: string[]) => {
        // Step 2: Fetch detailed information for each transaction.
        const transactionWithDetails: INearRPC_ExperimentalTxStatus_ResponseBody[] = (
          await Promise.all(
            res.map(async (hash) => {
              // NOTE: Although the account owner might be a receiver for FT, which means he's not really involved in the transaction
              // It seems like the RPC method experimentalTxStatus doesn't actually care as long as hash is there
              // We might want to fix this in the future
              const response = await this.account.basic
                .getArchivalRpcProvider()
                .experimentalTxStatus({
                  transaction_hash: hash,
                  account_id: this.account.basic.id,
                });
              return response.result;
            }),
          )
        ).filter((x): x is INearRPC_ExperimentalTxStatus_ResponseBody => x !== undefined);

        // Step 3: Convert the RPC responses to NearFinalizedTransaction format.
        return transactionWithDetails.map(
          (rpcResponse: INearRPC_ExperimentalTxStatus_ResponseBody) => {
            const genericPayload = {
              blockchain: this.blockchain,
              blockchainId: this.blockchain.id,
              genericNetworkId: this.account.basic.genericNetworkId,
            };
            const sender = new NearBasicAccount({
              id: rpcResponse.transaction.signer_id,
              ...genericPayload,
            });
            const receiver = new NearBasicAccount({
              id: rpcResponse.transaction.receiver_id,
              ...genericPayload,
            });
            const nearTransaction = new NearTransaction({
              sender: { basic: sender },
              actions: rpcResponse.transaction.actions,
              receiver: { basic: receiver },
            });
            return new NearFinalizedTransaction({
              transaction: nearTransaction,
              rpcExperimentalTxResponse: rpcResponse,
            });
          },
        );
      });
  }

  getTransactionDetails(transactionId: string): Promise<MeteorTransaction> {
    return Promise.resolve({} as MeteorTransaction);
  }
}
