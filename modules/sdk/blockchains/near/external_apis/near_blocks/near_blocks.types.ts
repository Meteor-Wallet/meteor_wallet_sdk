export interface INearBlocks_BaseTransaction {
  transaction_hash: string;
  included_in_block_hash: string;
  block_timestamp: string;
  block: {
    block_height: number;
  };
  outcomes: {
    status: boolean;
  };
}

// First interface extending from the base interface
export interface INearBlocks_GeneralTransaction extends INearBlocks_BaseTransaction {
  receipt_id: string;
  predecessor_account_id: string;
  receiver_account_id: string;
  actions: Array<{
    action: string;
    method: null | string;
  }>;
  actions_agg: {
    deposit: number;
  };
  outcomes_agg: {
    transaction_fee: number;
  };
  logs: any[];
}

// Second interface extending from the base interface
export interface INearBlocks_FtTransaction extends INearBlocks_BaseTransaction {
  key: string;
  token_old_owner_account_id: string;
  token_new_owner_account_id: string;
  amount: string;
  event_kind: string;
  ft: {
    contract: string;
    name: string;
    symbol: string;
    decimals: number;
    icon: string;
    reference: null | string;
  };
}

// Third interface extending from the base interface
export interface INearBlocks_NftTransaction extends INearBlocks_BaseTransaction {
  key: string;
  token_old_owner_account_id: string;
  token_new_owner_account_id: string;
  event_kind: string;
  token_id: string;
  nft: {
    contract: string;
    name: string;
    symbol: string;
    icon: string;
  };
}
