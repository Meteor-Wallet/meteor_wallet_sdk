import { FinalExecutionOutcome } from "@near-js/types";
import { getAppEnvHelper } from "../../modules_app_core/env/app_env_helper";
import { TMeteorApiResponse } from "../../modules_app_core/meteor_api/meteor_api.types";
import { apiOkValueOrThrowMeteorError } from "../../modules_app_core/meteor_api/meteor_api.utils";
import { EBridgeTokenSymbol } from "../../modules_feature/bridge/bridge.types";
import { ERaffleTicketKey } from "../../modules_feature/campaign/campaign_enums";
import { IOGetSignUpRequest_Output } from "../../modules_feature/defi_card/defi_card_types";
import { ERewardAssetType } from "../../modules_feature/harvest_moon/harvest_moon_enums";
import {
  IHarvestMoon_ContractDropResponse,
  IHarvestMoon_LeaderBoardMissionResponse,
  IHarvestMoon_LeaderBoardResponse,
  IHarvestMoon_TinkerUpgradeResponse,
  IHarvestMoonAccountData,
  IHarvestMoonHarvestResponse,
  IHarvestMoonRecruitTinker,
  IHarvestMoonReferralStats,
  IHarvestMoonUpgradeTinker,
  IOHarvestMoonGetContractDropRate,
  IRaffleEntryRecord,
  ITokenDropCampaign,
  THarvestUnclaimedReward,
  TRaffleRewardStatus,
} from "../../modules_feature/harvest_moon/harvest_moon_types";
import { DBI_FeatureEnrollmentRecord } from "../../modules_feature/missions/feature_enrollment_records/feature_enrollment_records.dbi";
import { EFeatureEnrollmentRecord_ConsentStatus } from "../../modules_feature/missions/feature_enrollment_records/feature_enrollment_records.enum";
import { EBlockchain } from "../../modules_feature/missions/feature_enrollment_records/feature_enrollment_records.zod";
import { DBI_MissionWithMetadata, EMissionType } from "../../modules_feature/missions/mission.dbi";
import { EMissionLeaderboardSubType } from "../../modules_feature/missions/mission_types";
import {
  ERewardSourceType,
  ERewardStatus,
  IReward,
} from "../../modules_feature/rewards/rewards_types";
import { TValidatorDetails } from "../../modules_feature/staking/staking_types";
import { BaseHttpClient } from "../../modules_utility/http_utilities/BaseHttpClient";
import { ENearNetwork } from "../near/types/near_basic_types";
import {
  IRocketX_BridgeHistoryResponse,
  IRocketX_Quotation,
  IRocketX_SwapResponse,
} from "../rocketx/rocketx.types";
import { ISimpleSwapBridgeResponse, ISimpleSwapToken } from "../simple_swap/simple_swap.types";
import {
  IOTelegram_CreateWallet_Input,
  ITelegramAccountSignedPayload,
  ITelegramAuthPayload,
  ITelegramLinkedWallet,
  ITelegramUserKeyPayload_v2,
  TFriendListResult,
} from "../telegram/telegram.types";
import { IOBackendV2_CreateWallet_Input, TIO_AccessInfo } from "./meteor_v2_api.io_types";
import {
  ENearIntentBridgeStatus,
  IBurnAsset_Input,
  ICreateRaffleTickets_Input,
  IDB_NearIntentBridge,
  IDB_NearIntentBridgeWithMetadata,
  IDB_NearIntentWithdrawal,
  IGetHarvestShareImage_Input,
  IGetRecruitShareImage_Input,
  IMarkBridgeDeposited_Input,
  IRemindFriend_Input,
  IUneqipRelic_Input,
  MeteorApiSignedRequest,
} from "./meteor_v2_api.types";
import { getRpcUrlPartForPayload } from "./util_func/getRpcUrlPartForPayload";

// This class is using a singleton design
export class MeteorBackendV2Client extends BaseHttpClient {
  private static instance: MeteorBackendV2Client;

  private constructor() {
    super();
  }

  public static getInstance(): MeteorBackendV2Client {
    if (!MeteorBackendV2Client.instance) {
      MeteorBackendV2Client.instance = new MeteorBackendV2Client();
    }

    return MeteorBackendV2Client.instance;
  }

  private async sendAndHandleResponse<T>(
    path: string,
    payload?: any,
    method: "POST" | "GET" = "POST",
  ): Promise<T> {
    let response: TMeteorApiResponse<T>;

    switch (method) {
      case "POST": {
        // payload.rpcUrl = get
        response = await this.postJson(path, { ...getRpcUrlPartForPayload(payload), ...payload });
        break;
      }
      case "GET":
        response = await this.getJson(path);
        break;
    }

    return apiOkValueOrThrowMeteorError(response);
  }

  public async telegramCreateWallet(
    inputs: IOTelegram_CreateWallet_Input,
  ): Promise<FinalExecutionOutcome> {
    return await this.sendAndHandleResponse("/api/wallet/create_from_telegram", inputs);
  }

  public async createWallet(
    inputs: IOBackendV2_CreateWallet_Input,
  ): Promise<FinalExecutionOutcome> {
    return await this.sendAndHandleResponse("/api/wallet/create", inputs);
  }

  public async telegramValidateInitData(payload: ITelegramAuthPayload): Promise<boolean> {
    return await this.sendAndHandleResponse("/api/meteor_tg_bot/is_valid_init_data", payload);
  }

  public async telegramLinkAccount(payload: ITelegramAccountSignedPayload): Promise<{
    isReferralCreated: boolean;
  }> {
    return await this.sendAndHandleResponse(
      "/api/meteor_tg_bot/link_telegram_account_to_wallet",
      payload,
    );
  }

  public async telegramGetUserKey(payload: ITelegramUserKeyPayload_v2): Promise<string> {
    return await this.sendAndHandleResponse("/api/meteor_tg_bot/get_user_key", payload);
  }

  public async telegramGetLinkedAccount(payload: {
    telegramAuthPayload: ITelegramAuthPayload;
  }): Promise<ITelegramLinkedWallet | null> {
    return await this.sendAndHandleResponse(
      "/api/meteor_tg_bot/get_linked_telegram_account_for_telegram_id",
      payload,
    );
  }

  public async getLinkedTelegramAccountsForWallets(
    payload: ITelegramAccountSignedPayload & {
      wallets: {
        walletId: string;
        networkId: string;
      }[];
    },
  ): Promise<ITelegramLinkedWallet[]> {
    return await this.sendAndHandleResponse(
      "/api/meteor_tg_bot/get_linked_telegram_accounts_for_wallets",
      payload,
    );
  }

  public async getLinkedTelegramAccountForWallet(
    payload: MeteorApiSignedRequest,
  ): Promise<ITelegramLinkedWallet | null> {
    return await this.sendAndHandleResponse(
      "/api/meteor_tg_bot/get_linked_telegram_account_for_wallet",
      payload,
    );
  }

  public async getFriendList(
    payload: MeteorApiSignedRequest & {
      pageSize: number;
      page: number;
      isHarvestMoonInitialized?: boolean;
    },
  ): Promise<{
    result: TFriendListResult[];
    totalPage: number;
    total: number;
  }> {
    return await this.sendAndHandleResponse("/api/meteor_tg_bot/get_friend_list", payload);
  }

  public async harvestMoonGetAccessInfo(
    payload: ITelegramAccountSignedPayload,
  ): Promise<TIO_AccessInfo> {
    return await this.sendAndHandleResponse("/api/harvest_moon/access_info", payload);
  }

  public async addHarvestMoonAccessKey(
    payload: MeteorApiSignedRequest<{
      signedDelegateBase64: string;
    }>,
  ): Promise<void> {
    return await this.sendAndHandleResponse("/api/harvest_moon/add_access_key", payload);
  }

  public async removeOldHarvestMoonAccessKey(
    payload: MeteorApiSignedRequest<{
      signedDelegateBase64: string;
    }>,
  ): Promise<void> {
    return await this.sendAndHandleResponse("/api/harvest_moon/remove_old_access_key", payload);
  }

  public async harvestMoonInitializeAccount(
    payload: MeteorApiSignedRequest,
  ): Promise<IHarvestMoonAccountData> {
    return await this.sendAndHandleResponse("/api/harvest_moon/init", payload);
  }

  public async harvestMoonHarvest(
    payload: MeteorApiSignedRequest,
  ): Promise<IHarvestMoonHarvestResponse> {
    return await this.sendAndHandleResponse("/api/harvest_moon/harvest", payload);
  }

  public async harvestMoonGetUnclaimedRewards(payload: {
    walletSignedPayload: {
      networkId: ENearNetwork;
      walletId: string;
    };
  }): Promise<THarvestUnclaimedReward> {
    return await this.sendAndHandleResponse("/api/rewards/get_unclaimed_wallet_rewards", payload);
  }

  public async harvestMoonGetUnclaimActiveReferralCount(payload: {
    telegramAuthPayload: ITelegramAuthPayload;
  }): Promise<number> {
    return await this.sendAndHandleResponse(
      "/api/meteor_tg_bot/get_unclaim_active_referral_count",
      payload,
    );
  }

  public async harvestMoonGetReferralStats(
    payload: MeteorApiSignedRequest,
  ): Promise<IHarvestMoonReferralStats> {
    return await this.sendAndHandleResponse("/api/harvest_moon/get_referral_stats", payload);
  }

  public async harvestMoonRecruitTinkers(
    payload: MeteorApiSignedRequest<IHarvestMoonRecruitTinker>,
  ): Promise<IHarvestMoonAccountData> {
    return await this.sendAndHandleResponse("/api/harvest_moon/recruit_tinkers", payload);
  }

  public async harvestMoonUpgradeTinker(
    payload: MeteorApiSignedRequest<IHarvestMoonUpgradeTinker>,
  ): Promise<IHarvestMoon_TinkerUpgradeResponse[]> {
    return await this.sendAndHandleResponse("/api/harvest_moon/upgrade_tinker", payload);
  }

  public async harvestMoonGetRecruitShareImage(
    payload: MeteorApiSignedRequest<IGetRecruitShareImage_Input>,
  ): Promise<string> {
    return await this.sendAndHandleResponse("/api/harvest_moon/get_recruit_share_image", payload);
  }

  public async harvestMoonGetHarvestShareImage(
    payload: MeteorApiSignedRequest<IGetHarvestShareImage_Input>,
  ): Promise<string> {
    return await this.sendAndHandleResponse("/api/harvest_moon/get_harvest_share_image", payload);
  }

  public async isWalletWhitelisted(payload: MeteorApiSignedRequest): Promise<boolean> {
    return await this.sendAndHandleResponse("/api/harvest_moon/is_release_wallet", payload, "POST");
  }

  public async getIsTelegramWhitelisted(payload: {
    telegramAuthPayload: ITelegramAuthPayload;
  }): Promise<boolean> {
    return await this.sendAndHandleResponse(
      "/api/harvest_moon_whitelist/is_telegram_whitelist",
      payload,
      "POST",
    );
  }

  public async getHarvestMoonLeaderBoard(
    payload: MeteorApiSignedRequest,
  ): Promise<IHarvestMoon_LeaderBoardResponse> {
    return await this.sendAndHandleResponse("/api/harvest_moon/leader_board", payload, "POST");
  }

  public async getHarvestMoonLeaderBoardMission(
    payload: MeteorApiSignedRequest<{
      missionSubType: EMissionLeaderboardSubType;
      minimumStreak?: number;
    }>,
  ): Promise<IHarvestMoon_LeaderBoardMissionResponse> {
    return await this.sendAndHandleResponse(
      "/api/harvest_moon/mission_leaderboard",
      payload,
      "POST",
    );
  }

  public async getMercuryoSignature(payload: MeteorApiSignedRequest): Promise<string> {
    return await this.sendAndHandleResponse(
      "/api/onramp/mercuryo/generate_signature",
      payload,
      "POST",
    );
  }

  public async getFeatureEnrollmentRecord(
    payload: MeteorApiSignedRequest & {
      blockchain_id: string;
      feature_id: string;
    },
  ): Promise<DBI_FeatureEnrollmentRecord> {
    return await this.sendAndHandleResponse(
      "/api/feature_enrollment/feature_enrollment_records",
      payload,
      "POST",
    );
  }

  public async setFeatureEnrollment(
    payload: MeteorApiSignedRequest & {
      public_key: string;
      consent_status:
        | EFeatureEnrollmentRecord_ConsentStatus.accepted
        | EFeatureEnrollmentRecord_ConsentStatus.denied;
    },
  ): Promise<DBI_FeatureEnrollmentRecord> {
    return await this.sendAndHandleResponse(
      "/api/feature_enrollment/feature_enrollment_records/update",
      payload,
      "POST",
    );
  }

  public async getMission(payload: {
    walletId: string;
    networkId: ENearNetwork;
    missionType?: EMissionType;
  }): Promise<DBI_MissionWithMetadata[]> {
    return await this.sendAndHandleResponse("/api/missions/list", payload, "POST");
  }

  public async harvestMoonUpgradeLab(payload: MeteorApiSignedRequest): Promise<void> {
    return await this.sendAndHandleResponse("/api/harvest_moon/upgrade_lab", payload);
  }

  public async harvestMoonUpgradeContainer(payload: MeteorApiSignedRequest): Promise<void> {
    return await this.sendAndHandleResponse("/api/harvest_moon/upgrade_container", payload);
  }

  public async harvestMoonUpgradeTier(payload: MeteorApiSignedRequest): Promise<void> {
    return await this.sendAndHandleResponse("/api/harvest_moon/upgrade_tier", payload);
  }

  public async harvestMoonGetTier(payload: MeteorApiSignedRequest): Promise<number> {
    return await this.sendAndHandleResponse("/api/harvest_moon/get_tier", payload);
  }

  public async harvestMoonGetContractDropRate(
    payload: IOHarvestMoonGetContractDropRate,
  ): Promise<IHarvestMoon_ContractDropResponse> {
    return await this.sendAndHandleResponse("/api/harvest_moon/get_contract_drop_rate", payload);
  }

  public async remindFriendHarvest(
    payload: MeteorApiSignedRequest<IRemindFriend_Input>,
  ): Promise<{ remindedCount: number }> {
    return await this.sendAndHandleResponse("/api/harvest_moon/remind_friend_harvest", payload);
  }

  public async createRaffleTicket(
    payload: MeteorApiSignedRequest<ICreateRaffleTickets_Input>,
  ): Promise<{ remindedCount: number }> {
    return await this.sendAndHandleResponse("/api/raffle_tickets/create", payload);
  }

  public async getRegisteredRaffleTickets(
    payload: MeteorApiSignedRequest<{
      raffleKey: ERaffleTicketKey;
    }>,
  ): Promise<IRaffleEntryRecord[]> {
    return await this.sendAndHandleResponse("/api/raffle_tickets/get_records_by_key", payload);
  }

  public async getAccountRaffleTicketsCount(
    payload: MeteorApiSignedRequest<{
      raffleKey: ERaffleTicketKey;
    }>,
  ): Promise<number> {
    return await this.sendAndHandleResponse(
      `/api/raffle_tickets/get_number_of_raffle_tickets`,
      payload,
    );
  }

  public async getAllRaffleTicketsCount(
    payload: MeteorApiSignedRequest<{
      raffleKey: ERaffleTicketKey;
    }>,
  ): Promise<number> {
    return await this.sendAndHandleResponse(`/api/raffle_tickets/get_all_raffle_tickets`, payload);
  }
  public async unequipRelic(payload: MeteorApiSignedRequest<IUneqipRelic_Input>) {
    return await this.sendAndHandleResponse("/api/harvest_moon/unstake_relic", payload);
  }

  public async updateHarvestMoonAccountInfo(payload: MeteorApiSignedRequest) {
    return await this.sendAndHandleResponse(
      "/api/harvest_moon/update_harvest_moon_account",
      payload,
    );
  }

  public getStakingPoolList(payload: { networkId: ENearNetwork }): Promise<string[]> {
    return this.sendAndHandleResponse("/api/indexer_cache/get_staking_pools", payload);
  }

  public getValidators(payload: { networkId: ENearNetwork; validatorId?: string }): Promise<{
    validators: TValidatorDetails[];
    updatedAt: number;
  }> {
    return this.sendAndHandleResponse("/api/stake/get_validators", payload);
  }

  public getAccountTransactions(payload: { accountId: string }): Promise<string[]> {
    return this.sendAndHandleResponse("/api/indexer/get_transaction_hashes", payload);
  }

  public getClaimedMoonToken(payload: {
    networkId: ENearNetwork;
    walletId: string;
  }): Promise<number> {
    return this.sendAndHandleResponse("/api/rewards/get_claimed_moon_drop", payload);
  }

  public async exchangeAssetForContract(payload: MeteorApiSignedRequest<IBurnAsset_Input>) {
    return await this.sendAndHandleResponse(
      "/api/harvest_moon/exchange_asset_for_contract",
      payload,
    );
  }

  public async completeMission(payload: MeteorApiSignedRequest<{ missionId: number }>) {
    return await this.sendAndHandleResponse("/api/missions/complete", payload, "POST");
  }

  public async getUnopenRewards(payload: {
    walletId: string;
    networkId: ENearNetwork;
    limit: number;
  }): Promise<{
    rewards: IReward[];
    totalCount: number;
  }> {
    return await this.sendAndHandleResponse("/api/rewards/get_unopen_rewards", payload, "POST");
  }

  public async openRewards(
    payload: MeteorApiSignedRequest<{ rewardIds: number[] }>,
  ): Promise<{ failIds: number[] }> {
    return await this.sendAndHandleResponse("/api/rewards/open_rewards", payload, "POST");
  }

  public async updateReferrer(payload: MeteorApiSignedRequest<{ newReferrerWalletId: string }>) {
    return await this.sendAndHandleResponse("/api/harvest_moon/update_referrer", payload, "POST");
  }

  /**
   * When `requiredAccurateStatus` is specified,
   * return STRING instead of simple BOOLEAN
   */
  public async checkMemeReward(
    payload: MeteorApiSignedRequest<{
      walletSignedPayload: {
        networkId: ENearNetwork;
        walletId: string;
      };
      raffleKey: string;
      requireAccurateStatus?: boolean;
    }>,
  ): Promise<boolean | TRaffleRewardStatus> {
    return await this.sendAndHandleResponse(
      "/api/rewards/check_raffle_participation_claimable",
      payload,
      "POST",
    );
  }

  public async claimMemeReward(
    payload: MeteorApiSignedRequest<{
      walletSignedPayload: {
        networkId: ENearNetwork;
        walletId: string;
      };
      raffleKey: string;
    }>,
  ): Promise<{ failIds: number[] }> {
    return await this.sendAndHandleResponse(
      "/api/rewards/claim_raffle_participation_reward",
      payload,
      "POST",
    );
  }

  public async getLinkedTelegramAccountForWalletPublic(
    payload: MeteorApiSignedRequest<{ walletId: string }>,
  ): Promise<ITelegramLinkedWallet | null> {
    return await this.sendAndHandleResponse(
      "/api/meteor_tg_bot/get_linked_telegram_account_for_wallet_public",
      payload,
    );
  }

  public async createErrorEntry(payload: {
    message: string;
    stack: string;
    path?: string;
    account_id?: string;
  }): Promise<string> {
    return await this.sendAndHandleResponse("/api/wallet/error_entry", payload);
  }

  public async getTokenDropCampaigns(
    payload: MeteorApiSignedRequest<{ includeCriteriaResult?: boolean }>,
  ): Promise<ITokenDropCampaign[]> {
    return await this.sendAndHandleResponse("/api/token_drop/get_campaigns", payload);
  }

  public async enrollTokenDropCampaign(
    payload: MeteorApiSignedRequest<{ tokenDropCampaignId: number }>,
  ): Promise<boolean> {
    return await this.sendAndHandleResponse("/api/token_drop/enroll_campaign", payload);
  }

  public async getRewardCount(
    payload: MeteorApiSignedRequest<{
      rewardSourceType: ERewardSourceType;
      rewardStatus: ERewardStatus;
      campaignId?: string;
    }>,
  ): Promise<
    {
      amount: string;
      reward_asset_type: ERewardAssetType;
      reward_asset_id: string;
    }[]
  > {
    return await this.sendAndHandleResponse("/api/rewards/get_reward_count", payload);
  }

  public async getRocketXQuotation(payload: {
    amount: string;
    toNetwork: string;
    fromNetwork: string;
    fromToken: string;
    toToken: string;
    walletSignedPayload: {
      walletId: string;
      networkId: ENearNetwork;
    };
  }): Promise<IRocketX_Quotation> {
    return await this.sendAndHandleResponse("/api/rocketx/get_quotation", payload);
  }

  public async createRocketXSwap(payload: {
    fromTokenId: number;
    toTokenId: number;
    userAddress: string;
    destinationAddress: string;
    disableEstimate?: boolean;
    amount: number;
    slippage: number;
    swapWorthInUsd: string;
    meteorSymbolFrom: EBridgeTokenSymbol;
    meteorSymbolTo: EBridgeTokenSymbol;
    walletSignedPayload: {
      walletId: string;
      networkId: ENearNetwork;
    };
  }): Promise<IRocketX_SwapResponse> {
    return await this.sendAndHandleResponse("/api/rocketx/create_swap", payload);
  }

  public async getBridgeHistory(payload: {
    page: number;
    perPage: number;
    walletSignedPayload: {
      walletId: string;
      networkId: ENearNetwork;
    };
  }): Promise<IRocketX_BridgeHistoryResponse> {
    return await this.sendAndHandleResponse("/api/bridge/history", payload);
  }

  public async markBridgeTransactionAsDeposited(
    payload: IMarkBridgeDeposited_Input,
  ): Promise<boolean> {
    return await this.sendAndHandleResponse("/api/bridge/mark_deposited", payload);
  }

  public async refetchBridgeStatusById(payload: { id: string }): Promise<void> {
    await this.sendAndHandleResponse("/api/rocketx/transaction_status", payload);
  }

  public async getSimpleSwapTokens(): Promise<ISimpleSwapToken[]> {
    return this.sendAndHandleResponse("/api/simple_swap/tokens", {});
  }

  public async getSimpleSwapQuotation(payload: {
    currencyFrom: string;
    currencyTo: string;
    amount: string;
  }): Promise<{
    toAmount: string;
    fromAmount: string;
    fromPrice: string;
    toPrice: string;
  }> {
    return this.sendAndHandleResponse("/api/simple_swap/quotation", payload);
  }

  public async createSimpleSwapBridge(payload: {
    addressTo: string;
    amount: number;
    currencyFrom: string;
    currencyTo: string;
    walletId: string;
    networkId: ENearNetwork;
    swapWorthInUsd: string;
    userRefundAddress: string;
    meteorSymbolFrom: EBridgeTokenSymbol;
    meteorSymbolTo: EBridgeTokenSymbol;
  }): Promise<ISimpleSwapBridgeResponse> {
    return this.sendAndHandleResponse("/api/simple_swap/create", payload);
  }

  public async refetchSimpleSwapById(id: string): Promise<void> {
    return this.sendAndHandleResponse("/api/simple_swap/transaction", { id });
  }

  public async getSignUpRequest(
    payload: MeteorApiSignedRequest & {
      programId: string;
    },
  ): Promise<IOGetSignUpRequest_Output> {
    return this.sendAndHandleResponse("/api/wallet_program/get_sign_up_request", payload);
  }

  public async signupMeteorDefiCard(
    payload: MeteorApiSignedRequest & {
      signUpData: {
        country_code: string;
        email: string;
        deposit_trx_hash: string;
        estimated_usage: string;
      };
    },
  ): Promise<IOGetSignUpRequest_Output> {
    return this.sendAndHandleResponse("/api/wallet_program/meteor_defi_card/sign_up", payload);
  }

  public async updateSignUpData(
    payload: MeteorApiSignedRequest & {
      updatedData: {
        email: string;
        country_code: string;
      };
    },
  ): Promise<void> {
    return this.sendAndHandleResponse(
      "/api/wallet_program/meteor_defi_card/update_sign_up_data",
      payload,
    );
  }

  public async cancelMeteorCardApplication(
    payload: MeteorApiSignedRequest,
  ): Promise<IOGetSignUpRequest_Output> {
    return this.sendAndHandleResponse("/api/wallet_program/meteor_defi_card/opt_out", payload);
  }

  public async getNearIntentBridgeQuotation(payload: {
    meteorTokenSymbolIn: EBridgeTokenSymbol;
    meteorTokenSymbolOut: EBridgeTokenSymbol;
    amountIn: string;
    destinationAddress?: string;
    originAddress: string;
  }): Promise<{
    quoteHashes: string[];
    estimatedReadableToAmount: string;
    estimatedToAmount: string;
    message: {
      deadline: string;
      intents: (
        | {
            intent: string;
            diff: Record<string, string>;
            referral?: string;
          }
        | {
            intent: string;
            receiver_id: string;
            amount: string;
            token?: string;
            storage_deposit?: string;
            memo?: string;
            msg?: string;
          }
      )[];
      signer_id: string;
    };
    withdrawalFee: string;
  }> {
    return this.sendAndHandleResponse("/api/near_intents/get_quotation", payload);
  }

  public async getNearIntentBridgeHistory({
    walletId,
    page,
    perPage,
    status,
    meteorSymbolFrom,
    meteorSymbolTo,
  }: {
    walletId: string;
    page: number;
    perPage: number;
    status?: ENearIntentBridgeStatus;
    meteorSymbolFrom?: EBridgeTokenSymbol;
    meteorSymbolTo?: EBridgeTokenSymbol;
  }): Promise<{
    count: number;
    history: IDB_NearIntentBridge[];
  }> {
    return this.sendAndHandleResponse("/api/near_intents/get_bridge_history", {
      walletId,
      page,
      perPage,
      status,
      meteorSymbolFrom,
      meteorSymbolTo,
    });
  }

  public async createNearIntentBridge(payload: {
    meteorTokenSymbolIn: EBridgeTokenSymbol;
    meteorTokenSymbolOut: EBridgeTokenSymbol;
    amountIn: string;
    destinationAddress: string;
    originAddress: string;
    expectedAmountOut: string;
    blockchainId: EBlockchain;
    networkId: ENearNetwork;
    walletId: string;
    notificationToken?: string;
    swapWorthInUsd: string;
  }): Promise<IDB_NearIntentBridge> {
    return this.sendAndHandleResponse("/api/near_intents/create_bridge", payload);
  }

  public async getNearIntentBridgeInfo(
    id: string,
  ): Promise<IDB_NearIntentBridgeWithMetadata | null> {
    return this.sendAndHandleResponse("/api/near_intents/get_bridge", { id });
  }

  public async getNearIntentStatus(payload: {
    intentHash: string;
    bridgeId: string;
    type: "bridge" | "refund";
  }): Promise<
    | {
        intent_hash: string;
        status: "PENDING";
      }
    | {
        status: "TX_BROADCASTED" | "SETTLED";
        intent_hash: string;
        data: {
          hash: string;
        };
      }
    | {
        status: "NOT_FOUND_OR_NOT_VALID";
        intent_hash: string;
      }
  > {
    return this.sendAndHandleResponse("/api/near_intents/get_intent_status", payload);
  }

  public async getNearIntentWithdrawalStatus(payload: {
    withdrawalHash: string;
    bridgeId: string;
    type: "bridge" | "refund";
  }): Promise<{
    status: "COMPLETED" | "NOT_FOUND" | "PENDING" | "FAILED";
    data: {
      tx_hash: string;
      transfer_tx_hash?: string;
      chain: string;
      defuse_asset_identifier: string;
      near_token_id: string;
      decimals: number;
      amount: number;
      account_id: string;
      address: string;
    };
  }> {
    return this.sendAndHandleResponse("/api/near_intents/get_withdrawal_status", payload);
  }

  public async publishBridgeNearIntents(payload: {
    quote_hashes: string[];
    signed_data: {
      standard: "nep413";
      signature: string;
      public_key: string;
      payload: {
        message: string;
        nonce: string;
        recipient: string;
      };
    };
    account_id: string;
    bridge_id: string;
    type: "bridge" | "refund";
  }): Promise<{
    status: "OK";
    intent_hash: string;
  }> {
    return this.sendAndHandleResponse("/api/near_intents/publish_bridge", payload);
  }

  public async cancelNearIntentsBridge({
    walletId,
    id,
  }: {
    walletId: string;
    id: string;
  }): Promise<IDB_NearIntentBridge> {
    return this.sendAndHandleResponse("/api/near_intents/cancel_bridge", {
      walletId,
      id,
    });
  }

  getWithdrawalHistory(payload: { walletId: string; page: number; perPage: number }): Promise<{
    count: number;
    history: IDB_NearIntentWithdrawal[];
  }> {
    return this.sendAndHandleResponse("/api/near_intents/get_withdrawal_history", payload);
  }

  getWithdrawalInfoById(payload: { id: string }): Promise<IDB_NearIntentWithdrawal> {
    return this.sendAndHandleResponse("/api/near_intents/get_withdrawal", payload);
  }

  publishWithdrawalNearIntent(payload: {
    quote_hashes: string[];
    signed_data: {
      standard: "nep413";
      signature: string;
      public_key: string;
      payload: {
        message: string;
        nonce: string;
        recipient: string;
      };
    };
    account_id: string;
    type: "withdraw";
  }): Promise<{
    intentResult: {
      status: "OK";
      intent_hash: string;
    };
    meteorWithdrawal: IDB_NearIntentWithdrawal;
  }> {
    return this.sendAndHandleResponse("/api/near_intents/publish_withdrawal", payload);
  }

  // Private/protected functions
  protected getBaseUrl(): string {
    // return `http://localhost:4000`;
    return getAppEnvHelper().getBackendApiBaseUrl();
  }
}
