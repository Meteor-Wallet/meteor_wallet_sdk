import { EBridgeTokenSymbol } from "../../modules_feature/bridge/bridge.types";
import { ERaffleTicketKey } from "../../modules_feature/campaign/campaign_enums";
import { EHM_UnionContractTypes } from "../../modules_feature/harvest_moon/harvest_moon_enums";
import { ENearNetwork } from "../near/types/near_basic_types";
import { EPoA_Blockchain } from "../near_intent/poaBridge.types";

export type MeteorApiSignedRequest<T = {}> = {
  walletSignedPayload: IMeteorBackendV2SignatureInfo;
  rpcUrl?: string;
} & T;

export interface IMeteorBackendSignedContent {
  payload: {
    message: string;
    nonce: string;
    recipient: string;
    callbackUrl?: string;
  };
  publicKey: string;
  signature: string;
}

export interface IMeteorBackendV2SignatureInfo {
  signedPayload: IMeteorBackendSignedContent;
  walletId: string;
  networkId: ENearNetwork;
}

export interface IGetRecruitShareImage_Input {
  intern: number;
  researcher: number;
  scientist: number;
  genius: number;
  brain: number;
  newRate: number;
  mph: number;
}

export interface IGetHarvestShareImage_Input {
  result: keyof typeof EHM_UnionContractTypes | "try_again";
  receipt: string;
  harvested: number;
  rank?: string; // optional for now, dont have implementation for this yet
  rate: string;
  totalTime?: string; // optional for now, dont have implementation for this yet
  lab: string;
  totalMoon: string;
}
export interface IRemindFriend_Input {
  responderWalletId?: string;
  responderNetworkId?: string;
}

export interface IRemindFriend_Input {
  responderWalletId?: string;
  responderNetworkId?: string;
}

export interface ICreateRaffleTickets_Input {
  trxHash: string;
  raffleKey: ERaffleTicketKey;
}

export interface IUneqipRelic_Input {
  contract_id: string;
  token_id: string;
}

export interface IBurnAsset_Input {
  burn_token_id: string;
  union_contract_type: EHM_UnionContractTypes;
  amount: number;
}

export interface IMarkBridgeDeposited_Input {
  id: string;
  depositTx?: string;
  depositStatus: "success" | "failed";
}

export enum ESwapType {
  swap = "swap",
  bridge = "bridge",
}

export enum ENearIntentBridgeStatus {
  pending = "pending",
  completed = "completed",
  cancelled = "cancelled",
  failed = "failed",
  refund_requested = "refund_requested",
  refunded = "refunded",
  refund_fail = "refund_fail",
}

export enum ESolverType {
  SOLVER_RELAY = "SOLVER_RELAY",
  ONE_CLICK = "ONE_CLICK",
}

export interface IDB_NearIntentBridge {
  id: string;
  blockchain_id: string;
  network_id: string;
  wallet_id: string;
  from_amount: string;
  from_amount_str: string;
  expected_to_amount: string;
  expected_to_amount_str: string;
  actual_to_amount: string;
  actual_to_amount_str: string;
  meteor_symbol_from: EBridgeTokenSymbol;
  meteor_symbol_to: EBridgeTokenSymbol;
  origin_address: string;
  destination_address: string;
  intent_published_at?: Date;
  created_at: Date;
  bridge_intent_hash?: string;
  bridge_withdrawal_hash?: string;
  refund_to?: string;
  refund_intent_hash?: string;
  refund_withdrawal_hash?: string;
  status: ENearIntentBridgeStatus;
  bridge_intermediate_hash?: string;
  solver_type: ESolverType;
  submitted_deposit_hash?: string;
}

export interface IDB_NearIntentWithdrawal {
  id: string;
  blockchain_id: string;
  network_id: string;
  wallet_id: string;
  withdraw_amount: string;
  withdraw_amount_str: string;
  withdraw_to: string;
  meteor_symbol_to: string;
  intent_published_at: Date;
  intent_hash: string;
  intermediate_hash?: string;
  withdrawal_hash?: string;
  cron_count?: number;
}

export interface IDB_NearIntentBridgeWithMetadata extends IDB_NearIntentBridge {
  defuseAssetIdFrom: string;
  decimalsFrom: number;
  defuseAssetIdTo: string;
  decimalsTo: number;
  poaChainFrom: EPoA_Blockchain;
  poaChainTo: EPoA_Blockchain;
}
