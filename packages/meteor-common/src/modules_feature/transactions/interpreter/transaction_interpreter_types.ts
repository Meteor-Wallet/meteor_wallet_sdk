import { Transaction } from "@near-js/transactions";
import { INearTransaction } from "../../../modules_external/near/types/near_blockchain_data_types";
import {
  INearIndexer_Transaction_WithActions,
  TNearIndexer_TransactionAction_Stripped,
} from "../../../modules_external/near_public_indexer/types/near_indexer_transaction_types";

export interface INearBlockchainTransaction_Stripped
  extends Omit<INearTransaction, "nonce" | "public_key" | "hash" | "signature"> {}

export interface INearApiJsTransaction_Stripped
  extends Omit<Transaction, "nonce" | "publicKey" | "blockHash" | "encode"> {}

export type TNearIndexerAction_Stripped =
  | TNearIndexer_TransactionAction_Stripped
  | INearIndexerAction_NotFound;

export interface INearIndexerAction_NotFound {
  action_kind: "NOT_FOUND";
  args?: undefined;
}

export interface INearIndexerTransaction_Stripped
  extends Omit<
    INearIndexer_Transaction_WithActions,
    | "actions"
    | "index_in_chunk"
    | "transaction_hash"
    | "included_in_block_hash"
    | "included_in_chunk_hash"
    | "block_timestamp"
    | "converted_into_receipt_id"
    | "receipt_conversion_gas_burnt"
    | "receipt_conversion_tokens_burnt"
    | "nonce"
    | "signature"
    | "status"
    | "signer_public_key"
  > {
  actions: TNearIndexerAction_Stripped[];
}

export enum ETransactionAssetType {
  nft = "nft",
  ft = "ft",
  near = "near",
  wrap_near = "wrap_near",
}

interface ITransactionAssetMovement_Base {
  contractId: string;
  fromAccountId: string;
  toAccountId: string;
}

export interface ITransactionAssetMovement_Ft extends ITransactionAssetMovement_Base {
  type: ETransactionAssetType.ft | ETransactionAssetType.near | ETransactionAssetType.wrap_near;
  amount: string;
}

export interface ITransactionAssetMovement_Nft extends ITransactionAssetMovement_Base {
  type: ETransactionAssetType.nft;
  tokenId: string;
}

export type TTransactionAssetMovement =
  | ITransactionAssetMovement_Ft
  | ITransactionAssetMovement_Nft;
