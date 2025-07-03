import { ENftOfferDir } from "@meteorwallet/app/src/components/sectionComponents/transaction_components/action_components/ui_components/Component_NftTradeUI";
import { ETransactionBadgeStatus } from "@meteorwallet/app/src/services/transactions";
import { EErrorId_AccountSignerExecutor } from "@meteorwallet/core-sdk/errors/ids/by_feature/old_meteor_wallet.errors";
import { EErr_NearLedger } from "@meteorwallet/ledger-client/near/MeteorErrorNearLedger";
import {
  ELedgerConnectedStatus,
  ELedgerConnectionStatus,
  ELedgerDisconnectedStatus,
} from "@meteorwallet/ledger-client/near/near_ledger.enums";
import { ReactElement } from "react";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import {
  ENearIndexer_AccessKeyPermission,
  ENearIndexer_ActionType,
} from "../../modules_external/near_public_indexer/types/near_indexer_basic_types";
import { EAccountErrorType, TWalletId_Status } from "../../modules_feature/accounts/account_types";
import { ETransactionExecutionStatus } from "../../modules_feature/accounts/near_signer_executor/NearAccountSignerExecutor.types";
import { EBridgeDerivedStatus } from "../../modules_feature/bridge/bridge.types";
import { EMeteorCardEstimateUsage } from "../../modules_feature/defi_card/defi_card_constants";
import {
  EHM_UnionContractTypes,
  EHarvestMoon_Menu,
  EHarvestMoon_PlayerTier,
  EHarvestMoon_RelicRarity,
  EHarvestMoon_TinkerGuideModalPhase,
  EMissionVoteXRefTabs,
  ETokenDropCampaignIds,
} from "../../modules_feature/harvest_moon/harvest_moon_enums";
import { TTokenDropCampaignStatus } from "../../modules_feature/harvest_moon/harvest_moon_types";
import { EMissionSubType } from "../../modules_feature/missions/mission.dbi";
import {
  EChallengeStatus,
  EMissionLeaderboardSubType,
} from "../../modules_feature/missions/mission_types";
import {
  ERPC_Providers_Mainnet,
  ERPC_Providers_Testnet,
} from "../../modules_feature/rpc/rpc_enums";
import { ETransactionNotSafeId } from "../../modules_feature/transactions/transaction_safety.types";
import { ETransactionType } from "../../modules_feature/transactions/transaction_utils";
import { EOldMeteorErrorId } from "../../modules_utility/old_errors/old_error_ids";

type TBasicTrans = ReactElement | string;

export interface ITranslations {
  languageDisplayName: string;
  languageCode: string;
  bridge: {
    button_view_transaction: string;
    intent_pending: {
      title: string;
      description: string;
      button_create_new_bridge: string;
    };
    warning_no_more_transactions: string;
    warning_old_bridge: string;
    transitioning_to_intents: string;
    warning_insufficient_balance: string;
    modal_add_public_key: {
      title: string;
      description: string;
    };
    modal_terminate_bridge: {
      title: string;
      description: string;
    };
    modal_available_balance: {
      title: string;
      description: string;
    };
    modal_similar_pair: {
      title: string;
      description: string;
      button_create_new: string;
      button_back: string;
      footer_note: string;
    };
    modal_refund: {
      title: string;
      label_network: string;
      label_insert_address: string;
      placeholder_insert_address: string;
      label_insert_address_confirm: string;
      placeholder_insert_address_confirm: string;
      error_invalid_address: string;
      error_address_not_match: string;
    };
    button_cancel: string;
    button_proceed: string;
    label_reference_id: string;
    label_status: string;
    label_refund_destination: string;
    label_source_network: string;
    label_destination_network: string;
    label_source_token: string;
    label_destination_token: string;
    label_amount_from: string;
    label_amount_to: string;
    label_refund_hash: string;
    label_withdrawal_hash: string;
    label_created_at: string;
    quote_result: {
      success: {
        title: string;
        description: string;
      };
      fail: {
        title: string;
        description: string;
      };
      cancel: {
        title: string;
        description: string;
      };
    };
    button_refund: string;
    button_continue: string;
    button_view: string;
    label_transaction_processing: string;
    label_footnote_come_back_later: string;
    button_confirm_quote: string;
    warning_large_withdrawal: string;
    quote_header: {
      deposit: {
        title: string;
        subtitle: string;
      };
      confirm_quote: {
        title: string;
        subtitle: string;
      };
      steps: {
        deposit: string;
        confirm_quote: string;
        complete: string;
      };
    };
    label_deposit_amout: string;
    label_deposit_network: string;
    label_deposit_address: string;
    warning_deposit_address_title: string;
    warning_deposit_address_desc_1: string;
    warning_deposit_address_desc_2: string;
    warning_deposit_address_desc_3: string;
    title: string;
    label_pay: string;
    label_receive: string;
    label_from: string;
    label_to: string;
    label_you_send: string;
    label_you_receive: string;
    label_on_network: string;
    button_review_bridge: string;
    button_confirm_bridge: string;
    label_bridge_details: string;
    label_bridge_compare: string;
    label_support_fees: string;
    label_fees: string;
    label_slippage: string;
    label_on: string;
    button_change: string;
    button_add_sender_address: string;
    button_add_receiver_address: string;
    modals: {
      network_token_selector: {
        label_select_network: string;
        label_select_token: string;
        hint_search_network: string;
        hint_search_token: string;
      };
      input_chain_address: {
        label_sender_address: string;
        label_receiver_address: string;
        description: string;
        button_confirm: string;
      };
      tnc: {
        tnc: string;
        rate_variability: string;
        rate_variability_desc: string;
        third_party_responsibility: string;
        third_party_responsibility_desc: string;
        disclaimer: string;
        disclaimer_desc: string;
        citizenship: string;
        citizenship_desc: string;
        confirm_citizenship: string;
        agree_tnc: string;
        hide_tnc: string;
        agree: string;
      };
    };
    label_bridge_history: string;
    label_total_records: string;
    button_recheck: string;
    label_swapped: string;
    title_slippage: string;
    desc_slippage: string;
    button_confirm: string;
    hint_bridge_result: string;
    label_bridge: string;
    label_success: string;
    label_failed: string;
    label_cancelled: string;
    label_pending: string;
    label_refunded: string;
    label_transaction_created: string;
    payment_processing: string;
    desc_bridge_success: string;
    desc_bridge_failed: string;
    desc_bridge_created: string;
    button_back_to_wallet: string;
    button_check_transaction_status: string;
    button_redirect_to_payment: string;
    label_seconds: string;
    meteor_derived_status: {
      [Key in EBridgeDerivedStatus]: string;
    };
    label_please_add_wallet_address: string;
    label_no_route: string;
    label_network_not_supported: string;
    warning_no_network_found: string;
    warning_no_token_found: string;
  };
  error: {
    title_1: string;
    title_2: string;
    description: string;
    button_contact_support_now: string;
    button_back_to_wallet: string;
  };
  campaign: {
    label_voting_has_ended: string;
    what_is_new: {
      3: {
        description: string;
      };
      4: {
        description: string;
      };
      5: {
        description: string;
      };
      6: {
        description: string;
      };
      7: {
        description: string;
      };
      8: {
        description: string;
      };
      9: {
        description: string;
      };
      10: {
        description: string;
      };
      11: {
        description: string;
      };
      13: {
        description: string;
      };
      14: {
        description: string;
      };
    };
    meme_phase_2: {
      my_staked_gear: string;
      estimated_apy: string;
      ref_meme_contest_phase_2: string;
      gear_top_5_voted_meme_token_stake_to_earn_rewards: string;
      meme_season_phase_2_stake_gear_to_earn: string;
      staking_apy: string;
      stake_at_least_100_gear_for_advanced_contract: string;
      step_1: {
        title: string;
        description: string;
        input_title: string;
        input_button: string;
      };
      step_2: {
        title: string;
        description: string;
        input_title: string;
        input_button: string;
        warning_success: string;
      };
    };
    unstake_open_date_time_6th_sept: string;
    unstake_open_date_time_7th_sept: string;
    reward_open_date_time: string;
    raffle_result_announcement_date_time: string;
    claim_successfully: string;
    claim_reward_successfully: string;
    raffle_rewards: string;
    stake_and_vote: string;
    unstake: string;
    my_rewards: string;
    raffle_ticket: string;
    label_campaign_details: string;
    rewards: {
      title: string;
      my_raffle_tickets: string;
      potential_rewards: string;
      raffle_ticket_for_each_xref_voted: string;
      label_for_participating: string;
      label_for_each_vote: string;
      reward_gear: string;
      reward_usd: string;
      token_drop: string;
      worth_of_gear_drops: string;
      voting_period: string;
      snapshot_period: string;
      unstaking_available: string;
    };
    label_rare_relics: string;
    hours: string;
    minutes: string;
    left: string;
    label_ref_contest: string;
    label_ref_meme_contest: string;
    label_ref_meme_season: string;
    description_ref_meme_contest: string;
    description_ref_meme_season: string;
    label_how_to_participate: string;
    label_get_guaranteed_reward: string;
    label_stand_a_chance_to_win: string;
    label_my_entry: string;
    text_campaign: string;
    label_milestone: string;
    label_votes_casted: string;
    step_1: {
      title: string;
      description: string;
      input_title: string;
      input_button: string;
    };
    step_2: {
      title: string;
      description: string;
      input_title: string;
      input_button: string;
      warning_success: string;
    };
    step_3: {
      title: string;
      description: string;
      input_title: string;
      input_button: string;
      warning_success: string;
    };
    step_unstake_xref_token: {
      title: string;
      description: string;
      label_locking_period: string;
      label_total_staked_amount: string;
      input_title: string;
      input_button: string;
      warning_unstake_success: string;
      warning_withdraw_success: string;
      description_unstaking: string;
      description_claimReady: string;
    };
    step_unstake_ref_token: {
      title: string;
      description: string;
      label_total_staked_amount: string;
      input_title: string;
      input_button: string;
      warning_unstake_success: string;
    };
    step_unstake_gear_token: {
      title: string;
      description: string;
      label_locking_period: string;
      label_total_staked_amount: string;
      input_title: string;
      input_button: string;
      warning_unstake_success: string;
      warning_withdraw_success: string;
      description_unstaking: string;
      description_claimReady: string;
      label_lock_up_period: string;
      label_days: string;
      label_apy: string;
    };
    label_you_have_gear: string;
    label_reward_details: string;
    label_participation_reward: string;
    description_participation_reward: string;
    label_milestone_reward: string;
    description_milestone_reward: string;
    label_my_raffle_tickets: string;
    label_raffle_rewards_in_milestone: string;
    label_when_total_ticket_reached: string;
    label_dont_see_your_raffle_ticket: string;
    label_dont_see_your_rewards: string;
    label_here: string;
    title_claim_raffle_ticket: string;
    description_claim_raffle_ticket: string;
    label_input_transaction_hash: string;
    warning_claim_raffle_ticket_success: string;
    button_claim: string;
    button_claimed: string;
    label_coming_soon: string;
    label_staking_rewards: string;
    label_list_of_registered_entries: string;
    label_no_registered_entries: string;
    button_dropped: string;
    label_you_didnt_win: string;
    label_coming_soon_unstaking: string;
    label_coming_soon_raffle: string;
  };
  configure_rpc: {
    title: string;
    description: string;
    button_add_rpc: string;
    warning_success_update_rpc: string;
    warning_rpc_abnormal_ping: string;
    warning_duplicate_entry: string;
    label_add_custom_network: string;
    label_network_name: string;
    label_rpc_url: string;
    button_add: string;
    button_confirm_change_rpc: string;
    rpcNames: {
      mainnet: { [key in ERPC_Providers_Mainnet]: string };
      testnet: { [key in ERPC_Providers_Testnet]: string };
    };
    warning_changed_network: string;
    hint_switch_network: string;
  };
  rpc_rotate_modal: {
    rotating_rpc: string;
    selected_rpc_not_working_change_to_other: string;
    change_now: string;
    all_rpc_down: string;
  };
  wallet_status: {
    [key in TWalletId_Status]: string;
  };
  changelog: {
    abuse: {
      title_1: string;
      title_2: string;
      text_1: string;
      text_2: string;
      text_3: string;
      text_4: string;
      text_5: string;
      text_6: string;
      label_contracts: string;
      button_view_transaction: string;
      button_learn_more: string;
      button_understood: string;
    };
    label_whats_new: string;
    close: string;
    15: {
      title: string;
      description_1: string;
      description_2: string;
      button: string;
    };
    16: {
      title: string;
      description: string;
      button: string;
    };
    17: {
      simple: string;
      fast: string;
      cheap: string;
      secure: string;
      title: string;
      description: string;
      button: string;
    };
    18: {
      title: string;
      description: string;
      button: string;
    };
    19: {
      title: string;
      description: string;
      button: string;
    };
    20: {
      title: string;
      subtitle: string;
      button: string;
    };
  };
  footer: {
    home: string;
    nft: string;
    game: string;
    history: string;
    explore: string;
  };
  topup: {
    title: string;
    label_intro_1: string;
    label_intro_2: string;
    label_buy_with: string;
    label_recommended: string;
    label_payment_options: string;
    text_mercuryo_description: string;
    text_onramper_description: string;
    text_ramp_description: string;
    toast: {
      topup_success_title: string;
      topup_success_description: string;
      topup_failed_title: string;
      topup_failed_description: string;
    };
  };
  staking: {
    label_staking_apy: string;
    label_total_staked: string;
    label_total_delegators: string;
    label_daily_moon_drop: string;
    label_total_moon_earned: string;
    label_per_day: string;
    label_start_staking: string;
    label_boosted: string;
    hint_staking_apy: string;
    hint_total_staked: string;
    hint_total_delegators: string;
    hint_daily_moon_drop: string;
    hint_total_moon_earned: string;
    button_stake_more: string;
    button_unstake: string;
    button_claim: string;
    button_start_now: string;
    part_unstaking: {
      title: string;
      description: string;
    };
    part_unstaked: {
      title: string;
      description: string;
    };
    part_extra_reward: {
      title: string;
      description: string;
    };
    part_extra_reward_meteor: {
      title: string;
      description_1: string;
      description_2: string;
      description_3: string;
    };
    part_unclaimed_reward: {
      title: string;
      description: string;
    };
    section_stakings: {
      title: string;
      button_create_staking: string;
    };
    section_staking_stats: {
      title_1: string;
      title_2: string;
      description: string;
      label_my_total_stakings: string;
      label_estimated_apy: string;
    };
    subpage_create: {
      title: string;
      label_year: string;
      label_everyday: string;
      label_validator: string;
      label_staking_details: string;
      label_reward: string;
      label_estimated_yield: string;
      label_extra_reward: string;
      label_extra_daily_reward_in_moon: string;
      label_select_validator: string;
      label_delegators: string;
      hint_reward: string;
      hint_estimated_yield: string;
      hint_extra_reward: string;
      button_stake_now: string;
      warning_unstake_period: string;
    };
    toast: {
      unstake_success_title: string;
      unstake_success_description: string;
      unstake_failed_title: string;
      unstake_failed_description: string;
      claim_success_title: string;
      claim_success_description: string;
      claim_failed_title: string;
      claim_failed_description: string;
      claim_farm_success_title: string;
      claim_farm_success_description: string;
      claim_farm_failed_title: string;
      claim_farm_failed_description: string;
      no_claim_title: string;
      no_claim_description: string;
    };
    modal: {
      unstake: {
        title: string;
        label_amount_to_unstake: string;
        label_validator_details: string;
        label_provider: string;
        label_staking_apy: string;
        label_unlock_period: string;
        label_total_staked_amount: string;
        button_confirm_unstake: string;
      };
      stake: {
        label_stake_success: string;
        label_stake_failed: string;
        label_transaction_details: string;
        label_status: string;
        label_success: string;
        label_failed: string;
        label_date_time: string;
        label_transaction_fee: string;
        label_transaction_id: string;
        label_error_message: string;
        button_done: string;
      };
    };
  };
  telegram: {
    linking_wallet_to_account: string;
    quote_of_the_day: string;
    modal: {
      conflict_account: {
        title: string;
        text_import: string;
        text_import_or_create: string;
        text_if_import_or_create: string;
        text_telegram_account_override: string;
        button_import_existing: string;
        button_import_another: string;
        button_create_new: string;
        label_or: string;
      };
      connect_account: {
        title: string;
        description: string;
        button_continue: string;
      };
      import_linked_account: {
        title: string;
        description: string;
        text_choose_import_method: string;
        button_next: string;
        button_back: string;
      };
    };
  };
  harvest_moon: {
    tab_harvest: {
      ledger: {
        title: string;
        description: string;
        add_now: string;
      };
      section_dashboard: {
        label_storage: string;
        label_my_moon_balance: string;
        button_next_harvest: string;
      };
      section_game_stats: {
        title: string;
        label_coming_soon: string;
        text_news_mechanic: string;
        text_news_guide: string;
        text_news_launch_week: string;
        text_news_hm_missions: string;
        button_relic_booster: string;
        button_player_level: string;
        button_ranking: string;
        button_contract_drop: string;
        button_token_drop: string;
        button_referral: string;
        label_enrolled: string;
      };
      section_announcement: {
        title: string;
      };
      subpage_tier: {
        title: string;
        label_current_tier: string;
        label_conditions_to_unlock: string;
        label_current_benefits: string;
        label_upgrade_to_unlock: string;
        label_coming_soon: string;
        button_uprgade_tier: string;
        button_uprgade_tier_locked: string;
      };
      subpage_referral: {
        title: string;
        label_last_7_days_earned_from_referral: string;
        text_moon_earned_by_referral_is_distributed_to: string;
        label_your_primary_wallet: string;
        label_my_total_friends: string;
        label_total_moon_earned_from_referral: string;
        label_my_friends: string;
        label_total_records: string;
        label_total_moon_earned: string;
        label_refer_and_earn: string;
        label_refer_and_earn_desc: string;
        label_refer_and_earn_desc_2: string;
        label_refer_and_earn_desc_3: string;
        label_refer_and_earn_desc_4: string;
        label_level: string;
        label_wallet_id: string;
        label_telegram_id: string;
        label_last_harvest_at: string;
        button_remind_to_harvest: string;
        button_share_on_tg: string;
        button_share_on_x: string;
        button_copy_referral_link: string;
      };
      subpage_contract_drop: {
        title: string;
        label_my_union_contract_drop_stats: string;
        text_chance_of_getting_contract_at_full_storage: string;
        label_union_contract_drop_rate: string;
        text_union_contract_drop_rate: string;
        label_union_contract_type: string;
        text_union_contract_type: string;
        button_upgrade_storage: string;
        button_check_player_level: string;
      };
      subpage_token_drop: {
        title: string;
        title_token_drop: string;
        desc_token_drop: string;
        label_campaign: string;
        label_met_criteria: string;
        label_not_met_criteria: string;
        label_enrolled: string;
        label_rewards: string;
        label_period: string;
        label_claimed_rewards: string;
        button_view_details: string;
        button_enroll: string;
        label_criteria: string;
        label_completed: string;
        label_incomplete: string;
        label_player_level: string;
        text_staked_at_least_100_near: string;
        button_enroll_now: string;
        campaigns: {
          title: {
            [key in ETokenDropCampaignIds]: string;
          };
          description: {
            [ETokenDropCampaignIds.referral_token_drop_2]: string;
            [ETokenDropCampaignIds.swap_mission_drop]: string;
          };
          how_it_works: {
            [ETokenDropCampaignIds.referral_token_drop_2]: {
              step_1: string;
              step_2: string;
              step_3: string;
              label_distributed: string;
              label_remaining: string;
            };
            [ETokenDropCampaignIds.swap_mission_drop]: {
              step_1_title: string;
              step_2_title: string;
              step_3_title: string;
              step_1_description: string;
              step_2_description: string;
              step_3_description: string;
              label_distributed: string;
            };
          };
          my_progress: {
            [ETokenDropCampaignIds.swap_mission_drop]: {
              complete_5_days_streak: string;
              total_campaign_earnings: string;
              earn_bonus_rewards: string;
              top_10_trades_get: string;
              rewards: string;
              top_10_traders: string;
            };
          };
        };
        label_not_enrolled: string;
        label_criteria_unmet: string;
        label_status: string;
        tooltip_status: string;
        label_until_reward_empty: string;
        campaign_status: {
          [key in TTokenDropCampaignStatus]: string;
        };
        label_how_it_works: string;
        label_my_progress: string;
        label_qualification_status: string;
        label_recent_activity: string;
        label_you_have_referred: string;
        label_users: string;
        description_qualification_status: string;
        label_referral_activity: string;
        label_tinkers: string;
        label_prize_pool: string;
        label_up_to: string;
        label_each_harvest: string;
        tooltip_rewards: string;
        button_coming_soon: string;
        label_no_campaigns: string;
      };
      modal: {
        gas_free: {
          title: string;
          button_close: string;
        };
        upgrade_tier: {
          title: string;
          label_upgrade_to_unlock: string;
          button_upgrade_now: string;
        };
        my_referrer: {
          label_my_referrer: string;
          label_wallet_id: string;
          label_telegram_id: string;
          label_status: string;
          label_lab_level: string;
          button_update_referrer: string;
          footer_text: string;
          label_active: string;
          label_inactive: string;
          label_update_referrer: string;
          label_referrer_wallet_id: string;
          button_confirm: string;
          button_cancel: string;
        };
      };
      toast: {
        tier_upgrade_success: string;
        link_telegram_failed: string;
        referral_telegram_failed: string;
        referred_and_get_reward_with_name: string;
        referred_and_get_reward_without_name: string;
      };
    };
    tab_mission: {
      newbie_challenge: {
        newbie: string;
        challenge: string;
        of: string;
        description: string;
        prev: string;
        next: string;
        task: string;
        task_1: {
          join_harvest_moon: string;
          receive_basic_contract: string;
        };
        task_2: {
          reach_player_level_3: string;
          receive_advanced_contract: string;
        };
        task_3: {
          reach_container_level_3: string;
          reach_lab_level_3: string;
          receive_expert_contract: string;
          button_upgrade_now: string;
        };
      };
      new_missions: {
        active_forever: string;
        active_for: string;
        vote: string;
        surprise_partnership_title: string;
        surprise_partnership_desc: string;
        meteor_master_card_desc: string;
        coming_soon: string;
        get_alpha_access_title: string;
        get_alpha_access_desc: string;
        ended: string;
        staked: string;
        delayed: string;
      };
      meme_season_7: {
        tab_title: {
          [key in EMissionVoteXRefTabs]: string;
        };
        phase_1: {
          page_title: string;
          title_1: string;
          title_2: string;
          description: string;
          tab_content: {
            info: {
              campaign_info: {
                title: string;
                voting_period: string;
                voting_period_tooltip: string;
                snapshot_period: string;
                snapshot_period_desc: string;
                unstaking_available: string;
                unstaking_available_desc: string;
                day_lock: string;
                minimum_stake: string;
                minimum_stake_desc: string;
              };
              participation_info: {
                title: string;
                advanced_contract: string;
                raffle_ticket: string;
              };
              rewards_info: {
                title: string;
                gear: string;
                contract: string;
                token: string;
              };
              milestone_info: {
                title: string;
                description: string;
              };
            };
            unstake: {
              coming_soon: string;
              unstake_period: string;
              description_unstaking: string;
            };
            myreward: {
              title: string;
              coming_soon: string;
              button_claimed: string;
              button_claimable: string;
              button_not_qualified: string;
            };
          };
        };
        phase_2: {
          page_title: string;
          title_1: string;
          title_2: string;
          description: string;
          tab_content: {
            info: {
              campaign_info: {
                title: string;
                voting_period: string;
                snapshot_period: string;
                snapshot_period_desc: string;
                unstaking_available: string;
                unstaking_available_desc: string;
              };
              participation_info: {
                title: string;
                advanced_contract: string;
                raffle_ticket: string;
              };
              rewards_info: {
                title: string;
                gear: string;
                contract: string;
                token: string;
              };
              milestone_info: {
                title: string;
                description: string;
              };
            };
            stake: {
              stake_period: string;
            };
            unstake: {
              coming_soon: string;
              unstake_period: string;
              description_unstaking: string;
            };
            myreward: {
              title: string;
              coming_soon: string;
              button_claimed: string;
              button_claimable: string;
              button_not_qualified: string;
            };
          };
        };
      };
      section_challenge: {
        title: string;
        description: string;
        button_start: string;
        label_challenge_list: string;
        button_remind_to_harvest: string;
        button_claim: string;
        label_tier: string;
        label_basic_info: string;
        label_friend_quests: string;
        label_last_7_days_contribution: string;
        label_filter_by_status: string;
        label_active: string;
        label_inactive: string;
        text_inactive: string;
        button_filter: string;
        label_no_friend_yet: string;
        label_refer_and_earn_reward: string;
        text_share: string;
        label_refer_and_earn_desc: string;
        label_refer_and_earn_desc_2: string;
        label_refer_and_earn_desc_3: string;
        label_refer_and_earn_desc_4: string;
        button_verify_telegram: string;
        label_friend_list: string;
        button_remind_to_harvest_all: string;
        button_click_to_refresh: string;
        label_tier_level: string;
        label_container_level: string;
        label_lab_level: string;
      };
      section_profile: {
        label_player_tier: string;
        label_total_earned: string;
      };
      section_missions: {
        text_upgrade_tier_not_tier_3: string;
        text_upgrade_tier_tier_3: string;
        button_upgrade_now: string;
        coming_soon: string;
      };
      section_home: {
        missions: string;
        mission: string;
        coming_soon: string;
        title: string;
        flash_missions: string;
        streak_missions: string;
        flash_mission_list: string;
        streak_mission_list: string;
        prize_pool: string;
        newbie_title: string;
        newbie_subtitle: string;
        phase1_title: string;
        phase1_subtitle: string;
        phase2_title: string;
        phase2_subtitle: string;
        streak: string;
      };
      section_coming_soon: {
        title_xref: string;
        title_gear: string;
        subtitle_xref: string;
        subtitle_gear: string;
        coming_soon: string;
        title: string;
        days: string;
        hours: string;
        minutes: string;
        button_back: string;
      };
      mission_content: {
        [EMissionSubType.SWAP_TO]: {
          title: string;
          description: string;
          total_count: string;
        };
        [EMissionSubType.BRIDGE_FROM]: {
          title: string;
          description: string;
          total_count: string;
        };
        [EMissionSubType.HM_TIME_TRAVEL]: {
          title: string;
          description: string;
          total_count: string;
        };
      };
      section_mission_detail: {
        day_streak: string;
        mission_details: string;
        eligible_tokens: string;
        today_progress: string;
        mission_accomplished: string;
        continue_streak: string;
        live: string;
        token_drop_rewards: string;
        usdc_giveaway: string;
        streak_mission_list: string;
        reward: string;
        btn_letsgo: string;
        btn_swap: string;
        btn_bridge: string;
        btn_time_travel: string;
        day1: string;
        day2: string;
        day3: string;
        day4: string;
        day5: string;
        day6: string;
        day7: string;
        view_info: string;
        see_more: string;
      };
    };
    tab_tinker: {
      section_production_rate: {
        title: string;
        label_moon_per_hour: string;
        button_recruit: string;
      };
      section_active_tinkers: {
        title: string;
        subtitle: string;
        subtitleExtra: string;
        button_fusion: string;
        label_the: string;
        label_new_production_rate: string;
        label_moon_per_hour: string;
        tooltip_fusion: string;
      };
      section_union_contracts: {
        title: string;
        subtitle: string;
      };
      toast: {
        recruiting_tinker: string;
        recruit_tinker_failed: string;
      };
      modal: {
        no_new_mph: {
          title: string;
        };
        tinker_fusion: {
          title: string;
          description: string;
          label_how_many: string;
          label_to_fusion: string;
          tooltip_to_fusion: string;
          label_burn: string;
          label_to_increase_success_rate: string;
          label_total_moon_cost: string;
          label_total_gear_cost: string;
          label_balance: string;
          label_success_rate: string;
          label_info: string;
          button_start_fusion: string;
          warning_not_enough_gear: string;
          button_buy_now: string;
        };
        tinker_production_rate: {
          title: string;
          subtitle: string;
          upgrade: string;
          relics: string;
          desc1: string;
          desc2: string;
          desc3: string;
          totalTinkers: string;
          labCapacity: string;
          relic_boost: string;
          production_rate: string;
        };
      };
    };
    tab_upgrade: {
      section_lab_stats: {
        title: string;
        label_container: string;
        label_moonlight_storage: string;
        label_lab_capacity: string;
        label_maximum_tinker: string;
        button_upgrade: string;
      };
      section_experiments: {
        title: string;
        label_relics: string;
        label_moon_exchange: string;
        label_boost: string;
        label_left: string;
        text_countdown_info: string;
      };
      subpage_gear_relics: {
        title: string;
        label_unlock_relic_slot: string;
        text_unlock_relic_slot: string;
        label_current_balance: string;
        button_buy_gear: string;
        section_boost_rate: {
          label_boost_rate: string;
          label_equipped_relics: string;
        };
        section_forge_relic: {
          label_forge_relic: string;
          label_burn_gear_1: string;
          label_burn_gear_2: string;
          label_buy_sell_relic: string;
          text_buy_sell_relic: string;
          label_harvest_moon_relic: string;
          text_harvest_moon_relic: string;
          label_union_contract_relic: string;
          text_union_contract_relic: string;
          label_gear_relic: string;
          label_other_relic: string;
          label_gear_relic_on_paras: string;
          label_gear_relic_on_tradeport: string;
          text_gear_relic: string;
        };
        section_relics: {
          title: string;
          label_drop_rate: string;
          label_rarity: string;
          label_boost_rate: string;
          label_total: string;
          label_unequip: string;
          label_unequip_cooldown: string;
          text_maturity: string;
          warning_no_relics: string;
        };
      };
      subpage_moon_exchange: {
        title: string;
        label_select_asset_to_exchange_with: string;
        label_conversion_rate: string;
        label_click_to_start_convert: string;
        section_exchange: {
          title: string;
          label_asset_to_receive: string;
          label_asset_to_exchange_with: string;
          label_you_are_going_to_convert: string;
          label_to: string;
          button_conversion_rate: string;
          button_convert: string;
        };
      };
      toast: {
        exchange_success: string;
        forging_relic: string;
        forging_relic_success: string;
        unlocking_relic_slot: string;
        unlocking_relic_slot_success: string;
        equip_relic_success: string;
        unequip_relic_success: string;
        upgrade_container_success: string;
        upgrade_lab_success: string;
        sunset_gear: string;
        button_unstake: string;
        button_forge: string;
        button_close: string;
        button_equip: string;
        button_unlock: string;
      };
    };
    relic_rarity: {
      [key in EHarvestMoon_RelicRarity]: string;
    };
    tier: {
      tier_name_1: string;
      tier_name_2: string;
      tier_name_3: string;
      tier_description_1: string;
      tier_description_2: string;
      tier_description_3: string;
      benefits: {
        one_gas_free_transaction_everyday: string;
        eligible_for_basic_contracts_during_harvest_lotteries: string;
        harvest_anytime_without_waiting_period: string;
        chance_to_get_advanced_contract_during_harvest: string;
        chance_to_get_expert_contract_during_harvest: string;
        unlock_missions_feature: string;
        automated_harvest: string;
        automated_recruit_when_you_get_contract_from_harvesting: string;
      };
      conditions: {
        hold_3_near_in_your_wallet_description: string;
        hold_3_near_in_your_wallet_button: string;
        set_a_password_for_your_wallet_description: string;
        set_a_password_for_your_wallet_button: string;
        backup_your_seedphrase_description: string;
        backup_your_seedphrase_button: string;
        stake_5_near_in_meteor_validator: string;
        stake_5_near_in_meteor_validator_description: string;
      };
    };
    wallet_link: {
      wallet_link: string;
      pick_wallet_to_link: string;
      link_selected_account: string;
      linked_to: string;
      button_back_to_home: string;
      modal: {
        title: string;
        description: string;
        button_confirm: string;
        button_back: string;
      };
    };
    wallet_link_select_primary: {
      primary_wallet_explanation: string;
      confirm_primary_wallet: string;
      primary_wallet: string;
    };
    new_onboarding: {
      label_player_name: string;
      label_creating_account: string;
      label_linking_telegram: string;
      label_not_enough_balance: string;
      label_adding_access_key: string;
      label_initializing_account: string;
      text_disclaimer_starting: string;
      text_disclaimer_consumed: string;
      button_create_account: string;
      button_next: string;
      button_start: string;
      modal: {
        label_or: string;
        deposit: {
          title: string;
          description: string;
          text_your_telegram_has_been_linked: string;
          label_or: string;
          button_verify_telegram_account: string;
          button_deposit_near: string;
        };
        insufficient_balance: {
          title: string;
          description_1: string;
          description_2: string;
          description_3: string;
          description_4: string;
          description_5: string;
          button_top_up: string;
        };
      };
    };
    maintenance: {
      title: string;
      description: string;
      footer: string;
      label_migration_notice: string;
      button_learn_more: string;
    };
    social_onboarding: {
      join_telegram: string;
      join_twitter: string;
      complete_to_start: string;
      ready_to_start: string;
      start: string;
    };
    landing: {
      title: string;
      button_apply_now: string;
      button_back_to_meteor: string;
    };
    main: {
      text_wallet_address: string;
      text_total_moon_token: string;
      text_max: string;
      text_per_hour: string;
      text_harvesting: string;
      text_full_moon: string;
      text_moon_balance: string;
      warning_connect_telegram: string;
      warning_save_credentials: string;
      warning_storage_full: string;
      button_harvest: string;
      button_next_harvest: string;
      button_harvest_moon: string;
      button_to_wallet: string;
    };
    onboarding: {
      main: {
        title: string;
        description: string;
        label_link_telegram: string;
        description_link_telegram: string;
        label_add_access_key: string;
        description_add_access_key: string;
        label_initialize_account: string;
        description_initialize_account: string;
        label_go_to_moon: string;
        description_go_to_moon: string;
        message_linked: string;
        message_linked_no_tg: string;
        message_not_linked: string;
        message_tg_linked: string;
        message_gas_free: string;
        message_network_fee: string;
        message_deposit_fee: string;
        warning_wallet_already_linked: string;
        button_link: string;
        button_add: string;
        button_init: string;
        button_go: string;
      };
      warning: {
        title: string;
        text_basic_union_contract: string;
        text_gas_free: string;
        text_transaction: string;
        text_new_access_key_required: string;
        message: string;
        warning: string;
        button_proceed: string;
        button_cancel: string;
      };
      step_1: {
        message: string;
        button_continue: string;
      };
      step_2: {
        message_not_verified: string;
        message_verified: string;
        option_continue: string;
        option_cancel: string;
      };
      step_3: {
        message: string;
        button_continue: string;
        button_try_again: string;
      };
      step_4: {
        message_setting_up_account: string;
        message_not_enough_balance: string;
        option_try_again: string;
        option_back: string;
      };
      step_5: {
        message: string;
        button_ok: string;
      };
    };
    tab: {
      title: {
        harvest: string;
        tinker: string;
        upgrade: string;
        mission: string;
      };
      lumen_lab: {
        title_lab_stats: string;
        label_container: string;
        text_upgrade_container: string;
        label_lab_capacity: string;
        text_upgrade_lab: string;
        text_hour: string;
        text_moonlight_storage: string;
      };
      tinker_recruitment: {
        text_moon_per_hour: string;
        text_active_tinkers: string;
        text_total_tinkers: string;
        text_lab_capacity: string;
        text_available_union_contracts: string;
        warning_min_tinker_count: string;
        button_recruit: string;
      };
      portal_referral: {
        text_coming_soon: string;
        text_my_frens: string;
        text_moon_earned: string;
        warning_no_telegram: string;
        warning_link_telegram: string;
        button_share_on_tg: string;
        button_share_on_x: string;
        button_copy_referral_link: string;
        button_link_to_telegram: string;
        content_share_on_x: string;
        content_share_on_tg: string;
      };
      setting: {
        warning_link_telegram_success: string;
        button_link_to_telegram: string;
        button_give_feedback: string;
        button_view_secret_phrase: string;
        button_export_private_key: string;
        button_quit_game: string;
      };
    };
    modal: {
      unopen_reward: {
        title: string;
        description: string;
        button_cool: string;
        reward_id: string;
        from: string;
      };
      link_to_telegram: {
        title: string;
        description: string;
        text_dont_show_again: string;
        button_link_wallet: string;
      };
      upgrade: {
        container: {
          title: string;
          description: string;
        };
        lab: {
          title: string;
          description: string;
        };
        label_current_level: string;
        label_upgrade_level: string;
        text_moon: string;
        button_upgrade: string;
      };
      maintenance: {
        title: string;
        description: string;
        button_report_issue: string;
      };
      leaderboard: {
        loading: string;
        title: string;
        text_rank: string;
        text_player_name: string;
        text_moon_hr_rate: string;
        text_total_players: string;
        button_close: string;
        label_boost: string;
        button_rank_higher: string;
        button_share: string;
        mission_menu_title: {
          [key in EMissionLeaderboardSubType]: string;
        };
        mission_value1_title: {
          [key in EMissionLeaderboardSubType]: string;
        };
        streak: string;
        tinker_lab_rankings: string;
        streak_rankings: string;
      };
      promo: {
        title: string;
        description_1: string;
        description_2: string;
        description_3: string;
        description_4: string;
        button_go: string;
      };
      menu: {
        title: {
          [key in EHarvestMoon_Menu]: string;
        };
        description: {
          [key in EHarvestMoon_Menu]: string;
        };
      };
      harvest_summary: {
        not_eligible: string;
        label_click_to_reveal_prize: string;
        label_you_have_won: string;
        label_and_token_drop: string;
        label_won_token_drop: string;
        button_click_to_continue: string;
        contract_type: {
          basic: string;
          advanced: string;
          expert: string;
        };
        title: string;
        description: string;
        congratulations: string;
        contract_drop: string;
        token_drop_campaign: string;
        criteria_not_met_title: string;
        criteria_not_met_desc: string;
        win_rate: string;
        better_luck_next_time_title: string;
        better_luck_next_time_desc_1: string;
        better_luck_next_time_desc_2: string;
        you_have_won: string;
        learn_more: string;
        you_got: string;
        view_more: string;
        traded: string;
        text_upgrade_container: string;
        text_upgrade_tier: {
          [key in EHarvestMoon_PlayerTier]: string;
        };
        label_upgrade_your_account: string;
        label_harvesting_longer_hours: string;
        label_enhance_your_moon_container: string;
        button_upgrade: string;
        button_enhance: string;
        subtitle: string;
        label_container_size: string;
        label_lab_capacity: string;
        label_total_moon_tokens: string;
        text_moon: string;
        text_moon_harvested: string;
        text_moon_per_hour: string;
        text_union_contract_chance: string;
        text_harvest_and_win: string;
        text_tinkers: string;
        text_get_referral: string;
        label_win: string;
        text_win: string;
        label_lose: string;
        text_lose: string;
        button_close: string;
        share_on_x: string;
        rank: string;
        content_share_on_x: string;
        label_next_time: string;
        text_next_time: string;
        label_new_moon_balance: string;
        label_drop_rate: string;
        hint_drop_rate: string;
        label_no_drop: string;
        label_drop: string;
        reward: string;
        result: string;
        win: string;
        try_again: string;
        win_odd: string;
        random_odd: string;
      };
      recruitment: {
        text_recruit_with: string;
        text_tinkers_to_recruit: string;
        warning_max_tinker_count: string;
        button_use_max: string;
        button_recruit: string;
      };
      recruitment_reveal: {
        text_the: string;
        text_moon_per_hour: string;
        button_skip: string;
        button_click_to_continue: string;
      };
      recruitment_summary: {
        title: string;
        text_mph: string;
        text_new_mph: string;
        button_ok: string;
        share_on_x: string;
        content_share_on_x: string;
        text_get_more_contract: string;
        text_referral_link: string;
        label_max_capacity_reached: string;
        button_details: string;
        button_upgrade_lab: string;
      };
      fusion_summary: {
        title: string;
        label_total_travelled: string;
        label_total_success: string;
        label_total_failed: string;
        content_share_on_x_success: string;
        content_share_on_x_failed: string;
      };
      account_verified: {
        title: string;
        description: string;
        button_ok: string;
      };
      coming_soon: {
        title: string;
      };
      warning: {
        title: string;
        button_ok: string;
      };
      production_guide: {
        title: string;
        text_moon_per_hour: string;
        text_with: string;
        text_hour: string;
        text_container: string;
        text_max_harvest: string;
        text_get_more_moon: string;
        text_get_more_hours: string;
        link_get_tinkers: string;
        link_upgrade_container: string;
      };
      storage_guide: {
        title: string;
        link_upgrade_container: string;
        text_your_storage: string;
        text_full_and_fills: string;
        text_every: string;
        text_hours: string;
        text_want_more_hours: string;
      };
      tinker_guide: {
        title: string;
        text_moon: string;
        text_harvest_rates: string;
        text_every_hour: string;
      };
    };
    tinker: {
      name: {
        "1": string;
        "2": string;
        "3": string;
        "4": string;
        "5": string;
      };
    };
    contract: {
      name: {
        [key in EHM_UnionContractTypes]: string;
      };
      fullname: {
        [key in EHM_UnionContractTypes]: string;
      };
      description: {
        [key in EHM_UnionContractTypes]: string;
      };
    };
    tinker_phase: {
      title: {
        [key in EHarvestMoon_TinkerGuideModalPhase]: string;
      };
      description: {
        [key in EHarvestMoon_TinkerGuideModalPhase]: string;
      };
    };
    share: {
      telegram: string;
    };
  };
  services: {
    near: {
      networkNames: {
        [key in ENearNetwork]: string;
      };
      networkNamesShort: {
        [key in ENearNetwork]: string;
      };
    };
    refresh: {
      refreshText: string;
      updatingText: string;
    };
    copy: {
      common: string;
      wallet: string;
      copy_id: string;
    };
    delete: {
      common: string;
      delete: string;
      cancel: string;
      delete_this_account: string;
      delete_this_account_note: string;
    };
    fund: {
      almost_there: string;
      check_now: string;
      checking: string;
      send_at_least: string;
      fund_via_testnet: string;
      checking_again_in: string;
      error_occurred: string;
    };
    user: {
      needLogin: string;
    };
  };
  buttonText: {
    createNewAccount: TBasicTrans;
    importAccount: TBasicTrans;
    updateText: string;
    continueText: string;
    confirmText: string;
    createWallet: string;
  };
  sidebarUi: {
    button_addWallet: string;
    button_settings: string;
    button_signOut: string;
    noWalletBlurb: string;
    notSignedInBlurb: string;
  };
  mainUi: {
    menu_button_wallets: string;
    heading_myAssets: string;
    button_deposit: string;
    button_send: string;
    button_stake: string;
    button_swap: string;
    button_explore: string;
    button_bridge: string;
    updating: string;
  };
  common: {
    errors: {
      title_unknown_error: string;
      desc_unknown_error: string;
    };
    maintenance: {
      title_maintenance: string;
      desc_maintenance: string;
    };
    error_ids: {
      [key in EOldMeteorErrorId | EErrorId_AccountSignerExecutor | EErr_NearLedger]: string;
    };
    transaction_not_safe_ids: {
      [key in ETransactionNotSafeId]: {
        title: string;
        desc: string;
      };
    };
  };
  pageContent: {
    walletDeposit: {
      heading_deposit: string;
      text_copy_wallet: string;
    };
    linkdrop: {
      title_incorrect_link_format: string;
      description_incorrect_link_format: string;
      title_drop_claimed: string;
      description_drop_claimed: string;
      title_received_drop: string;
      title_received_ft_drop: string;
      description_received_drop: string;
      claim: string;
      claim_with_following_account: string;
      claim_with_new_account: string;
      claim_success_title: string;
      claim_success_description: string;
      claim_success_with_redirect_description: string;
      something_went_wrong_title: string;
      something_went_wrong_description: string;
      or: string;
    };
    linkdropClaimedSuccess: {
      title: string;
      subtitle: string;
      button_redirect: string;
    };
    topup: {
      heading_get_near: string;
      buy_near: string;
      onramper_description: string;
      bridge_from_eth_aurora: string;
      rainbow_bridge_description: string;
      supported_cex: string;
      okx_description: string;
      binance_description: string;
      huobi_description: string;
      kraken_description: string;
    };
    addressBook: {
      text_noAddressesFound: string;
      heading_otherOwnedAccounts: string;
      heading_savedAccounts: string;
      heading_recentlyUsedAccounts: string;
    };
    importWallet: {
      heading_passwordSection: string;
      blurb_passwordSection: string;
      heading_inputPhraseSection: string;
      blurb_inputPhraseSection: string;
      heading_chooseInputType: string;
      // blurb_chooseInputType: string;
      heading_inputPrivateKeySection: string;
      blurb_inputPrivateKeySection: string;
      heading_confirmAccount: string;
      blurb_confirmAccount: string;
      toast_title_noAccountFound: string;
      toast_text_noAccountFound: string;
      toast_title_unknownError: string;
      toast_text_unknownError: string;
      toast_text_invalidKey: string;
      a_12_word_secret: string;
      secret_phrase: string;
      private_key: string;
      private_key_desc: string;
      hardware: string;
      hardware_desc: string;
      words_12: string;
      private_crypto_key: string;
      find_my_account: string;
      account: string;
      already_imported: string;
      text_approve_ledger: string;
      dont_see_wallet: string;
      manual_import_here: string;
    };
    manualImport: {
      manual_import_account: string;
      import: string;
      insert_your_account_id: string;
      incorrect_account_id: string;
      account_not_exist_or_not_match: string;
      account_info_network_error: string;
      account_found_and_import: string;
      close: string;
    };
    importWalletHardware: {
      title: string;
      subtitle: string;
      toast_title_noAccountFound: string;
      toast_text_noAccountFound: string;
    };
    createWalletHardware: {
      title: string;
      subtitle: string;
      button_confirm: string;
      toast_title_noAccountFound: string;
      toast_text_noAccountFound: string;
    };
    meteorCard: {
      home: {
        subtitle: string;
        early_access_end: string;
        view_perks: string;
        apply_now: string;
      };
      perkModal: {
        title1: string;
        title2: string;
        item_title1: string;
        item_subtitle1: string;
        item_title2: string;
        item_subtitle2: string;
        item_title3: string;
        item_subtitle3: string;
      };
      signup: {
        title: string;
        subtitle: string;
        email: string;
        country: string;
        country_placeholder: string;
        estimate_usage: string;
        early_access_perks: string;
        button_proceed: string;
        end_in: string;
        error_registered: string;
        error_signup_status_not_ready: string;
      };
      myApplication: {
        application_applied: string;
        title: string;
        subtitle: string;
        wallet_id: string;
        email: string;
        country: string;
        country_placeholder: string;
        cancel: string;
        update: string;
        error_cancel_status_not_ready: string;
      };
      insufficientBalance: {
        title: string;
        subtitle: string;
        back: string;
        topup: string;
      };
      estimateUsageOption: {
        [EMeteorCardEstimateUsage.below_250]: string;
        [EMeteorCardEstimateUsage.from_250_to_1000]: string;
        [EMeteorCardEstimateUsage.above_1000]: string;
      };
    };
    appSettings: {
      heading_settings: string;
      button_language: string;
      // button_subtext_language: string;
      button_addressBook: string;
      button_subtext_addressBook: string;
      button_autoLockTimer: string;
      button_subtext_autoLockTimer: string;
      button_changePassword: string;
      button_removePasswordProtection: string;
      checkbox_removePasswordWarning: string;
      button_subtext_changePassword: string;
      button_meteorCommunity: string;
      button_subtext_meteorCommunity: string;
      button_giveFeedback: string;
      button_subtext_giveFeedback: string;
      button_aboutMeteor: string;
      button_subtext_aboutMeteor: string;
      sectionConnectedApp: {
        text_deauthorize: string;
        // text_deauthorize_all: string;
        text_gasFeeAllowance: string;
        text_allowedMethod: string;
        text_any: string;
        text_unlimitedAllowance: string;
      };
      sectionDeleteAccount: {
        text_warning: string;
        text_delete_password: string;
        text_action_desc: string;
        text_remove_account: string;
      };
      sectionProfile: {
        update_profile_warning: string;
        update_pfp_warning: string;
        pfp_updated: string;
        profile_updated: string;
        name: string;
        about: string;
        update: string;
        set_pfp: string;
        pfp_tooltip: string;
        sync_near_social: string;
        sync_near_social_header: string;
        sync_near_social_desc: string;
        sync_now: string;
        account_synced: string;
        follower: string;
      };
      sectionChangePassword: {
        text_password_changed_success: string;
        text_password_removed_success: string;
        text_change_password_warning: string;
        text_finish: string;
        text_change_password: string;
        text_create_password: string;
      };
      sectionAccessKey: {
        text_add_key: string;
        text_edit_label: string;
        text_revoke_access: string;
        text_revoke_access_key: string;
        text_remove_key_desc: string;
        text_cancel: string;
        text_remove_key: string;
        text_primary_key: string;
        text_hardware_key: string;
        text_hardware_ledger_key: string;
        text_public_key: string;
        text_known_data: string;
        text_private_key: string;
        text_hd_path: string;
        text_secret_phrase: string;
        text_unknown_to_meteor: string;
        text_access_key_warning_msg: string;
        text_access_key: string;
        text_add_key_subtitle: string;
        text_access_key_label: string;
        text_generate_new_key: string;
        text_generate_new_key_desc: string;
        text_clear_label: string;
      };
      sectionCommunity: {
        text_communityBlurb: string;
        text_thank_you: string;
        text_follow_twitter: string;
        text_report_bug: string;
        text_join_discord: string;
      };
    };
    explore: {
      text_explore: string;
      text_challenges: string;
      text_missions: string;
      text_gear_staking: string;
      text_rewards: string;
      trending_projects: string;
      defi: string;
      nfts: string;
      near_ecosystem: string;
      hide: string;
      show: string;
      tonic_desc: string;
      spin_desc: string;
      burrow_desc: string;
      perk_desc: string;
      pembrock_desc: string;
      meta_yield_desc: string;
      paras_desc: string;
      tradeport_desc: string;
      antisocial_desc: string;
      near_social_desc: string;
      near_crash_desc: string;
      challenge: {
        btn_view_details: string;
        btn_view_winners: string;
        btn_accept_challenge: string;
        btn_challenge_accepted: string;
        status: {
          [key in EChallengeStatus]: string;
        };
      };
      mission: {
        label_my_profile: string;
        label_level: string;
        label_points_earned: string;
        label_global_ranking: string;
        text_mission_unlock: string;
        label_daily_tasks: string;
        label_daily_task: string;
        label_points_reward: string;
        label_earn_more_side_quest: string;
        label_completed: string;
        label_earned: string;
        button_start_now: string;
        button_completed: string;
        user_consent: {
          label_title: string;
          label_description: string;
          button_accept: string;
          text_note: string;
        };
        no_daily_task: string;
        no_side_quest: string;
        toast_mission_sign_up_success: string;
      };
      reward: {
        label_collected_points: string;
        label_redeem: string;
        label_redeem_history: string;
        label_claim_reward: string;
        label_left: string;
        button_redeem: string;
        button_harvest: string;
        button_claim: string;
        code_required_to_claim: string;
        placeholder_for_redeem_code: string;
        no_redeem_title: string;
        no_redeem_description: string;
        no_claim_reward_title: string;
        no_claim_reward_description: string;
      };
    };
    walletSwap: {
      swap: string;
      confirm_swap: string;
      something_wrong: string;
      failed_build_transaction: string;
      preparing_transaction: string;
      getting_transaction_ready: string;
      executing_step: string;
      calling: string;
      you_receive: string;
      you_pay: string;
      swap_successful: string;
      swap_success_desc: string;
      swap_failed: string;
      swap_failed_desc: string;
      close: string;
      review_swap: string;
      route_not_found: string;
      inadequate_balance: string;
      show_all_routes: string;
      to_contract: string;
      do_no_close_page: string;
      provider: string;
      price_impact: string;
      meteor_fee: string;
      meteor_fee_desc: string;
      provider_fee: string;
      network_fee: string;
      swap_fee: string;
      route: string;
      minimum_received: string;
      best_route: string;
      find_token_hint: string;
      label_swap_details: string;
      label_please_enter_amount: string;
      label_select_token: string;
      hint_search_token: string;
      label_slippage: string;
      button_confirm: string;
      title_slippage: string;
      desc_slippage: string;
      label_support_fees: string;
      label_loading: string;
      label_fees: string;
      label_quote: string;
      label_error_message: string;
      label_successful: string;
      description_success: string;
      description_failed: string;
      label_swap_summary: string;
      label_you_send: string;
      label_you_received: string;
      button_back_to_home: string;
      button_back_to_redirect_url: string;
      button_try_again: string;
      title_slippage_error: string;
    };
    walletStake: {
      liquid_staking: string;
      standard_staking: string;
      liquid_staking_desc: string;
      standard_staking_desc: string;
      create_new_staking: string;
      create_new_staking_desc: string;
      my_staked_validators: string;
      display_newly_staked_note: string;
      search_validator: string;
      load_more: string;
      something_wrong: string;
      staking_failed: string;
      staking_failed_went_wrong: string;
      unstake_failed: string;
      unstake_failed_went_wrong: string;
      staked_success: string;
      staked_success_msg: string;
      unstaked_success: string;
      unstaked_success_msg: string;
      review_staking: string;
      review_unstaking: string;
      you_stake: string;
      you_unstake: string;
      you_receive: string;
      validator_details: string;
      confirm: string;
      staking: string;
      close: string;
      stake: string;
      unstake: string;
      to: string;
      from: string;
      create_liquid_staking: string;
      liquid_unstake: string;
      inadequate_balance: string;
      minimum_liquid_note: string;
      staking_details: string;
      you_are_staking: string;
      staking_with: string;
      days: string;
      estimated_earnings: string;
      select_your_validator_pool: string;
      select_validator: string;
      insufficient_balance: string;
      use_max: string;
      available: string;
      create_standard_staking: string;
      amount_to_unstake_in: string;
      active: string;
      reward_token_s: string;
      inactive: string;
      total_staked: string;
      estimated_apy: string;
      staked_near: string;
      staked_near_tooltip: string;
      unclaimed_reward: string;
      unclaimed_reward_tooltip: string;
      you_unstaking: string;
      usually_take_72_hour_unstake: string;
      unstaked_ready_to_claimed: string;
      claim_unstaked: string;
      stake_more: string;
      claim_reward: string;
      provider: string;
      liquid_unstake_fee: string;
      unlock_period: string;
      total_near_staked: string;
      balance: string;
      value_in_near: string;
      and_it_usually_takes: string;
      to_unstake: string;
      delayed_unstake: string;
    };
    walletSend: {
      heading_send: string;
      button_useMax: string;
      tooltip_addressBook: string;
      use_max: string;
      available: string;
      no_account_provide: string;
      account_id_note_1: string;
      account_id_note_2: string;
      account_id_note_3: string;
      account_check_errors: {
        [key in EAccountErrorType]: string;
      };
      error_empty_amount: string;
      warning_address_non_standard: string;
      sending_bridged_token_alert: string;
      account_no_exists_warning: string;
      named_account_no_exists_warning: string;
      account_no_exists_warning_deposit: string;
      sending: string;
      to: string;
      account_exists: string;
      send: string;
      confirm_send: string;
      finish: string;
      txID: string;
      sendFtSuccess: string;
      sendSuccess: string;
      mode_not_support: string;
      input_heading_selectAsset: string;
      input_heading_sendTo: string;
      input_placeHolder_sendTo: string;
      input_error_ft: string;
      text_accountIdInfo: string;
      receiver_balance: string;
      receiver_balance_fail: string;
      address_display_is_own_warning: string;
    };
    signTx: {
      potentially_do_some_kind_of_action: string;
      does_not_execute_on_blockchain: string;
      receiving_from_dapp: string;
      couldnt_parse_arg_login: string;
      couldnt_parse_arg_logout: string;
      connect_request: string;
      connect_with_acc: string;
      this_app_would_like_to: string;
      know_your_add: string;
      know_your_balance: string;
      network_fee_placeholder: string;
      network_fee_allowance: string;
      something_went_wrong: string;
      create_import_wallet: string;
      contract: string;
      connect: string;
      already_submitted_part_1: string;
      already_submitted_part_2: string;
      finished_success_part_1: string;
      // finished_success_part_2: string;
      finished_error_part_1: string;
      finished_error_part_2: string;
      close_wallet: string;
      cancel: string;
      request_logout_could_not_found: string;
      request_logout_sign_out_anyway: string;
      sign_out_request: string;
      sign_out_desc: string;
      wallet: string;
      logout: string;
      couldnt_parse_arg_verify: string;
      request_authentication_not_found: string;
      verification_request: string;
      verification_request_desc: string;
      sign_message_request_title: string;
      sign_message_request_desc: string;
      sign_message_request_submit_text: string;
      sign_message_with_account: string;
      message_to_be_signed: string;
      view_full_message: string;
      close_sign_message_full_details: string;
      verify_account: string;
      select_account: string;
      know_your_chosen_wallet_add: string;
      verify_own_wallet_add: string;
      does_not_allow: string;
      calling_method_on_behalf: string;
      verify: string;
      estimated_changes: string;
      send: string;
      you_sending_asset: string;
      you_sending_assets: string;
      couldnt_parse_arg_tx: string;
      approve_transactions: string;
      approve_transaction: string;
      transaction: string;
      approve: string;
      close_details: string;
      view_transaction_details: string;
      transaction_details: string;
      fees_tooltips: string;
      fees_assurance: string;
      fees: string;
      with_deposit: string;
      from: string;
      to: string;
    };
    walletHome: {
      subtext_availableFunds: string;
      tooltip_availableFunds: string;
      warning_needsRecoveryBackup: string;
      warning_needsRecoveryBackup_desc: string;
      warning_needsRecoveryBackup_btn: string;
      warning_insecureWallet: string;
      warning_insecureWallet_desc: string;
      warning_insecureWallet_btn: string;
      warning_networkIssue_desc: string;
      warning_networkIssue_title: string;
      warning_scamTokenCount: string;
      warning_scamTokenCount_multi: string;
      warning_hiddenTokenCount: string;
      warning_hiddenTokenCount_multi: string;
      button_updates: string;
      tooltip_recent_updates: string;
      tooltip_total_balance: string;
      tooltip_storage_reserve: string;
      tooltip_gas_reserve: string;
      tooltip_spendable: string;
      import_token: {
        title: string;
        description: string;
        placeholder: string;
        button_add_token: string;
        market_price: string;
        my_balance: string;
        my_balance_in_usd: string;
        warning_please_enter_token: string;
        warning_invalid_token: string;
        toast_title_token_added: string;
        toast_text_token_added: string;
      };
    };
    walletConnect: {
      blurb_noAccountFound: string;
    };
    wallet: {
      max: string;
      heading_walletLocked: string;
      blurb_walletLocked: string;
      button_unlockWallet: string;
      toast_heading_passwordIncorrect: string;
      toast_text_passwordIncorrect: string;
      settings: {
        settings: string;
        heading_settings: string;
        input_heading_extractSecret: string;
        input_text_extractSecret: string;
        input_heading_exportPrivateKey: string;
        input_text_exportPrivateKey: string;
        input_heading_managePrivateKeys: string;
        input_text_managePrivateKeys: string;
        input_heading_walletLabel: string;
        input_text_walletLabel: string;
        menu_heading_profile: string;
        menu_text_profile: string;
        menu_heading_connectedApps: string;
        menu_text_connectedApps: string;
        menu_heading_securityAndRecovery: string;
        menu_text_securityAndRecovery: string;
        menu_heading_changePassword: string;
        menu_heading_RemoveWalletAccount: string;
        menu_text_removeWalletAccount: string;
        menu_text_changePassword: string;
        common: {
          enterPasswordBlurb: string;
          account_not_created_secret_note_1: string;
          account_not_created_secret_note_2: string;
          account_not_created_secret_note_3: string;
          enterPasswordCreateWalletBlurb: string;
        };
        exportPrivateKey: {
          text_subheadingWarning: string;
          text_copiedToClipboard: string;
        };
        manageAccessKeys: {
          input_text_accessKeyLabel: string;
          button_updateLabel: string;
        };
      };
    };
    signIn: {
      blurb: string;
      welcome: string;
      input_header_password: string;
      button_unlock: string;
      text_forgot_password: string;
      toast_heading_passwordIncorrect: string;
      toast_text_passwordIncorrect: string;
    };
    addWallet: {
      heading_meteorWallet: string;
      blurb: string;
      button_create_new_wallet: string;
      button_subtext_create_new_wallet: string;
      button_import_wallet: string;
      button_subtext_import_wallet: string;
      text_named_wallet: string;
      text_named_wallet_desc: string;
      text_unavailable: string;
    };
    createNewWallet: {
      heading_newWallet: string;
      heading_newWalletChoice: string;
      p4_please_try_again: string;
      p4_unforunately_something_went_wrong: string;
      please_insert_password: string;
      subheading_newWalletChoice: string;
      requires_initial_balance: string;
      random_64_character: string;
      next: string;
      traditional_crypto_wallet: string;
      new_wallet: string;
      available_near: string;
      available_fund: string;
      initial_wallet_balance: string;
      initial_wallet_balance_named_wallet: string;
      select_funding_wallet: string;
      no_account_selected: string;
      account_not_exist: string;
      not_enough_funds: string;
      initial_funding_amount: string;
      account_identity: string;
      account_identity_desc: string;
      is_available: string;
      username_is_available: string;
      account_already_exists: string;
      account_not_compatible: string;
      account_can_contain: string;
      lowercase_characters: string;
      digits: string;
      character_requirement: string;
      account_cannot_contain: string;
      character_dot: string;
      more_than_64_characters: string;
      fewer_than_2_characters: string;
      explore_web3: string;
      step_into_future: string;
      generateNew: string;
      claimIdentity: string;
      button_create_with_ledger: string;
      captcha_error_message: string;
      exceed_request_limit: string;
      Section_P1_PickWalletName: {
        use_ledger_device: string;
      };
      extensionCreate: {
        title: string;
        description: string;
        button_import: string;
        button_open_web_wallet: string;
      };
    };
    extensionConnect: {
      title_extensionInstalled: string;
      blurb_extensionInstalled: string;
      button_text_continueToApp: string;
    };
    gettingStarted: {
      blurb: string;
      welcomeToMeteor: string;
      button_getStarted: string;
    };
    createPassword: {
      agreeToTerms: (link: string) => ReactElement;
      buttons: {
        continue: string;
      };
      heading: string;
      blurb: string;
      placeholders: {
        enterPassword: string;
        confirmPassword: string;
      };
      validation: {
        atLeast8: string;
        doNotMatch: string;
        strengthTooWeak: string;
        strengthWeak: string;
        strengthMedium: string;
        strengthStrong: string;
      };
    };
    recoveryPhrase: {
      toasts: {
        copiedToClipboard: string;
      };
      buttons: {
        continue: string;
        generateNew: string;
        copy: string;
      };
      confirmSavedPhrase: string;
      blurb: string;
      heading: string;
    };
    seedPhraseConfirmation: {
      buttons: {
        confirm: string;
        back: string;
      };
      wordForFirst: string;
      wordForLast: string;
      confirmationWrongHeading: string;
      confirmationWrongBlurb: string;
      profilePasswordMismatchHeading: string;
      profilePasswordMismatchBlurb: string;
      heading: string;
      blurb: string;
    };
    accountSuccess: {
      heading: string;
      blurb: string;
      followUsOnTwitter: string;
      joinDiscord: string;
      button_finish: string;
      button_redirect: string;
      toast_title: string;
      toast_title_with_redirect: string;
      toast_redirect_whitelisted_failed: string;
    };
    transactions: {
      heading_history: string;
      typeName: {
        [key in ETransactionType]: string;
      };
      badgeStatus: {
        [key in ETransactionBadgeStatus]: string;
      };
      actionTitle: {
        [key in ENearIndexer_ActionType]: string;
      };
      common: {
        call: string;
        status: {
          success: string;
          failed: string;
          unknown: string;
        };
      };
      loadingBottom: {
        more: string;
        loading: string;
        end: string;
        endTransaction90Days: string;
      };
      direction: {
        from: string;
        to: string;
        with: string;
      };
      accessKey: {
        addKey: string;
        deleteKey: string;
        key: string;
        permissionTypes: {
          [key in ENearIndexer_AccessKeyPermission]: string;
        };
        publicKey: string;
        receiverId: string;
        allowMethodNames: string;
        emptyMethodNames: string;
        allowance: string;
      };
      account: {
        createTitle: string;
        createdMessage: string;
        deletedMessage: string;
        publicKey: string;
        deposit: string;
        byId: string;
        beneficiaryId: string;
      };
      deploy: {
        code: string;
        message: string;
      };
      functionCall: {
        brief: string;
        details: string;
        cost: string;
        deposit: string;
        args: string;
      };
      details: {
        transactionHash: string;
        includedInBlockHash: string;
        includedInChunkHash: string;
        blockTimestamp: string;
        signerAccountId: string;
        signerPublicKey: string;
        receiverAccountId: string;
        convertedIntoReceiptId: string;
        receiptConversionBurnt: string;
        moreInformation: string;
        lessInformation: string;
        action: string;
        viewExplorer: string;
      };
      custom: {
        ftSwap: {
          title: string;
          near: string;
        };
        nftTrade: {
          direction: {
            [key in ENftOfferDir]: string;
          };
        };
      };
    };
    nftCollection: {
      heading_nft: string;
      nothing: string;
      total_nfts: string;
      total_floor_price: string;
      total_floor: string;
      floor_price: string;
      contract: string;
    };
    nftDetails: {
      button_send: string;
      button_explorer: string;
      button_view: string;
      heading_description: string;
      heading_properties: string;
    };
    voterModal: {
      title: string;
      description: string;
      description2: string;
      button_confirm: string;
      button_cancel: string;
      checkbox_dont_show: string;
    };
    execution: {
      step: string;
      of: string;
      transaction_hash: string;
      button_finish: string;
      title: string;
      checking: string;
      transaction_execution_status: {
        [key in ETransactionExecutionStatus]: string;
      };
    };
    ledger: {
      title: string;
      connected: string;
      button_try_again: string;
      ledger_device_alert: {
        [ELedgerConnectionStatus.connected]: {
          [key in ELedgerConnectedStatus]: string;
        };
        [ELedgerConnectionStatus.disconnected]: {
          [key in ELedgerDisconnectedStatus]: string;
        };
        need_version_update: string;
      };
      functionality_not_supported: string;
    };
  };
}

export enum ELanguage {
  en = "en",
  fr = "fr",
  id = "id",
  vi = "vi",
  zh = "zh",
}
