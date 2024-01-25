import { TErrorId_Near } from "./MeteorErrorIds.near.ts";

export type TErrorId =
  | TErrorId_Near
  | EErrorId_GenericSdk
  | EErrorId_GenericApi
  | EErrorId_Security
  | EErrorId_Transaction
  | EErrorId_BlockchainNetwork
  | EErrorId_BlockchainFeature_AccountSearch
  // | EErrorId_BlockchainFeature_TestAccount
  | EErrorId_Account
  | EErrorId_AccountFeature
  | EErrorId_Key
  | EErrorId_Signer
  | EErrorId_ListManager
  | EErrorId_AccountBuilder
  | EErrorId_Blockchain
  | EErrorId_Contract
  | EErrorId_Token
  | EErrorId_Sdk
  | EErrorId_BlockchainFeature_CustomId
  | EErrorId_BlockchainFeature_CustomId_Formatting;

export enum EErrorId_Sdk {
  no_blockchains_with_available_networks = "no_blockchains_with_available_networks",
}

export enum EErrorId_GenericSdk {
  not_supported_yet = "not_supported_yet",
}

export enum EErrorId_GenericApi {
  request_failed = "request_failed",
}

export enum EErrorId_Security {
  security_method_not_enabled = "security_method_not_enabled",
  security_method_not_initialized = "security_method_not_initialized",
  password_incorrect = "password_incorrect",
  biometric_key_failed = "biometric_key_failed",
}

export enum EErrorId_Transaction {
  transaction_sender_is_not_full_account = "transaction_sender_is_not_full_account",
  transaction_receiver_is_not_full_account = "transaction_receiver_is_not_full_account",
}

export enum EErrorId_Blockchain {
  rpc_provider_not_found = "rpc_provider_not_found",
  blockchain_not_found = "blockchain_not_found",
  no_blockchains_added = "no_blockchains_added",
  blockchain_feature_not_supported = "blockchain_feature_not_supported",
}

export enum EErrorId_BlockchainFeature_AccountSearch {
  network_not_supported_for_account_search = "network_not_supported_for_account_search",
}

export enum EErrorId_BlockchainFeature_CustomId {
  network_custom_id_info_unknown = "network_custom_id_info_unknown",
}

export enum EErrorId_BlockchainFeature_CustomId_Formatting {
  invalid_account_id_format = "invalid_account_id_format",
  invalid_account_id_format_bad_characters = "invalid_account_id_format_bad_characters",
  invalid_account_id_format_unknown_network_format = "invalid_account_id_format_unknown_network_format",
  invalid_account_id_format_network_mismatch = "invalid_account_id_format_network_mismatch",
  invalid_account_id_format_too_short = "invalid_account_id_format_too_short",
  invalid_account_id_format_too_long = "invalid_account_id_format_too_long",
}

export enum EErrorId_Contract {
  contract_method_not_found = "contract_method_not_found",
}

export enum EErrorId_Token {
  invalid_token_contract = "invalid_token_contract",
}

export enum EErrorId_BlockchainNetwork {
  blockchain_has_no_networks = "blockchain_has_no_networks",
  blockchain_has_no_available_networks = "blockchain_has_no_available_networks",
  blockchain_network_id_not_found = "blockchain_network_id_not_found",
  no_blockchain_endpoint_enabled_for_id = "no_blockchain_endpoint_enabled_for_id",
  incorrect_blockchain_for_network = "incorrect_blockchain_for_network",
  incorrect_network_for_endpoint = "incorrect_network_for_endpoint",
}

export enum EErrorId_Account {
  account_already_exists_in_core = "account_already_exists_in_core",
  account_not_found_in_core = "account_not_found_in_core",
  account_no_signers = "account_no_signers",
  no_accounts_in_core = "no_accounts_in_core",
  account_not_found_on_chain = "account_not_found_on_chain",
  account_already_exists_on_chain = "account_already_exists_on_chain",
}

export enum EErrorId_AccountBuilder {
  account_builder_no_network = "account_builder_no_network",
  account_builder_no_id = "account_builder_no_id",
  account_builder_no_signers = "account_builder_no_signers",
}

export enum EErrorId_AccountFeature {
  account_feature_unknown_id = "account_feature_unknown_id",
  account_feature_not_supported = "account_feature_not_supported",
}

export enum EErrorId_Key {
  public_key_id_not_supported = "public_key_id_not_supported",
}

export enum EErrorId_Signer {
  signer_origin_already_exists = "signer_origin_already_exists",
  signer_origin_not_supported_on_blockchain = "signer_origin_not_supported_on_blockchain",
  signer_origin_cannot_create_private_key = "signer_origin_cannot_create_private_key",
  signer_origin_cannot_create_public_key = "signer_origin_cannot_create_public_key",
  blockchain_does_not_support_signer_origins = "blockchain_does_not_support_signer_origins",
}

export enum EErrorId_ListManager {
  list_is_empty = "list_is_empty",
  list_item_not_found = "list_item_not_found",
  list_item_already_exists = "list_item_already_exists",
}

export const ErrorIdReference = {
  security: { ...EErrorId_Security },
  account: { ...EErrorId_Account },
  account_feature: { ...EErrorId_AccountFeature },
};

export const allErrorIds = {
  ...EErrorId_Blockchain,
  ...EErrorId_Security,
  ...EErrorId_BlockchainNetwork,
  ...EErrorId_Account,
  ...EErrorId_AccountFeature,
  ...EErrorId_Key,
  ...EErrorId_Signer,
  ...EErrorId_ListManager,
  ...EErrorId_AccountBuilder,
};
