import {
  EErrorId_Account,
  EErrorId_AccountFeature,
  EErrorId_Blockchain,
  EErrorId_BlockchainFeature_AccountSearch,
  EErrorId_GenericApi,
  EErrorId_ListManager,
  EErrorId_Signer,
} from "./MeteorErrorIds";
import { SignerOrigin } from "../keys_and_signers/signer_origins/SignerOrigin";
import { EAccountFeature } from "../account/features/account_feature.enums.ts";
import { EBlockchainFeature } from "../blockchain/features/blockchain_feature.enums.ts";
import { TBlockchainNetworkId } from "../blockchain/network/blockchain_network.types.ts";
import { BasicAccount } from "../account/BasicAccount.ts";
import { EErrorId_Near_Rpc } from "./MeteorErrorIds.near.ts";
import {
  INearRpc_Error,
  IONearRpc_Query_CallFunction_Failure,
} from "../../blockchains/near/rpc/near_rpc.interfaces.ts";

export interface IErrorIdWithContextData {
  [EErrorId_Signer.signer_origin_already_exists]: {
    signerOrigin: SignerOrigin;
  };
  [EErrorId_ListManager.list_item_already_exists]: any;
  [EErrorId_AccountFeature.account_feature_not_supported]: EAccountFeature;
  [EErrorId_Blockchain.blockchain_feature_not_supported]: EBlockchainFeature;
  [EErrorId_BlockchainFeature_AccountSearch.network_not_supported_for_account_search]: TBlockchainNetworkId;
  [EErrorId_GenericApi.request_failed]: Response;
  [EErrorId_Account.account_already_exists_on_chain]: BasicAccount;
  [EErrorId_Account.account_not_found_on_chain]: BasicAccount;

  // Near Errors
  [EErrorId_Near_Rpc.near_call_function_failed]: IONearRpc_Query_CallFunction_Failure;
  [EErrorId_Near_Rpc.near_call_function_method_not_found]: IONearRpc_Query_CallFunction_Failure;
  [EErrorId_Near_Rpc.near_rpc_error]: INearRpc_Error;
}

export const meteorErrorContextCheck: {
  [key in keyof IErrorIdWithContextData]: boolean;
} = {
  [EErrorId_Signer.signer_origin_already_exists]: true,
  [EErrorId_ListManager.list_item_already_exists]: true,
  [EErrorId_AccountFeature.account_feature_not_supported]: true,
  [EErrorId_Blockchain.blockchain_feature_not_supported]: true,
  [EErrorId_BlockchainFeature_AccountSearch.network_not_supported_for_account_search]: true,
  [EErrorId_GenericApi.request_failed]: true,
  [EErrorId_Account.account_already_exists_on_chain]: true,
  [EErrorId_Account.account_not_found_on_chain]: true,
  [EErrorId_Near_Rpc.near_call_function_failed]: true,
  [EErrorId_Near_Rpc.near_call_function_method_not_found]: true,
  [EErrorId_Near_Rpc.near_rpc_error]: true,
};
