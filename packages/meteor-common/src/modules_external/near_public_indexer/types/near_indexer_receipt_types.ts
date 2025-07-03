export interface INearIndexer_ExecutionOutcome {
  // like 424555062500
  gas_burnt: number;
  // like 42455506250000000000
  tokens_burnt: number;
}

export interface INearIndexer_BaseReceipt {
  receipt_id: string;
  included_in_block_hash: string;
  included_in_chunk_hash: string;
  index_in_chunk: number;
  // this is not good to use number  :(
  included_in_block_timestamp: number;
  predecessor_account_id: string;
  receiver_account_id: string;
  receipt_kind: string;
  originated_from_transaction_hash: string;
  execution_outcome: INearIndexer_ExecutionOutcome | null;
  // "assets__fungible_token_events": [],
  // "action_receipt_actions": [
  //     {
  //         "receipt_id": "5Cig91dwhEE5nwnDEHLF9TK1t67qZVcckC9n2eW8BcmY",
  //         "index_in_action_receipt": 0,
  //         "action_kind": "TRANSFER",
  //         "args": {
  //             "deposit": "50000000000000000000000"
  //         },
  //         "receipt_predecessor_account_id": "sweat_welcome.near",
  //         "receipt_receiver_account_id": "b8f3cc987cb211a03d6dca1fddf9e9631bda63e939237aa995afc8e6322497b8",
  //         "receipt_included_in_block_timestamp": 1654122710513281000,
  //         "__typename": "action_receipt_actions",
  //         "ft": null
  //     }
  // ]
}

export interface INearIndexer_ActionReceipt extends INearIndexer_BaseReceipt {
  receipt_kind: "ACTION";
  execution_outcome: INearIndexer_ExecutionOutcome;
}

export interface INearIndexer_DataReceipt extends INearIndexer_BaseReceipt {
  receipt_kind: "DATA";
  execution_outcome: null;
}

export type TNearIndexer_Receipt = INearIndexer_ActionReceipt | INearIndexer_DataReceipt;
