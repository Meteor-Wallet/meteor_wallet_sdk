export interface INearBlockHeader {
  approvals: (string | null)[];
  block_merkle_root: string;
  block_ordinal: number;
  challenges_result: [];
  challenges_root: string;
  chunk_headers_root: string;
  chunk_mask: [boolean, boolean, boolean, boolean];
  chunk_receipts_root: string;
  chunk_tx_root: string;
  chunks_included: number;
  epoch_id: string;
  epoch_sync_data_hash: null | string;
  gas_price: string;
  hash: string;
  height: number;
  last_ds_final_block: string;
  last_final_block: string;
  latest_protocol_version: number;
  next_bp_hash: string;
  next_epoch_id: string;
  outcome_root: string;
  prev_hash: string;
  prev_height: number;
  prev_state_root: string;
  random_value: string;
  rent_paid: string;
  signature: string;
  timestamp: number;
  timestamp_nanosec: string;
  total_supply: string;
  validator_proposals: any[];
  validator_reward: string;
}

export interface INearChunkHeader {
  balance_burnt: string;
  chunk_hash: string;
  encoded_length: number;
  encoded_merkle_root: string;
  gas_limit: number;
  gas_used: number;
  height_created: number;
  height_included: number;
  outcome_root: string;
  outgoing_receipts_root: string;
  prev_block_hash: string;
  prev_state_root: string;
  rent_paid: string;
  shard_id: number;
  signature: string;
  tx_root: string;
  validator_proposals: any[];
  validator_reward: string;
}

export interface INearReceiptOutputDataReceiver {
  data_id: string;
  receiver_id: string;
}

export interface INearAccessKeyPermission_FunctionCall {
  FunctionCall: {
    allowance: string;
    method_names: string[];
    receiver_id: string;
  };
}

export type TNearAccessKeyPermission = "FullAccess" | INearAccessKeyPermission_FunctionCall;

export interface INearAccessKeyData {
  nonce: number;
  permission: TNearAccessKeyPermission;
}

export interface INearAction_FunctionCall {
  FunctionCall: {
    args: string;
    deposit: string;
    gas: number;
    method_name: string;
  };
}

export interface INearAction_DeleteAccount {
  DeleteAccount: {
    beneficiary_id: string;
  };
}

export interface INearAction_DeleteKey {
  DeleteKey: {
    public_key: string;
  };
}

export interface INearAction_Stake {
  Stake: {
    // Amount to stake
    stake: string;
    // Validator public key
    public_key: string;
  };
}

export interface INearAction_DeployContract {
  DeployContract: {
    // Code to deploy
    code: Uint8Array;
  };
}

export interface INearAction_AddKey {
  AddKey: {
    access_key: INearAccessKeyData;
    // Uses format: "ed25519:7bpdsRxu6uMntTgCjynZitX1Rcc5YGp9AnVxWQM7jg5Q"
    public_key: string;
  };
}

export interface INearAction_Transfer {
  Transfer: {
    deposit: string;
  };
}

export type TNearAction_CreateAccount = "CreateAccount";

export type TNearAction =
  | TNearAction_CreateAccount
  | INearAction_FunctionCall
  | INearAction_AddKey
  | INearAction_DeleteKey
  | INearAction_DeleteAccount
  | INearAction_Stake
  | INearAction_Transfer
  | INearAction_DeployContract;

export interface INearTransaction {
  actions: TNearAction[];
  // e.g. "7LQ5hCqpn2R8cAznjDHMEx1jwyJSXSAYyc1bjzF8arfA"
  hash: string;
  nonce: number;
  // e.g. ed25519:4WkDmTcBuGmQMoCnjQBSz9enuNN9iLkvDznBokCiCHdz
  public_key: string;
  receiver_id: string;
  // e.g. ed25519:Cd8gYcmwEJZuqkrMpaCAXQSxEQRxkHGUM8T5UW8dzVkG6aCAknXjffQT8LucBdgwV8J8opkRtXykDc7nTzbzkwS
  signature: string;
  signer_id: string;
}

export interface INearReceiptAction {
  actions: TNearAction[];
  gas_price: string;
  input_data_ids: string[];
  output_data_receivers: INearReceiptOutputDataReceiver[];
  signer_id: string;
  // e.g.: "ed25519:Btd7AuoryQgTf2sKS7uuCSd9anSHeJUu41bHugcXkwsm"
  signer_public_key: string;
}

export interface INearReceiptInnerData {
  Action: INearReceiptAction;
}

export enum EGasCostType {
  FUNCTION_CALL = "FUNCTION_CALL",
  NEW_RECEIPT = "NEW_RECEIPT",
  BASE = "BASE",
  CONTRACT_LOADING_BASE = "CONTRACT_LOADING_BASE",
  CONTRACT_LOADING_BYTES = "CONTRACT_LOADING_BYTES",
  LOG_BASE = "LOG_BASE",
  LOG_BYTE = "LOG_BYTE",
  PROMISE_RETURN = "PROMISE_RETURN",
  READ_MEMORY_BASE = "READ_MEMORY_BASE",
  READ_MEMORY_BYTE = "READ_MEMORY_BYTE",
  READ_REGISTER_BASE = "READ_REGISTER_BASE",
  READ_REGISTER_BYTE = "READ_REGISTER_BYTE",
  UTF8_DECODING_BASE = "UTF8_DECODING_BASE",
  UTF8_DECODING_BYTE = "UTF8_DECODING_BYTE",
  WASM_INSTRUCTION = "WASM_INSTRUCTION",
  WRITE_MEMORY_BASE = "WRITE_MEMORY_BASE",
  WRITE_MEMORY_BYTE = "WRITE_MEMORY_BYTE",
  WRITE_REGISTER_BASE = "WRITE_REGISTER_BASE",
  WRITE_REGISTER_BYTE = "WRITE_REGISTER_BYTE",
  STORAGE_READ_BASE = "STORAGE_READ_BASE",
  STORAGE_READ_KEY_BYTE = "STORAGE_READ_KEY_BYTE",
  STORAGE_READ_VALUE_BYTE = "STORAGE_READ_VALUE_BYTE",
  STORAGE_WRITE_BASE = "STORAGE_WRITE_BASE",
  STORAGE_WRITE_EVICTED_BYTE = "STORAGE_WRITE_EVICTED_BYTE",
  STORAGE_WRITE_KEY_BYTE = "STORAGE_WRITE_KEY_BYTE",
  STORAGE_WRITE_VALUE_BYTE = "STORAGE_WRITE_VALUE_BYTE",
  TOUCHING_TRIE_NODE = "TOUCHING_TRIE_NODE",
  ECRECOVER_BASE = "ECRECOVER_BASE",
  KECCAK256_BASE = "KECCAK256_BASE",
  KECCAK256_BYTE = "KECCAK256_BYTE",
}

export enum EGasCostCategory {
  ACTION_COST = "ACTION_COST",
  WASM_HOST_COST = "WASM_HOST_COST",
}

export interface INearExecutionGasProfileItem {
  cost: EGasCostType | string;
  cost_category: EGasCostCategory | string;
  gas_used: string;
}

export interface INearExecutionOutcomeMetadata {
  gas_profile: INearExecutionGasProfileItem[] | null;
  version: number;
}

export interface INearExecutionOutcomeStatus_SuccessValue {
  SuccessValue: string;
}

export interface INearExecutionOutcomeStatus_SuccessReceiptId {
  SuccessReceiptId: string;
}

export type TNearActionErrorKind = {
  FunctionCallError: {
    ExecutionError: string;
  };
};

export interface INearExecutionError_ActionError {
  ActionError: {
    index: number;
    kind: TNearActionErrorKind;
  };
}

export interface INearExecutionOutcomeStatus_Failure {
  Failure: INearExecutionError_ActionError | {};
}

export type TNearExecutionOutcomeStatus_Success =
  | INearExecutionOutcomeStatus_SuccessValue
  | INearExecutionOutcomeStatus_SuccessReceiptId;

export type TNearExecutionOutcomeStatus =
  | TNearExecutionOutcomeStatus_Success
  | INearExecutionOutcomeStatus_Failure;

export interface INearExecutionOutcomeInnerData {
  // e.g. "6d6bef6c2401bf00c00da2baa0e2377bb8719042143060ee0aa673182b51135e"
  executor_id: string;
  gas_burnt: number;
  logs: string[];
  metadata: INearExecutionOutcomeMetadata;
  receipt_ids: string[];
  status: TNearExecutionOutcomeStatus;
  tokens_burnt: string;
}

export enum ENearProofDirection {
  Right = "Right",
  Left = "Left",
}

export interface INearProof {
  direction: ENearProofDirection;
  hash: string;
}

export interface INearExecutionOutcome {
  block_hash: string;
  // e.g. "AW8pc5FA6arhtcW7zGDnyKKknZVnVGEdjvppYEJmyvMX"
  id: string;
  outcome: INearExecutionOutcomeInnerData;
  proof: INearProof[];
}

export interface INearChunkTransactionOutcome {
  execution_outcome: INearExecutionOutcome;
  receipt: null;
}

export interface INearChunkTransaction {
  transaction: INearTransaction;
  outcome: INearChunkTransactionOutcome;
}

export interface INearChunkReceipt {
  predecessor_id: string;
  receipt: INearReceiptInnerData;
  receipt_id: string;
  receiver_id: string;
}

export interface INearChunk {
  author: string;
  header: INearChunkHeader;
  receipts: INearChunkReceipt[];
  transactions: INearChunkTransaction[];
}

export interface INearShard {
  chunk: INearChunk;
}

export interface INearBlock {
  author: string;
  chunks: INearChunkHeader[];
  header: INearBlockHeader;
}

/*******************************************
 * Started Copying Near Datatype here with a prefix of Near
 **********************************************/
export interface INear_ExecutionError {
  error_message: string;
  error_type: string;
}
export enum INear_FinalExecutionStatusBasic {
  NotStarted = "NotStarted",
  Started = "Started",
  Failure = "Failure",
}

export enum INear_ExecutionStatusBasic {
  Unknown = "Unknown",
  Pending = "Pending",
  Failure = "Failure",
}

export interface INear_ExecutionStatus {
  SuccessValue?: string;
  SuccessReceiptId?: string;
  Failure?: INear_ExecutionError;
}
export interface INear_ExecutionOutcome {
  logs: string[];
  receipt_ids: string[];
  gas_burnt: number;
  tokens_burnt: string;
  executor_id: string;
  status: INear_ExecutionStatus | INear_ExecutionStatusBasic;
}
export interface INear_ExecutionOutcomeWithId {
  id: string;
  outcome: INear_ExecutionOutcome;
}

export interface INear_FinalExecutionStatus {
  SuccessValue?: string;
  Failure?: INear_ExecutionError;
}
export interface INear_FinalExecutionOutcome {
  status: INear_FinalExecutionStatus | INear_FinalExecutionStatusBasic;
  transaction: any;
  transaction_outcome: INear_ExecutionOutcomeWithId;
  receipts_outcome: INear_ExecutionOutcomeWithId[];
}
