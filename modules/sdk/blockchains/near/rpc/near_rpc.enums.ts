export enum ENearRpc_MethodType {
  query = "query",
  block = "block",
  gas_price = "gas_price",
  status = "status",
  network_info = "network_info",
  validators = "validators",
  broadcast_tx_async = "broadcast_tx_async",
  broadcast_tx_commit = "broadcast_tx_commit",
  tx = "tx",
  EXPERIMENTAL_changes = "EXPERIMENTAL_changes",
  EXPERIMENTAL_tx_status = "EXPERIMENTAL_tx_status",
  EXPERIMENTAL_receipt = "EXPERIMENTAL_receipt",
  EXPERIMENTAL_genesis_config = "EXPERIMENTAL_genesis_config",
  EXPERIMENTAL_protocol_config = "EXPERIMENTAL_protocol_config",
}

export enum ENearRpc_ViewRequestType {
  view_access_key = "view_access_key",
  view_access_key_list = "view_access_key_list",
  call_function = "call_function",
  block = "block",
}

export enum ENearRpc_Finality {
  final = "final",
  optimistic = "optimistic",
}

export enum ENearApiRpc_ErrorCauseName {
  /** The requested account_id has not been found while viewing since
   *  the account has not been created or has been already deleted */
  UNKNOWN_ACCOUNT = "UNKNOWN_ACCOUNT",
  /** The requested block has not been produced yet or it has been
   *  garbage-collected (cleaned up to save space on the RPC node) */
  UNKNOWN_BLOCK = "UNKNOWN_BLOCK",
  /** The requested account_id is invalid */
  INVALID_ACCOUNT = "INVALID_ACCOUNT",
  /** The node was unable to find the requested data because it
   *  does not track the shard where data is present */
  UNAVAILABLE_SHARD = "UNAVAILABLE_SHARD",
  /** The node is still syncing and the requested block is not in the database yet */
  NO_SYNCED_BLOCKS = "NO_SYNCED_BLOCKS",
  /** Passed arguments can't be parsed by JSON RPC server (missing arguments, wrong format, etc.) */
  PARSE_ERROR = "PARSE_ERROR",
  /** Something went wrong with the node itself or overloaded */
  INTERNAL_ERROR = "INTERNAL_ERROR",
}
