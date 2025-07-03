import { Link } from "@chakra-ui/react";
import { ENftOfferDir } from "@meteorwallet/app/src/components/sectionComponents/transaction_components/action_components/ui_components/Component_NftTradeUI";
import { ETransactionBadgeStatus } from "@meteorwallet/app/src/services/transactions";
import { EErrorId_AccountSignerExecutor } from "@meteorwallet/core-sdk/errors/ids/by_feature/old_meteor_wallet.errors";
import { EErr_NearLedger } from "@meteorwallet/ledger-client/near/MeteorErrorNearLedger";
import {
  ELedgerConnectedStatus,
  ELedgerConnectionStatus,
  ELedgerDisconnectedStatus,
} from "@meteorwallet/ledger-client/near/near_ledger.enums";
import { ENearNetwork } from "../../../modules_external/near/types/near_basic_types";
import {
  ENearIndexer_AccessKeyPermission,
  ENearIndexer_ActionType,
} from "../../../modules_external/near_public_indexer/types/near_indexer_basic_types";
import { ETransactionExecutionStatus } from "../../../modules_feature/accounts/near_signer_executor/NearAccountSignerExecutor.types";
import { EMeteorCardEstimateUsage } from "../../../modules_feature/defi_card/defi_card_constants";
import {
  EHM_UnionContractTypes,
  EHarvestMoon_Menu,
  EHarvestMoon_RelicRarity,
  EHarvestMoon_TinkerGuideModalPhase,
} from "../../../modules_feature/harvest_moon/harvest_moon_enums";
import { EMissionSubType } from "../../../modules_feature/missions/mission.dbi";
import { EChallengeStatus } from "../../../modules_feature/missions/mission_types";
import { ETransactionNotSafeId } from "../../../modules_feature/transactions/transaction_safety.types";
import { EOldMeteorErrorId } from "../../../modules_utility/old_errors/old_error_ids";
import type { ITranslations } from "../translation_types";

export const translation_en: ITranslations = {
  languageDisplayName: "English",
  languageCode: "en",
  bridge: {
    button_view_transaction: "View Transaction",
    intent_pending: {
      title: "Bridge Transfer in Progress",
      description:
        "You have an ongoing bridge transaction. Would you like to continue or create new one?",
      button_create_new_bridge: "Create New Bridge",
    },
    warning_no_more_transactions: "No more transactions",
    warning_old_bridge:
      "Bridge is transitioning to use Near Intents. Click here to view your old Bridge transactions.",
    transitioning_to_intents:
      "Bridge is transitioning to use Near Intents. Click here to check out Near Intents bridge.",
    warning_insufficient_balance: "Insufficient balance",
    modal_add_public_key: {
      title: "Ready to Use NEAR Intents?",
      description: "Add a one-time public key to activate NEAR Intents and start your transaction.",
    },
    modal_terminate_bridge: {
      title: "Cancel Bridge",
      description:
        "Are you sure you want to terminate the current bridge process? You can create a new one anytime.",
    },
    modal_available_balance: {
      title: "Proceed with Available Balance",
      description:
        "You have an available balance in the bridge, which will be used to process this transaction.",
    },
    modal_similar_pair: {
      title: "Bridge Transfer in Progress",
      description: "You have an ongoing bridge transaction. Do you want to create a new one?",
      button_create_new: "Create New",
      button_back: "Back",
      footer_note:
        "Creating a new bridge will cancel the previous transaction and refund any deposited funds.",
    },
    modal_refund: {
      title: "Refund",
      label_network: "Network",
      label_insert_address: "Insert the wallet address to receive refunds",
      placeholder_insert_address: "Please insert wallet address",
      label_insert_address_confirm: "Confirm wallet address",
      placeholder_insert_address_confirm: "Please insert wallet address again",
      error_invalid_address: "Invalid address",
      error_address_not_match: "Address does not match",
    },
    button_cancel: "Cancel",
    button_proceed: "Proceed",
    label_reference_id: "Reference ID",
    label_status: "Status",
    label_refund_destination: "Refund Destination",
    label_source_network: "Source Network",
    label_destination_network: "Destination Network",
    label_source_token: "Source Token",
    label_destination_token: "Destination Token",
    label_amount_from: "Amount From",
    label_amount_to: "Amount To",
    label_refund_hash: "Refund Hash",
    label_withdrawal_hash: "Withdrawal Hash",
    label_created_at: "Created At",
    quote_result: {
      success: {
        title: "Bridge Successful",
        description:
          "Your assets have been successfully bridged and are now available on the destination network.",
      },
      fail: {
        title: "Bridge Failed",
        description:
          "Your asset transfer could not be completed. Please check the network details and try again, or contact support if the issue persists.",
      },
      cancel: {
        title: "Bridge Cancelled",
        description: "The bridge transaction has been cancelled.",
      },
    },
    button_refund: "Refund",
    button_continue: "Continue",
    button_view: "View",
    label_transaction_processing: "Transaction Processing",
    label_footnote_come_back_later: "You can safely close this page and come back later",
    button_confirm_quote: "Confirm Quote",
    warning_large_withdrawal: "Withdrawal over ~5,000$ may take longer to process.",
    quote_header: {
      deposit: {
        title: "Step 1 : Deposit",
        subtitle:
          "You can safely close this page after the deposit, as it may take some time to be processed.",
      },
      confirm_quote: {
        title: "Step 2 : Confirm Quote",
        subtitle:
          "You can safely close this page after the deposit, as it may take some time to be processed.",
      },
      steps: {
        deposit: "Deposit",
        confirm_quote: "Confirm Quote",
        complete: "Complete",
      },
    },
    label_deposit_amout: "Deposit Amount",
    label_deposit_network: "Deposit Network",
    label_deposit_address: "Deposit Address",
    warning_deposit_address_title: "Please be aware of the following:",
    warning_deposit_address_desc_1: "Please don't deposit any other digital assets except",
    warning_deposit_address_desc_2: "on",
    warning_deposit_address_desc_3: "to the above address.",
    title: "Bridge",
    label_pay: "Pay",
    label_receive: "Receive",
    label_from: "From",
    label_to: "To",
    label_you_send: "You Send",
    label_you_receive: "You Receive ( EST. )",
    label_on_network: "On Network",
    button_review_bridge: "Review Bridge",
    button_confirm_bridge: "Confirm Bridge",
    label_bridge_details: "Bridge Details",
    label_bridge_compare: "Compare rates across providers",
    label_support_fees:
      "The amount you receive may vary due to market fluctuations. Sending the transaction quickly will help ensure it remains closer to the quoted rate",
    label_fees: "Fees",
    label_slippage: "Slippage",
    label_on: "On",
    button_change: "Change",
    button_add_sender_address: "Add Sender Address",
    button_add_receiver_address: "Add Receiver Address",
    modals: {
      network_token_selector: {
        label_select_network: "Select Network",
        label_select_token: "Select Token",
        hint_search_network: "Search Network",
        hint_search_token: "Search Token",
      },
      input_chain_address: {
        label_sender_address: "Sender Address",
        label_receiver_address: "Receiver Address",
        description: "Insert dank meme here *wink wink*",
        button_confirm: "Confirm",
      },
      tnc: {
        tnc: "Terms and Conditions",
        rate_variability: "Rate Variability: ",
        rate_variability_desc:
          "The quoted rate may fluctuate based on the real-time market rate. The longer the transaction takes to complete, the higher the likelihood that the final received amount may vary from the initial quote.",
        third_party_responsibility: "Third-Party Responsibility: ",
        third_party_responsibility_desc:
          "The bridge service is facilitated by third-party partners. Meteor Wallet assists only in finding the best routes and is not responsible for any loss or failure if a partner does not fulfill their obligations.",
        disclaimer: "Disclaimer: ",
        disclaimer_desc:
          "By using the bridge service, you acknowledge that Meteor Wallet cannot guarantee the reliability or integrity of third-party partners. All issues or disputes related to bridging must be resolved with the respective partner.",
        citizenship: "User Citizenship Restrictions: ",
        citizenship_desc:
          "In accordance with our Terms of Use, users from the United States of America, India, Singapore, and countries sanctioned by the United Nations are not allowed to use this service.",
        confirm_citizenship:
          "I confirm that I am not a citizen of the United States of America, India, Singapore, or any country sanctioned by the United Nations as restricted from using this service.",
        agree_tnc: "I understand & agree with the TAC",
        hide_tnc: "Hide this message in the future",
        agree: "Agree",
      },
    },
    label_bridge_history: "Bridge History",
    label_total_records: "Total {count} Records",
    button_recheck: "Recheck",
    label_swapped: "BRIDGED",
    title_slippage: "Slippage Setting",
    desc_slippage:
      "Your transaction will fail if the price changes more than the slippage. Too high of a value will result in an unfavorable trade.",
    button_confirm: "Confirm",
    hint_bridge_result:
      "Please note that you can always check your transaction history at bridge history page.",
    label_bridge: "Bridge",
    label_success: "Success",
    label_failed: "Failed",
    label_cancelled: "Cancelled",
    label_pending: "Pending",
    label_refunded: "Refunded",
    label_transaction_created: "Pending for Payment",
    payment_processing: "Payment Processing",
    desc_bridge_success:
      "Your bridge order has been created and paid. The bridged/swapped assets are currently being confirmed and will be transferred to you shortly. This process typically takes 10-20 minutes.",
    desc_bridge_failed:
      "Your asset transfer couldn't be completed. Please verify the network details and try again, or contact support if the issue persists.",
    desc_bridge_created:
      "Your order has been created. You will be redirected to the payment page to complete the payment in 300 seconds. If you are not redirected automatically, please click the button below.",
    button_back_to_wallet: "Back to Wallet",
    button_check_transaction_status: "Check Transaction Status",
    button_redirect_to_payment: "Redirect to Payment",
    label_seconds: "seconds",
    meteor_derived_status: {
      failed_deposit: "Failed",
      pending: "Pending",
      processing: "Processing",
      success: "Success",
      timeout: "Timeout",
      refunded: "Refunded",
    },
    label_please_add_wallet_address: "Please add wallet address",
    label_no_route: "No route",
    label_network_not_supported: "{network} is not supported",
    warning_no_network_found: "No network found. Please try another keyword or check the spelling.",
    warning_no_token_found: "No token found. Please try another keyword or check the spelling.",
  },
  error: {
    title_1: "Oops!",
    title_2: "Something went wrong",
    description:
      "Something went wrong. We're looking into it, and your report will help us address the issue faster.",
    button_contact_support_now: "Contact Support Now",
    button_back_to_wallet: "Back to Wallet",
  },
  campaign: {
    label_voting_has_ended: "Voting has ended",
    what_is_new: {
      "3": {
        description: "Refer friends to Harvest Moon and win your share of $5,000!",
      },
      "4": {
        description: "New Token Drop! Refer a friend and win a share of $3,500!",
      },
      "5": {
        description: "Stake xRef for a week and share $2500!",
      },
      "6": {
        description:
          "Bridging across networks just got SIMPLE, FAST, CHEAP and SECURE. Try it Now!",
      },
      "7": {
        description: "FLASH MISSION! Vote with $GEAR in Meme Season 7 for a share of $50K!",
      },
      "8": {
        description: "Streak Missions Are Live! Take on Daily Missions for Extra Rewards!",
      },
      "9": {
        description: "$25K Prize Pool! Join the NEAR Memecoin Trading Competition Today!",
      },
      "10": {
        description:
          "Join the Meteor community and be among the first to enjoy our exclusive DeFi Mastercard",
      },
      "11": {
        description: "Meme Season 8 is here, vote for GEAR and claim exciting rewards!",
      },
      "13": {
        description: "Meme Season 9 is here, vote for GEAR and claim exciting rewards!",
      },
      "14": {
        description: "Meme Season 10 is here, vote for GEAR and claim exciting rewards!",
      },
    },
    meme_phase_2: {
      my_staked_gear: "My Staked GEAR",
      estimated_apy: "Estimated APY",
      ref_meme_contest_phase_2: "Ref Meme Contest Phase 2",
      gear_top_5_voted_meme_token_stake_to_earn_rewards:
        "GEAR is now a top 5 voted meme token. Stake GEAR to earn rewards.",
      meme_season_phase_2_stake_gear_to_earn: "Stake $GEAR and earn up to 40% APY",
      staking_apy: "Staking APY",
      stake_at_least_100_gear_for_advanced_contract:
        "Stake at least 100 GEAR to get an advanced contract. A 5-day unlocking period applies.",
      step_1: {
        title: "Step 1 : Purchase GEAR",
        description: "To get started, purchase GEAR if you don’t already have enough for staking.",
        input_title: "Amount to Purchase",
        input_button: "Buy",
      },
      step_2: {
        title: "Step 2 : Stake GEAR for Rewards",
        description:
          "Stake at least 100 GEAR to get an advanced contract. A 5-day unlocking period applies.",
        input_title: "Amount to Stake",
        input_button: "Stake",
        warning_success: "Stake GEAR Successful",
      },
    },
    claim_successfully: "Claimed successfully",
    claim_reward_successfully: "You have claimed your reward successfully",
    raffle_rewards: "Raffle Rewards",
    unstake_open_date_time_6th_sept: "Unstake will be open on September 6th at 12pm UTC.",
    unstake_open_date_time_7th_sept: "Unstake will be open on September 7th at 12pm UTC.",
    reward_open_date_time: "Rewards will be dropped on 6th September",
    raffle_result_announcement_date_time:
      "Raffle results will be announced on September 7th at 12pm UTC.",
    stake_and_vote: "Stake & Vote",
    unstake: "Unstake",
    my_rewards: "My Rewards",
    raffle_ticket: "Raffle Ticket",
    label_campaign_details: "Campaign Details",
    rewards: {
      title: "Participation Rewards",
      my_raffle_tickets: "My Raffle Tickets",
      potential_rewards: "Potential Rewards",
      raffle_ticket_for_each_xref_voted: "Raffle Ticket for each xRef Voted",
      label_for_participating: "for participating",
      label_for_each_vote: "for each xREF voted",
      reward_gear: "up to $2500 of GEAR will be randomly distributed via raffle",
      reward_usd: "Share of the $40K prize pool depending on how strong our community votes!",
      token_drop: "Token Drop",
      worth_of_gear_drops: "Worth of $GEAR Drops",
      voting_period: "Voting Period: Until October 5th, UTC 00:00",
      snapshot_period: "Snapshot: October 6th (Unstakes before this won't count)",
      unstaking_available: " Unstaking: Available on October 6th",
    },
    label_rare_relics: "Rare Relics",
    hours: "Hours",
    minutes: "Minutes",
    left: "Left",
    label_ref_contest: "Ref Contest",
    label_ref_meme_contest: "Ref MEME Contest",
    label_ref_meme_season: "Ref MEME Season 6",
    description_ref_meme_contest:
      "Participate in the Ref MEME Contest and secure rewards for supporting the Meteor and $GEAR community!",
    description_ref_meme_season:
      "Join the Ref MEME Contest and secure rewards for the Meteor and $GEAR community! Each vote earns raffle tickets for exclusive prizes and a chance at the $40K prize pool—with more rewards as our votes grow!",
    label_how_to_participate: "How to participate",
    label_get_guaranteed_reward: "Get a guaranteed Advanced Contract",
    label_stand_a_chance_to_win: "Stand a chance to win",
    label_my_entry: "My Entry",
    text_campaign: "Meme season is live, participate to win rewards.",
    label_milestone: "Milestone",
    label_votes_casted: "Votes Casted",
    step_1: {
      title: "Step 1 : Purchase Ref",
      description: "You need REF to participate in the MEME contest and stake xREF",
      input_title: "Amount to Purchase",
      input_button: "Buy",
    },
    step_2: {
      title: "Step 2 : Stake Ref for xRef",
      description: "xREF tokens give you voting power and you currently have",
      input_title: "Amount to Stake",
      input_button: "Stake",
      warning_success: "Stake xRef Successful",
    },
    step_3: {
      title: "Step 3 : Vote for Gear",
      description: "Each vote earns you a raffle ticket and you currently have",
      input_title: "Amount to Vote",
      input_button: "Vote",
      warning_success: "Voted for GEAR successfully",
    },
    step_unstake_xref_token: {
      title: "Unstake xRef Token",
      description:
        "Please note that there will be ~{LOCK_PERIOD_UNSTAKE_XREF_IN_HOURS} hours locking period ",
      label_locking_period: "Locking Period",
      label_total_staked_amount: "Total Staked Amount",
      input_title: "Amount to Unstake",
      input_button: "Unstake",
      warning_unstake_success: "Unstake xRef Token Success",
      warning_withdraw_success: "Withdraw xRef Token Success",
      description_unstaking:
        "You are unstaking {balanceUnstaking} XRef Token. This usually takes {LOCK_PERIOD_UNSTAKE_XREF_IN_HOURS} hours to complete",
      description_claimReady:
        "You have {balanceClaimReady} XRef Token ready to claim, click to claim now",
    },
    step_unstake_ref_token: {
      title: "Unstake Ref Token",
      description: "Instant unstake is available for Ref Token. You can unstake anytime",
      label_total_staked_amount: "Total Staked Amount",
      input_title: "Amount to Unstake",
      input_button: "Unstake",
      warning_unstake_success: "Unstake Ref Token Success",
    },
    step_unstake_gear_token: {
      title: "Unstake GEAR Token",
      description:
        "Please note that there will be ~{LOCK_PERIOD_UNSTAKE_GEAR_IN_DAYS} days locking period ",
      label_locking_period: "Locking Period",
      label_total_staked_amount: "Staked Amount",
      input_title: "Amount to Unstake",
      input_button: "Unstake",
      warning_unstake_success: "Unstake GEAR Token Success",
      warning_withdraw_success: "Withdraw GEAR Token Success",
      description_unstaking:
        "You are unstaking {balanceUnstaking} GEAR Token. This usually takes ~{LOCK_PERIOD_UNSTAKE_GEAR_IN_DAYS} days to complete",
      description_claimReady:
        "You have {balanceClaimReady} GEAR Token ready to claim, click to claim now",
      label_lock_up_period: "Lock Up Period",
      label_days: "Days",
      label_apy: "APY",
    },
    label_you_have_gear: "You have {prettyGearBalance} GEAR",
    label_reward_details: "Reward Details",
    label_participation_reward: "Participation Reward",
    description_participation_reward: "Reward when you participate in this contest",
    label_milestone_reward: "Milestone Reward",
    description_milestone_reward:
      "Each milestone adds more items to the raffle pool. Each raffle ticket gives you a chance to win a reward.",
    label_my_raffle_tickets: "My Raffle Tickets",
    label_raffle_rewards_in_milestone: "Raffle Rewards in Milestone",
    label_when_total_ticket_reached: "When Total Ticket Reached",
    label_dont_see_your_raffle_ticket: "Didn't receive your raffle tickets? Check",
    label_dont_see_your_rewards: "Didn't receive your rewards? Check",
    label_here: "here",
    title_claim_raffle_ticket: "Claim Raffle Ticket",
    description_claim_raffle_ticket: "Find the transaction hashes related to voting for GEAR",
    label_input_transaction_hash: "Input transaction hash",
    warning_claim_raffle_ticket_success: "Claim Raffle Ticket Successful",
    button_claim: "Claim",
    button_claimed: "Claimed",
    label_coming_soon: "Coming Soon",
    label_staking_rewards: "Staking Rewards",
    label_list_of_registered_entries: "List of Registered Entries",
    label_no_registered_entries: "No registered entries",
    button_dropped: "Dropped",
    label_you_didnt_win: "You didn't win any raffle rewards",
    label_coming_soon_unstaking: "Unstaking will be available on 6th October",
    label_coming_soon_raffle: "Raffle rewards will be available on 6th October",
  },
  configure_rpc: {
    title: "RPC Selector",
    description: "Changing the RPC network will refresh the app",
    button_add_rpc: "Add RPC",
    warning_success_update_rpc: "You have changed your RPC provider to {rpc} successfully",
    warning_rpc_abnormal_ping: "RPC ping is abnormal, we suggest changing to another RPC.",
    warning_duplicate_entry: "Duplicate RPC entry detected.",
    label_add_custom_network: "Add Custom Network",
    label_network_name: "Network Name",
    label_rpc_url: "RPC URL",
    button_add: "Add",
    button_confirm_change_rpc: "Confirm",
    rpcNames: {
      mainnet: {
        official: "Official RPC",
        meteor: "Meteor FastNear RPC",
        fastnear: "FastNear RPC",
        pagoda: "Pagoda RPC",
        lava: "Lava RPC",
        shitzu: "Shitzu RPC",
      },
      testnet: {
        official: "Official RPC testnet",
        fastnear: "FastNear RPC testnet",
        pagoda: "Pagoda RPC testnet",
        lava: "Lava RPC testnet",
      },
    },
    warning_changed_network: "Network changed to {network}",
    hint_switch_network: "Press CTRL + . to quickly switch between networks",
  },
  rpc_rotate_modal: {
    rotating_rpc: "Selected RPC is down — switch now.",
    selected_rpc_not_working_change_to_other:
      "The current selected RPC is not working as expected. We recommend changing it to {rpcName}.",
    change_now: "Change Now",
    all_rpc_down:
      "NEAR Protocol is experiencing network issues, causing all RPCs to be temporarily unavailable. Transactions may be delayed, and some features might not work.",
  },
  wallet_status: {
    "": "",
    account_exists: "You can change your referrer to this account",
    account_no_exists: "Wallet does not exist",
    new_referrer_same_as_old_referrer:
      "Invalid Referrer:The new referrer cannot be the same as the old referrer.",
    current_lab_level_exceed_1:
      "Error: You have already updated your lab and cannot change your referrer anymore.",
    new_referrer_harvest_moon_not_init:
      "Invalid Referrer: Referrer has not initialized harvest moon account.",
    new_referrer_not_tg_linked:
      "Invalid Referrer: Referrer must be a primary telegram verified wallet.",
    new_referrer_must_be_primary_wallet:
      "Invalid Referrer: Referrer must be a primary telegram verified wallet.",
    "responder_production_rate_exceed_0.1": "Error: Your production rate exceeds 0.1",
    error_checking: "Error: Something went wrong, please try again later.",
  },
  changelog: {
    abuse: {
      title_1: "Important Update",
      title_2: "Regarding Your Harvest Moon Account",
      text_1: "Due to a recent bug in Moon Exchange, you received",
      text_2: "at a 50% discount before the bug was fixed on",
      text_3: "To ensure fairness, we have removed the following from your account",
      text_4: "As compensation for the inconvenience, we are giving you 1 Expert Contract.",
      text_5: "For more information, please click the Learn More button below.",
      text_6: "By ticking, you are confirming that you have read and understand the update.",
      label_contracts: "Contracts",
      button_view_transaction: "(View Transaction)",
      button_learn_more: "Learn More",
      button_understood: "Got It",
    },
    label_whats_new: "What's New :",
    close: "Close",
    "15": {
      title: "MEME COOKING",
      description_1:
        "A first of its kind fair launchpad is now live on Near Protocol. Participate now in their",
      description_2: "trading campaign!",
      button: "Cook Now",
    },
    "16": {
      title: "IMPORT TOKEN",
      description: `Don't see your token balance? Import them right now at the bottom of "My Assets" section on Home Page`,
      button: "Check it out",
    },
    "17": {
      simple: "SIMPLE",
      fast: "FAST",
      cheap: "CHEAP",
      secure: "SECURE",
      title: "Bridging just got {simple}, {fast}, {cheap} and {secure}",
      description:
        "Easily move your crypto across networks (ETH, SOL, BNB, ARB etc), all within your Meteor Wallet. Cross-chain just got easier!",
      button: "Bridge now!",
    },
    "18": {
      title: "Streak Missions Launched",
      description:
        "Take on daily missions—trade memecoins, bridge tokens, time travel Tinkers. Keep the streak going for bigger rewards!",
      button: "Start Missions",
    },
    "19": {
      title: "Memecoin Challenge is Live!",
      description:
        "Trade memecoins now for a chance to win your share of $25,000! Boost your trading streak for bigger rewards. Top 10 traders get 10x rewards.",
      button: "Enroll Now",
    },
    "20": {
      title: "Early Access",
      subtitle: "Register now to get early access and enjoy exclusive benefits.",
      button: "Apply Now !",
    },
  },
  footer: {
    home: "Home",
    nft: "NFT",
    game: "$MOON",
    history: "History",
    explore: "Explore",
  },
  topup: {
    title: "Top Up",
    label_intro_1: "Get Your",
    label_intro_2: "in Seconds",
    label_buy_with: "Buy with",
    label_recommended: "Recommended",
    label_payment_options: "Payment Options",
    text_mercuryo_description:
      "Acquire cryptocurrency directly within Meteor Wallet, no documentation needed.",
    text_onramper_description: "Aggregator that has all major fiat-to-crypto onramps.",
    text_ramp_description: "Aggregator that has all major fiat-to-crypto onramps.",
    toast: {
      topup_success_title: "Top up successful",
      topup_success_description: "Your coins have been added to your account",
      topup_failed_title: "Top up failed",
      topup_failed_description: "Please try again later",
    },
  },
  staking: {
    label_staking_apy: "Annual Return",
    label_total_staked: "Total Staked",
    label_total_delegators: "Total Delegators",
    label_daily_moon_drop: "Daily $MOON Drop",
    label_total_moon_earned: "Total $MOON Earned",
    label_per_day: "Per Day",
    label_start_staking: "Start Staking & Boost Your Rewards",
    label_boosted: "BOOSTED",
    hint_staking_apy:
      "The yearly percentage yield from staking your NEAR tokens is subject to network conditions.",
    hint_total_staked:
      "Includes the initial deposit and rewards that have been automatically restaked.",
    hint_total_delegators: "Number of unique wallets staking on this validator.",
    hint_daily_moon_drop:
      "Daily $MOON tokens received are based on your staked NEAR amount. The receivable amount is calculated hourly based on your staked NEAR.",
    hint_total_moon_earned: "Total $MOON tokens earned from staking with Meteor Validator.",
    button_stake_more: "Stake More",
    button_unstake: "Unstake",
    button_claim: "Claim",
    button_start_now: "Start Now",
    part_unstaking: {
      title: "Unstaking",
      description:
        "You are unstaking {balanceUnstaking} NEAR from the validator, this usually takes 48~72 hours to complete",
    },
    part_unstaked: {
      title: "Unstaked",
      description: "You have {balanceClaimReady} NEAR  unclaimed rewards, click to claim now",
    },
    part_extra_reward: {
      title: "Extra Reward",
      description: "You have {balanceExtraReward} unclaimed rewards, click to claim now",
    },
    part_extra_reward_meteor: {
      title: "You're Earning Extra Rewards!",
      description_1:
        "You will earn $MOON tokens every day, credited to your account at {STAKING_AUTO_CLAIM_TIME}. Check your",
      description_2: "wallet activity",
      description_3: "to view them.",
    },
    part_unclaimed_reward: {
      title: "Unclaimed Reward",
      description:
        "You have {balanceExtraReward} $MOON unclaimed rewards, begin your Harvest Moon journey to claim",
    },
    section_stakings: {
      title: "My Staking",
      button_create_staking: "Create Staking",
    },
    section_staking_stats: {
      title_1: "Earn with",
      title_2: "Staking",
      description: "Earn up to {STAKING_UP_TO_APY}% APY rewards by staking NEAR in Meteor.",
      label_my_total_stakings: "My Total Stakings",
      label_estimated_apy: "Estimated APY",
    },
    subpage_create: {
      title: "Stake Your NEAR",
      label_year: "year",
      label_everyday: "everyday",
      label_validator: "Validator",
      label_staking_details: "Staking Details",
      label_reward: "Annual Return",
      label_estimated_yield: "Expected Return",
      label_extra_reward: "Bonus Rewards",
      label_extra_daily_reward_in_moon: "Extra Daily Rewards in",
      label_select_validator: "Select Validator",
      label_delegators: "Delegators",
      hint_reward:
        "The yearly percentage yield from staking your NEAR tokens is subject to network conditions.",
      hint_estimated_yield:
        "The estimated annual earnings in USD are based on the current staking rate and your staked amount. Actual earnings will be in NEAR tokens.",
      hint_extra_reward:
        "Earn additional $MOON tokens daily as a staking bonus. These tokens are eligible for future Meteor rewards, like our official airdrop.",
      button_stake_now: "Stake Now",
      warning_unstake_period: "There is a 48~72 hours locking period during unstake",
    },
    toast: {
      unstake_success_title: "You have unstaked unsucessfully",
      unstake_success_description:
        "You have unstaked {unstakeAmount} NEAR from {validatorId} successfully",
      unstake_failed_title: "Unstake failed",
      unstake_failed_description: "Claim staking reward failed: {message}",
      claim_success_title: "Claimed successfully",
      claim_success_description: "You have claimed your staking reward {amount} NEAR successfully",
      claim_failed_title: "Something went wrong",
      claim_failed_description: "Claim staking reward failed: {message}",
      claim_farm_success_title: "Staking reward claimed successfully",
      claim_farm_success_description: "You have claimed your staking reward successfully",
      claim_farm_failed_title: "Something went wrong",
      claim_farm_failed_description: "Claim staking reward failed: {message}",
      no_claim_title: "No claimable reward",
      no_claim_description: "There's no claimable reward",
    },
    modal: {
      unstake: {
        title: "Unstake",
        label_amount_to_unstake: "Amount to Unstake",
        label_validator_details: "Validator Details",
        label_provider: "Provider",
        label_staking_apy: "Staking APY",
        label_unlock_period: "Unlock Period",
        label_total_staked_amount: "Total Staked Amount",
        button_confirm_unstake: "Confirm Unstake",
      },
      stake: {
        label_stake_success: "Stake Successful",
        label_stake_failed: "Stake Failed",
        label_transaction_details: "Transaction Details",
        label_status: "Status",
        label_success: "Success",
        label_failed: "Failed",
        label_date_time: "Date & Time",
        label_transaction_fee: "Transaction Fee",
        label_transaction_id: "Transaction ID",
        label_error_message: "Error Message",
        button_done: "Done",
      },
    },
  },
  telegram: {
    linking_wallet_to_account: "Linking wallet to Telegram account",
    quote_of_the_day: "Quote of the day",
    modal: {
      conflict_account: {
        title: "You already have a wallet linked to your telegram account",
        text_import: "You can import",
        text_import_or_create: "import another wallet or create a new wallet",
        text_if_import_or_create: "If you import another wallet or create a new wallet",
        text_telegram_account_override:
          "your Telegram account will be linked to the new wallet instead",
        button_import_existing: "Import",
        button_import_another: "Import another wallet",
        button_create_new: "Create new wallet",
        label_or: "or",
      },
      connect_account: {
        title: "Link Telegram Account",
        description:
          "Only a single wallet account can be linked to your telegram account. A future feature will allow you to change which wallet you are linked to.",
        button_continue: "Continue",
      },
      import_linked_account: {
        title: "Import your existing account",
        description:
          "You can import your existing account by using your secret phrase or private key",
        text_choose_import_method: "Choose import method",
        button_next: "Next",
        button_back: "Back",
      },
    },
  },
  harvest_moon: {
    tab_harvest: {
      ledger: {
        title: "Secure Access Permission for {LedgerComponent} Users",
        description:
          "For Ledger users, adding a function call access key is essential for a seamless experience on Harvest Moon. This key is solely for interface functionality and does not grant us access to your funds or personal wallet keys. Your assets remain entirely under your control.",
        add_now: "Add now",
      },
      section_dashboard: {
        label_storage: "Storage",
        label_my_moon_balance: "My $MOON Balance",
        button_next_harvest: "Next Harvest",
      },
      section_game_stats: {
        title: "GAME STATS",
        label_coming_soon: "Coming Soon",
        text_news_mechanic: "Game Mechanics and Rewards",
        text_news_guide: "Game Guide",
        text_news_launch_week: "Harvest Moon Launch Week Is Here",
        text_news_hm_missions: "Harvest Moon Missions",
        button_relic_booster: "Relic Boosters",
        button_player_level: "Player Level",
        button_ranking: "Ranking",
        button_contract_drop: "Contract Drop",
        button_token_drop: "Token Drop",
        button_referral: "Referral",
        label_enrolled: "Enrolled",
      },
      section_announcement: {
        title: "ANNOUNCEMENT",
      },
      subpage_tier: {
        title: "Player Level",
        label_current_tier: "Current Tier",
        label_conditions_to_unlock: "Conditions to Unlock",
        label_current_benefits: "Current Benefits",
        label_upgrade_to_unlock: "Upgrade to Unlock",
        label_coming_soon: "COMING SOON",
        button_uprgade_tier: "UPGRADE TIER",
        button_uprgade_tier_locked: "UPGRADE TIER (LOCKED)",
      },
      subpage_referral: {
        title: "Referral",
        label_last_7_days_earned_from_referral: "Last 7 Days Earned From Referral",
        text_moon_earned_by_referral_is_distributed_to:
          "Moon earned by referral is distributed to {walletId}",
        label_your_primary_wallet: "your primary wallet",
        label_my_total_friends: "My Total Friends",
        label_total_moon_earned_from_referral: "Total $MOON Earned From Referral (last 7 days)",
        label_my_friends: "My Friends",
        label_total_records: "Total {count} Records",
        label_total_moon_earned: "Total $MOON Earned",
        label_refer_and_earn: "Refer & Earn Reward",
        label_refer_and_earn_desc: "Refer a friend to get",
        label_refer_and_earn_desc_2: "20% of the $MOON reward",
        label_refer_and_earn_desc_3: "and one",
        label_refer_and_earn_desc_4: "Basic Contract",
        label_level: "Level",
        label_wallet_id: "Wallet ID",
        label_telegram_id: "Telegram ID",
        label_last_harvest_at: "Last Harvest At",
        button_remind_to_harvest: "Remind to Harvest",
        button_share_on_tg: "Share on TG",
        button_share_on_x: "Share on X",
        button_copy_referral_link: "Copy Ref Link",
      },
      subpage_contract_drop: {
        title: "Contract Drop",
        label_my_union_contract_drop_stats: "My Union Contract Drop Stats",
        text_chance_of_getting_contract_at_full_storage:
          "Chance of Getting a Contract at Full Storage",
        label_union_contract_drop_rate: "Union Contract Drop Rate",
        text_union_contract_drop_rate:
          "Your chances of getting a union contract increase with the hours you harvest. Upgrading your storage lets you harvest more hours (from 2h to 24h), boosting your chances. The maximum drop rate per harvest is {dropRatePerHour}%.",
        label_union_contract_type: "Union Contract Type",
        text_union_contract_type:
          "Unlock different types of union contracts by leveling up. Higher player levels give you access to rarer contracts. The drop odds improve with higher storage levels. For instance, an expert contract has a 1% drop rate at storage level 1 but increases to 15% at storage level 9.",
        button_upgrade_storage: "Upgrade Storage",
        button_check_player_level: "Check Player Level",
      },
      subpage_token_drop: {
        title: "Token Drop",
        title_token_drop: "Token Drop",
        desc_token_drop:
          "Stand a chance to earn extra token when you met campaign criteria during harvest.",
        label_campaign: "Campaign",
        label_met_criteria: "Eligible",
        label_not_met_criteria: "Not Eligible",
        label_enrolled: "Enrolled",
        label_rewards: "Rewards",
        label_period: "Period",
        label_claimed_rewards: "Claimed Rewards",
        button_view_details: "View Details",
        button_enroll: "Enroll",
        label_criteria: "Criteria",
        label_completed: "Completed",
        label_incomplete: "Incomplete",
        label_player_level: "Player Level",
        text_staked_at_least_100_near: "Staked (link) at least 100 Near with Meteor Validator",
        button_enroll_now: "Enroll Now",
        campaigns: {
          title: {
            referral_token_drop_2: "Refer & Earn",
            gear_token_drop: "Time Travel & Earn",
            lonk_token_drop: "Newbie Challenge",
            memecoin_token_drop: "Memecoin Trading",
            swap_mission_drop: "Memecoin Challenge",
          },
          description: {
            referral_token_drop_2:
              "Invite your friends and earn rewards from the $3,500 prize pool! The event runs until the prize pool is fully claimed, so start referring now!",
            swap_mission_drop:
              "Join the Memecoin Trading daily missions and compete for your share of a $25,000 USDC prize pool! The event runs until the pool is fully claimed, so start trading now!",
          },
          how_it_works: {
            referral_token_drop_2: {
              step_1:
                "Refer at least <b>1 new user who recruits 5 Tinkers.</b> Once qualified, your next harvest has a 50% chance for an additional token drop <i>(Max chance with 4-hour harvest)</i>",
              step_2:
                "<b>Earn between $0.05 and $10 in token rewards.</b> The more referrals, the bigger the rewards!",
              step_3:
                "A total of 120B Black Dragon (~$3,500) will be distributed during this campaign.",
              label_distributed: "Distributed",
              label_remaining: "Remaining",
            },
            swap_mission_drop: {
              step_1_title: "Complete a 5-Day Streak",
              step_1_description:
                "Trade memecoins for 5 consecutive days to unlock a 50% chance of bonus tokens with each harvest. See eligible memecoins.",
              step_2_title: "Rewards",
              step_2_description:
                "Earn daily rewards based on a 24-hour harvest, ranging from $0.75 to $2.50, depending on your streak and a random factor. Shorter harvests mean smaller rewards. Top 10 traders (by volume) can earn 10x rewards, up to $25 per day.",
              step_3_title: "Total Prize Pool",
              step_3_description:
                "A total of $25,000 USDC will be distributed during the campaign.",
              label_distributed: "Distributed",
            },
          },
          my_progress: {
            swap_mission_drop: {
              complete_5_days_streak: "Complete a 5-day streak to get qualify.",
              total_campaign_earnings: "Total Campaign Earnings",
              earn_bonus_rewards: "Earn Bonus Rewards",
              top_10_trades_get: "Top 10 Trades Get",
              rewards: "Rewards",
              top_10_traders: "Top 10 Traders",
            },
          },
        },
        label_not_enrolled: "Not Enrolled",
        label_criteria_unmet: "Criteria Unmet",
        label_status: "Status",
        tooltip_status:
          "Enrolled: You're in the token drop. Criteria Unmet: Requirements not met. Not Enrolled: You're not enrolled.",
        label_until_reward_empty: "Until the reward pool is depleted",
        campaign_status: {
          ACTIVE: "Active",
          ENDED: "Ended",
          PAUSED: "Paused",
        },
        label_how_it_works: "How It Works",
        label_my_progress: "My Progress",
        label_qualification_status: "Qualification Status",
        label_recent_activity: "Recent Activity",
        label_you_have_referred: "You've referred",
        label_users: "users",
        description_qualification_status:
          "Referrals only count after they recruit 5 Tinkers, and only new referrals from this campaign are eligible.",
        label_referral_activity: "Referral Activity",
        label_tinkers: "Tinkers",
        label_prize_pool: "Prize Pool",
        label_up_to: "Up to",
        label_each_harvest: "Each Harvest",
        tooltip_rewards: "Reward is calculated based on the real-time token price.",
        button_coming_soon: "Coming Soon",
        label_no_campaigns:
          "There are no active campaigns right now. Please check back soon for updates!",
      },
      modal: {
        gas_free: {
          title: "With gas-free transactions, we cover the fee for seamless Harvest Moon gameplay!",
          button_close: "CLOSE",
        },
        upgrade_tier: {
          title: "Upgrade Tier",
          label_upgrade_to_unlock: "Upgrade to Unlock",
          button_upgrade_now: "Upgrade Now",
        },
        my_referrer: {
          label_my_referrer: "My Referrer",
          label_wallet_id: "Wallet ID",
          label_telegram_id: "Telegram ID",
          label_status: "Status",
          label_lab_level: "Lab Level",
          button_update_referrer: "Update Referrer",
          footer_text:
            "You can change your referrer only if your production rate is under 0.1 $MOON/hour.",
          label_active: "Active",
          label_inactive: "Inactive",
          label_update_referrer: "Update Referrer",
          label_referrer_wallet_id: "Referrer Wallet ID",
          button_confirm: "Confirm Update",
          button_cancel: "Cancel",
        },
      },
      toast: {
        tier_upgrade_success: "Tier upgrade successful",
        link_telegram_failed: "Linking to telegram failed. Please try again.",
        referral_telegram_failed:
          "You have already created/imported a wallet. The referral link is invalid.",
        referred_and_get_reward_with_name:
          "You are being referred by {referrer} and will receive an additional reward upon completing your account creation.",
        referred_and_get_reward_without_name:
          "You are being referred and will receive an additional reward upon completing your account creation.",
      },
    },
    tab_mission: {
      newbie_challenge: {
        newbie: "Newbie",
        challenge: "Challenge",
        of: "of",
        description: "Level up and upgrade your setup to earn rewards and enhance your gameplay!",
        prev: "Prev",
        next: "Next",
        task: "Task",
        task_1: {
          join_harvest_moon: "Join Harvest Moon",
          receive_basic_contract: "Receive a Basic Contract reward !",
        },
        task_2: {
          reach_player_level_3: "Reach Player Level 3",
          receive_advanced_contract: "Receive an Advanced Contract reward !",
        },
        task_3: {
          reach_container_level_3: "Reach Container Level 3",
          reach_lab_level_3: "Reach Lab Level 3",
          receive_expert_contract: "Receive an Expert Contract reward !",
          button_upgrade_now: "Upgrade Now",
        },
      },
      new_missions: {
        active_forever: "Active Forever",
        active_for: "Active for",
        vote: "Vote",
        surprise_partnership_title: "Surprise Partnership",
        surprise_partnership_desc: "Unlock new ways to spend crypto",
        meteor_master_card_desc: "Apply for early access",
        coming_soon: "Coming Soon",
        get_alpha_access_title: "Get Alpha Access",
        get_alpha_access_desc: "Be the first to test Meteor's app!",
        ended: "Ended",
        staked: "Staked",
        delayed: "Delayed",
      },
      meme_season_7: {
        tab_title: {
          INFO: "Info",
          STAKE_VOTE: "Stake & Vote",
          UNSTAKE: "Unstake",
          MYREWARDS: "My Rewards",
        },
        phase_1: {
          page_title: "xRef Voting",
          title_1: "xRef Voting",
          title_2: "(Phase 1 - Meme Season 10)",
          description:
            "Participate in the Ref MEME Contest and secure rewards for supporting the Meteor and $GEAR community!",
          tab_content: {
            info: {
              campaign_info: {
                title: "Campaign Info",
                voting_period: "Voting Period",
                voting_period_tooltip:
                  "If you previously in the previous season, you dont need to unstake to vote again, your votes will be counted through Meteor or Ref regardless",
                snapshot_period: "Snapshot",
                snapshot_period_desc: "{snapshot_period} (Unstakes before this don't count)",
                unstaking_available: "Unstaking",
                unstaking_available_desc: "Available on {unstaking_available}",
                day_lock: "Unstaking will be available 1st to 6th UTC: 00:00 next month.",
                minimum_stake: "Minimum Stake",
                minimum_stake_desc: "Stake at least {amount} xRef to participate",
              },
              participation_info: {
                title: "Participation Rewards",
                advanced_contract: "1x Advanced Contract for casting at least 1 vote",
                raffle_ticket: "Raffle Tickets for each additional xRef/GEAR voted",
              },
              rewards_info: {
                title: "Potential Raffle Rewards",
                gear: "Up to $3,000 in $GEAR will be raffled based on milestones reached.",
                contract: "Up to 6,000 advanced and 500 expert contracts based on milestones.",
                token: "Up to $50K Meme Season Rewards based on community voting strength",
              },
              milestone_info: {
                title: "Milestone Rewards",
                description:
                  "Each milestone adds more items to the raffle pool. Each raffle ticket gives you a chance to win a reward.",
              },
            },
            unstake: {
              coming_soon: "Unstaking will be available at {unstaking_available}",
              unstake_period: "Please note that there will be ~{days} days locking period",
              description_unstaking:
                "You are unstaking {balanceUnstaking} xRef Token. This usually takes ~{days} days to complete",
            },
            myreward: {
              title: "Raffle Rewards",
              coming_soon: "Raffle result will be announced at {raffle_reward}",
              button_claimed: "Claimed",
              button_claimable: "Claim",
              button_not_qualified: "Not Qualified",
            },
          },
        },
        phase_2: {
          page_title: "GEAR Voting",
          title_1: "GEAR Voting",
          title_2: "(Phase 2 - Meme Season 10)",
          description:
            "Participate in the Ref MEME Contest and secure rewards for supporting the Meteor and $GEAR community!",
          tab_content: {
            info: {
              campaign_info: {
                title: "Campaign Info",
                voting_period: "Voting Period",
                snapshot_period: "Snapshot",
                snapshot_period_desc: "{snapshot_period} (Unstakes before this don't count)",
                unstaking_available: "Unstaking",
                unstaking_available_desc: "Available on {unstaking_available}",
              },
              participation_info: {
                title: "Participation Rewards",
                advanced_contract: "1x Advanced Contract for casting at least 1 vote",
                raffle_ticket: "Raffle Tickets for each additional xRef/GEAR voted",
              },
              rewards_info: {
                title: "Potential Raffle Rewards",
                gear: "Up to $3,000 in $GEAR will be raffled based on milestones reached.",
                contract: "Up to 6,000 advanced and 500 expert contracts based on milestones.",
                token: "Up to $50K Meme Season Rewards based on community voting strength",
              },
              milestone_info: {
                title: "Milestone Rewards",
                description:
                  "Each milestone adds more items to the raffle pool. Each raffle ticket gives you a chance to win a reward.",
              },
            },
            stake: {
              stake_period: "Stake at least {stake_amount} GEAR to get an advanced contract.",
            },
            unstake: {
              coming_soon: "Unstaking will be available at {unstaking_available}",
              unstake_period: "Please note that there will be ~{days} days locking period",
              description_unstaking:
                "You are unstaking {balanceUnstaking} GEAR Token. This usually takes ~{days} days to complete",
            },
            myreward: {
              title: "Raffle Rewards",
              coming_soon: "Raffle result will be announced at {raffle_reward}",
              button_claimed: "Claimed",
              button_claimable: "Claim",
              button_not_qualified: "Not Qualified",
            },
          },
        },
      },
      section_challenge: {
        title: "Newbie Challenge",
        description: "Level up and upgrade your setup to earn rewards and enhance your gameplay!",
        button_start: "Start",
        label_challenge_list: "Challenge List",
        button_remind_to_harvest: "Remind to Harvest",
        button_claim: "Claim",
        label_tier: "Tier",
        label_basic_info: "Basic Info",
        label_friend_quests: "Friend Quests",
        label_last_7_days_contribution: "Last 7 Days Contribution",
        label_filter_by_status: "Filter by Status",
        label_active: "Active",
        label_inactive: "Inactive",
        text_inactive: "Player hasn't initialized harvest moon",
        button_filter: "Filter",
        label_no_friend_yet: "No Friend Yet",
        label_refer_and_earn_reward: "Refer & Earn Reward",
        text_share: "Click on the share button above and start inviting friends!",
        label_refer_and_earn_desc: "Refer a friend to get",
        label_refer_and_earn_desc_2: "20% of the $MOON reward",
        label_refer_and_earn_desc_3: "and one",
        label_refer_and_earn_desc_4: "Basic Contract",
        button_verify_telegram: "Verify Telegram Account Now",
        label_friend_list: "Friend List",
        button_remind_to_harvest_all: "Remind to Harvest All",
        button_click_to_refresh: "Click on the friend list to view more details",
        label_tier_level: "Tier Level",
        label_container_level: "Container Level",
        label_lab_level: "Lab Level",
      },
      section_profile: {
        label_player_tier: "Player Level",
        label_total_earned: "Total Earned",
      },
      section_missions: {
        text_upgrade_tier_not_tier_3:
          "Upgrade to Tier 3 to unlock missions with attractive rewards. Coming soon!",
        text_upgrade_tier_tier_3: "Sit tight and get ready—we're launching missions soon!",
        button_upgrade_now: "Upgrade Now",
        coming_soon: "COMING SOON",
      },
      section_home: {
        missions: "Missions",
        mission: "Missions",
        coming_soon: "Coming soon",
        title:
          "Earn contracts, recruit Tinkers, and boost rewards. Join trading and token drops for a chance to win cash prizes!",
        flash_missions: "Flash Missions",
        streak_missions: "Streak Missions",
        flash_mission_list: "Flash Missions List",
        streak_mission_list: "Streak Missions List",
        prize_pool: "Prize Pool",
        newbie_title: "Newbie Challenge",
        newbie_subtitle: "Learn & Level up",
        phase1_title: "Vote with xRef",
        phase1_subtitle: "Phase 1 - Meme Season 10",
        phase2_title: "Vote with $GEAR",
        phase2_subtitle: "Phase 2 - Meme Season 10",
        streak: "Streak",
      },
      section_coming_soon: {
        title_xref: "Vote with xRef",
        title_gear: "Vote with $GEAR",
        subtitle_xref: "Vote with xRef (Phase 1 - Meme Season 10)",
        subtitle_gear: "Vote with $GEAR (Phase 2 - Meme Season 10)",
        coming_soon: "Coming Soon",
        title: "Vote with xRef (Phase 1 - Meme Season 10)",
        days: "Days",
        hours: "Hours",
        minutes: "Minutes",
        button_back: "Back",
      },
      mission_content: {
        [EMissionSubType.SWAP_TO]: {
          title: "Trade Memecoins",
          description:
            "Swap $5+ in memecoins to earn a basic contract. Keep your daily streak to level up faster and unlock bigger rewards with token drops! Miss a day, and your streak and total trade volume reset at {time} (0.00 UTC)",
          total_count: "Total Volume: ${count}",
        },
        [EMissionSubType.BRIDGE_FROM]: {
          title: "Bridge Tokens",
          description:
            "Use the Meteor Bridge to easily move tokens across different blockchains. Bridge at least $25 (in either direction) to earn an advanced contract. Maintain your daily streak to level up faster and unlock bigger rewards with token drops! Miss a day, and your streak and total trade volume reset at {time} (0.00 UTC)",
          total_count: "Total Volume: ${count}",
        },
        [EMissionSubType.HM_TIME_TRAVEL]: {
          title: "Time Travel Tinker",
          description:
            "Successfully time travel any Tinker to earn a basic contract. Keep your daily streak going to level up faster and qualify for bigger rewards with token drops! Miss a day, and your streak resets at {time} (0.00 UTC)",
          total_count: "Total Volume: {count}",
        },
      },
      section_mission_detail: {
        day_streak: "Day Streak",
        mission_details: "Mission details",
        eligible_tokens: "Eligible tokens",
        today_progress: "Today's Progress",
        mission_accomplished: "Mission Accomplished",
        continue_streak: "Continue Your Streak Tomorrow!",
        live: "LIVE",
        token_drop_rewards: "Token Drop Rewards",
        usdc_giveaway: "$25k USDC Token Drop is Live",
        streak_mission_list: "Streak Mission List",
        reward: "Reward",
        btn_letsgo: "Let's go",
        btn_swap: "Swap now",
        btn_bridge: "Bridge now",
        btn_time_travel: "Time travel now",
        day1: "M",
        day2: "Tu",
        day3: "W",
        day4: "Th",
        day5: "F",
        day6: "Sa",
        day7: "Su",
        view_info: "View Info",
        see_more: "See more",
      },
    },
    tab_tinker: {
      section_production_rate: {
        title: "Tinker Production Rate",
        label_moon_per_hour: "$MOON/HOUR",
        button_recruit: "Recruit Tinker",
      },
      section_active_tinkers: {
        title: "MY ACTIVE TINKERS",
        subtitle: "{count} Tinkers",
        subtitleExtra: "Lab Cap",
        button_fusion: "Time Travel",
        label_the: "The",
        label_new_production_rate: "New Production Rate",
        label_moon_per_hour: "$MOON/Hour",
        tooltip_fusion:
          "Upgrade your Tinker by sending them on a time travel adventure! Each Tinker has a unique success rate, and you can burn GEAR to boost their chances. However, if your Tinker fails, you'll lose them.",
      },
      section_union_contracts: {
        title: "UNION CONTRACTS",
        subtitle: "Total {count} Contracts",
      },
      toast: {
        recruiting_tinker: "Recruiting Tinker(s)",
        recruit_tinker_failed: "Recruiting Tinker failed. Please try again.",
      },
      modal: {
        no_new_mph: {
          title:
            "The newly recruited tinker does not improve the overall production rate because your current lineup is more efficient, resulting in no increase in MPH. Consider upgrading your lab to improve your production rate.",
        },
        tinker_fusion: {
          title: "Time Travel",
          description: "Upgrade your tinker to whole new level!",
          label_how_many: "How many",
          label_to_fusion: "to time travel",
          tooltip_to_fusion: "Maximum 50 tinkers",
          label_burn: "Burn",
          label_to_increase_success_rate: "to increase success rate",
          label_total_moon_cost: "Total $MOON cost",
          label_total_gear_cost: "Total GEAR cost",
          label_balance: "Balance",
          label_success_rate: "Success Rate",
          label_info: "If time travel fails, your Tinker will be lost.",
          button_start_fusion: "Start Time Travel",
          warning_not_enough_gear: "You do not have enough GEAR.",
          button_buy_now: "Buy Now",
        },
        tinker_production_rate: {
          title: "Tinker Production Overview",
          subtitle:
            "Your lab will automatically deploy the most efficient Tinkers first. {upgrade} to increase capacity or use {relics} to boost production rates.",
          upgrade: "Upgrade your lab",
          relics: "Relics",
          desc1: "Intern Recruited :",
          desc2: "Intern Deployed :",
          desc3: "Active Production Rate :",
          totalTinkers: "Total tinkers : ",
          labCapacity: "Lab Capacity : ",
          relic_boost: "Relic Boost",
          production_rate: "Production Rate",
        },
      },
    },
    tab_upgrade: {
      section_lab_stats: {
        title: "LAB STATS",
        label_container: "Container",
        label_moonlight_storage: "Moonlight Storage",
        label_lab_capacity: "Lab Capacity",
        label_maximum_tinker: "Maximum Tinker",
        button_upgrade: "Upgrade",
      },
      section_experiments: {
        title: "GEAR EXPERIMENTS",
        label_relics: "Relics",
        label_moon_exchange: "$MOON Exchange",
        label_boost: "Boost",
        label_left: "Left",
        text_countdown_info: "The $MOON exchange is available for {countdown} more days.",
      },
      subpage_gear_relics: {
        title: "GEAR Relics",
        label_unlock_relic_slot: "Unlock Relic Slot",
        text_unlock_relic_slot: "to unlock a new relic slot",
        label_current_balance: "Current Balance",
        button_buy_gear: "Buy Gear",
        section_boost_rate: {
          label_boost_rate: "Boost Rate",
          label_equipped_relics: "Equipped Relics",
        },
        section_forge_relic: {
          label_forge_relic: "Forge Relic",
          label_burn_gear_1: "Burn",
          label_burn_gear_2: "to get new relic",
          label_buy_sell_relic: "Buy/Sell Relics",
          text_buy_sell_relic: "Get your Relic NFT via Marketplace",
          label_harvest_moon_relic: "Harvest Moon Relics",
          text_harvest_moon_relic: "Get 10% Boost",
          label_union_contract_relic: "Union Contract Relics",
          text_union_contract_relic: "Get 50% Boost",
          label_gear_relic: "Gear Relics",
          label_other_relic: "Other Relics",
          label_gear_relic_on_paras: "Gear Relics on Paras",
          label_gear_relic_on_tradeport: "Gear Relics on Tradeport",
          text_gear_relic: "Get 25% ~ 250% Boost",
        },
        section_relics: {
          title: "Available Relics",
          label_drop_rate: "Drop Rate",
          label_rarity: "Rarity",
          label_boost_rate: "Boost Rate",
          label_total: "Total",
          label_unequip: "Unequip",
          label_unequip_cooldown: "Unequip Cooldown",
          text_maturity: "You can only unequip an equipped gear after {days} days",
          warning_no_relics: "You have no relics. Forge one now or buy on Paras.",
        },
      },
      subpage_moon_exchange: {
        title: "MOON Exchange",
        label_select_asset_to_exchange_with: "Select asset to exchange with",
        label_conversion_rate: "Conversion Rate",
        label_click_to_start_convert: "Click on the list to start convert",
        section_exchange: {
          title: "EXCHANGE",
          label_asset_to_receive: "Asset to receive",
          label_asset_to_exchange_with: "Asset to exchange with",
          label_you_are_going_to_convert: "You are going to convert",
          label_to: "to",
          button_conversion_rate: "Conversion Rate",
          button_convert: "Convert",
        },
      },
      toast: {
        exchange_success: "Successfully exchanged {from} for {to}",
        forging_relic: "Forging",
        forging_relic_success: "Forging successful",
        unlocking_relic_slot: "Unlocking",
        unlocking_relic_slot_success: "Successfully unlocked relic slot",
        equip_relic_success: "Successfully equipped",
        unequip_relic_success: "Successfully unequipped",
        upgrade_container_success: "Container upgrade successful",
        upgrade_lab_success: "Lab upgrade successful",
        sunset_gear: "GEAR staking will be sunset",
        button_unstake: "Unstake here",
        button_forge: "Forge here",
        button_close: "Close",
        button_equip: "Equip",
        button_unlock: "Unlock Now",
      },
    },
    relic_rarity: {
      [EHarvestMoon_RelicRarity.common]: "Common",
      [EHarvestMoon_RelicRarity.uncommon]: "Uncommon",
      [EHarvestMoon_RelicRarity.rare]: "Rare",
      [EHarvestMoon_RelicRarity.legendary]: "Legendary",
    },
    tier: {
      tier_name_1: "Player Level: 1",
      tier_name_2: "Player Level: 2",
      tier_name_3: "Player Level: 3",
      tier_description_1:
        "This is where your journey begins. Your account will be replenished with one gas-free transaction every day",
      tier_description_2:
        "Congratulation for making it into the crypto world! Explore the fundamentals in crypto and speed up your MOON journey",
      tier_description_3:
        "Dive deeper into the world of DeFi and the NEAR ecosystem to enhance your experience and promote your tier.",
      benefits: {
        one_gas_free_transaction_everyday: "1 Gas free transaction everyday",
        eligible_for_basic_contracts_during_harvest_lotteries:
          "Eligible for basic contracts during harvest lotteries",
        harvest_anytime_without_waiting_period: "Harvest anytime without waiting period",
        chance_to_get_advanced_contract_during_harvest:
          "Chance to get advanced contract during harvest",
        chance_to_get_expert_contract_during_harvest:
          "Chance to get expert contract during harvest",
        unlock_missions_feature: "Unlock missions feature",
        automated_harvest: "Automated harvest",
        automated_recruit_when_you_get_contract_from_harvesting:
          "Automated recruit (when you get contract from harvesting)",
      },
      conditions: {
        hold_3_near_in_your_wallet_description: "Hold 3 NEAR in your wallet",
        hold_3_near_in_your_wallet_button: "Deposit",
        set_a_password_for_your_wallet_description: "Set a password for your wallet",
        set_a_password_for_your_wallet_button: "Set Password now",
        backup_your_seedphrase_description: "Backup your seedphrase",
        backup_your_seedphrase_button: "Backup Now",
        stake_5_near_in_meteor_validator: "Stake",
        stake_5_near_in_meteor_validator_description: "Stake 5 NEAR in Meteor Validator",
      },
    },
    wallet_link: {
      wallet_link: "Wallet Link",
      pick_wallet_to_link: "Pick the wallet you would like to link",
      link_selected_account: "Link Selected Account",
      linked_to: "Linked to",
      button_back_to_home: "Back to Wallet",
      modal: {
        title: "Locking Period",
        description:
          "Please note that you can only change your linked wallet 72 hours after the last change.",
        button_confirm: "Confirm Link Account",
        button_back: "Back",
      },
    },
    wallet_link_select_primary: {
      primary_wallet_explanation:
        "All referral earnings are sent to your primary wallet. This wallet also has the benefit of no transaction fees.",
      confirm_primary_wallet: "CONFIRM PRIMARY WALLET",
      primary_wallet: "PRIMARY WALLET",
    },
    new_onboarding: {
      label_player_name: "PLAYER NAME",
      label_creating_account: "CREATING ACCOUNT",
      label_linking_telegram: "LINKING TO TELEGRAM",
      label_not_enough_balance: "NOT ENOUGH BALANCE",
      label_adding_access_key: "ADDING ACCESS KEY",
      label_initializing_account: "INITIALIZING ACCOUNT",
      text_disclaimer_starting: "Ensure your wallet has {startingFee} NEAR for network fee",
      text_disclaimer_consumed:
        "A minor fee of {consumedNetworkFee} NEAR will be spent for network and storage fee",
      button_create_account: "CREATE ACCOUNT",
      button_next: "NEXT",
      button_start: "START",
      modal: {
        label_or: "or",
        deposit: {
          title: "Ready to MOON?",
          description:
            "Make sure you have verified your TG or have you account deposit with NEAR to kickstart",
          text_your_telegram_has_been_linked: "Your telegram already has a primary wallet",
          label_or: "or",
          button_verify_telegram_account: "Verify Telegram Account",
          button_deposit_near: "Deposit {startingFeeDisplayed} NEAR",
        },
        insufficient_balance: {
          title: "🔥 Ooops, Insufficient NEAR for Gas",
          description_1: "Most transactions cost lesser than 0.01 NEAR.",
          description_2:
            "However, the NEAR protocol uses a pessimistic gas estimation to cover the worst-case scenario during peak times.",
          description_3: "Please ensure you have",
          description_4: "at least 0.2 NEAR",
          description_5: "in your wallet to enjoy a seamless experience.",
          button_top_up: "Get More Near Now",
        },
      },
    },
    maintenance: {
      title: "Game Update in Progress",
      description:
        "Harvest Moon is temporarily paused for a contract upgrade to bring you a smoother experience.",
      footer: "We'll be back in roughly 4 hours—thanks for your patience!",
      label_migration_notice: "Migration Notice",
      button_learn_more: "Learn More",
    },
    social_onboarding: {
      join_telegram: "JOIN OUR TELEGRAM CHANNEL",
      join_twitter: "FOLLOW METEOR ON X",
      complete_to_start: "Complete the steps below to start",
      ready_to_start: "Ready to start!",
      start: "START",
    },
    landing: {
      title: "YOU'RE NOT WHITELISTED",
      button_apply_now: "APPLY NOW",
      button_back_to_meteor: "BACK TO METEOR",
    },
    main: {
      text_wallet_address: "WALLET ADDRESS",
      text_total_moon_token: "Total $MOON Token",
      text_max: "MAX",
      text_per_hour: "$MOON/HOUR",
      text_harvesting: "HARVESTING",
      text_full_moon: "FULL MOON",
      text_moon_balance: "BALANCE",
      warning_connect_telegram: "Connect your Telegram account to get daily 10 free gas fee!",
      warning_save_credentials:
        "Please save your seed phrase and private key to avoid losing your progress!",
      warning_storage_full: "STORAGE FULL",
      button_harvest: "Harvest",
      button_next_harvest: "NEXT HARVEST",
      button_harvest_moon: "Harvest Moon",
      button_to_wallet: "To Wallet",
    },
    onboarding: {
      main: {
        title: "ONBOARDING",
        description:
          "Your new chapter in the Meteor Wallet Universe awaits! Complete a few simple steps to embark on your adventure.",
        label_link_telegram: "LINK TELEGRAM ACCOUNT",
        description_link_telegram: "Link wallet to telegram to get gas free gameplay!",
        label_add_access_key: "ADD ACCESS KEY",
        description_add_access_key:
          "Add permissions (function call access key) to your account for the Harvest Moon experience.",
        label_initialize_account: "INITIALIZE ACCOUNT",
        description_initialize_account: "Initialize your game account with a complimentary Tinker.",
        label_go_to_moon: "GO TO MOON",
        description_go_to_moon: "Your moon journey is all prepared; begin harvesting now.",
        message_linked: "Linked to",
        message_linked_no_tg: "Wallet is linked to another telegram account",
        message_not_linked: "Telegram account is not linked",
        message_tg_linked: "Telegram is linked to this wallet",
        message_gas_free: "You are eligible for gas-free gameplay",
        message_network_fee: "A small network fee is required for non telegram-verified account",
        message_deposit_fee: "This requires a 0.003 NEAR storage deposit",
        warning_wallet_already_linked:
          "Wallet was linked to another telegram account. Please use another wallet.",
        button_link: "LINK NOW",
        button_add: "ADD NOW",
        button_init: "INIT NOW",
        button_go: "GO NOW",
      },
      warning: {
        title: "LINK YOUR WALLET TO TELEGRAM",
        text_basic_union_contract: "basic union contract(s)",
        text_gas_free: "Gas free",
        text_transaction: "transactions",
        text_new_access_key_required: "A new access key is required for the updated Harvest Moon",
        message:
          "By linking your wallet ({wallet_id}) to telegram account ({username}), your accumulated referral rewards will be claimed. Linking to telegram will give your benefits below:",
        warning: "Rewards cannot be transferred once claimed",
        button_proceed: "Proceed",
        button_cancel: "Cancel",
      },
      step_1: {
        message:
          "Welcome to Harvest Moon—your new chapter within the Meteor Wallet universe awaits! Are you prepared to embark on this journey and claim your rewards?",
        button_continue: "CLICK TO CONTINUE",
      },
      step_2: {
        message_not_verified:
          "Let's set up your account, quick and easy—it'll only take 30 seconds. Ready?",
        message_verified:
          "First, we'll quickly set up your account—it just takes 30 seconds. Without linking to Telegram, there's a small network fee (approx. 0.003N) for transactions. Ready to start?",
        option_continue: "Yeah, let's go",
        option_cancel: "Nope, bring me back to Meteor Wallet",
      },
      step_3: {
        message:
          "To get started, we'll add a functional access key to your account, enabling seamless interactions with the Harvest Moon contract.",
        button_continue: "Let's do it",
        button_try_again: "Try Again",
      },
      step_4: {
        message_setting_up_account:
          "Great, your account is being set up. Hang tight while we get things ready!",
        message_not_enough_balance:
          "You don't have enough balance to initialize the account. Please top up your account with NEAR and try again.",
        option_try_again: "Try Again",
        option_back: "Go Back",
      },
      step_5: {
        message: "All set! Lets go to the MOON!",
        button_ok: "Alright",
      },
    },
    tab: {
      title: {
        harvest: "HARVEST",
        tinker: "TINKERS",
        upgrade: "UPGRADES",
        mission: "MISSIONS",
      },
      lumen_lab: {
        title_lab_stats: "LAB STATS",
        label_container: "CONTAINER",
        text_upgrade_container: "USE $MOON TOKEN TO UPGRADE YOUR CONTAINER, FOR LONGER HARVEST",
        label_lab_capacity: "LAB CAPACITY",
        text_upgrade_lab: "USE $MOON TOKEN TO UPGRADE YOUR LAB CAPACITY TO RECRUIT MORE TINKERS",
        text_hour: "HOUR",
        text_moonlight_storage: "MOONLIGHT STORAGE",
      },
      tinker_recruitment: {
        text_moon_per_hour: "$MOON/HOUR",
        text_active_tinkers: "ACTIVE TINKERS",
        text_total_tinkers: "TOTAL TINKERS",
        text_lab_capacity: "LAB CAPACITY",
        text_available_union_contracts: "Available union contracts",
        warning_min_tinker_count: "Recruit at least 1 Tinker",
        button_recruit: "RECRUIT",
      },
      portal_referral: {
        text_coming_soon: "More details about your friends will be shown here soon.",
        text_my_frens: "MY FRIENDS",
        text_moon_earned: "$MOON EARNED",
        warning_no_telegram: "Link your wallet to Telegram to get your referral links",
        warning_link_telegram:
          "Link your wallet to Telegram to access referral links and start earning rewards",
        button_share_on_tg: "SHARE ON TG",
        button_share_on_x: "SHARE ON X",
        button_copy_referral_link: "COPY REFERRAL LINK",
        button_link_to_telegram: "Link to Telegram",
        content_share_on_x: `🚀🌕 Harvest, Recruit, Forge, and Earn Airdrop! 🌾💎

No downloads, just one click to get started on Telegram.

Claim your airdrop effortlessly and boost your rewards with my referral link below. 

It's time to MOON! 👇
`,
        content_share_on_tg: `🚀🌕 **Harvest, Recruit, Forge, and Earn Airdrop!** 🌾💎

No downloads, just one click to get started on Telegram.

Claim your airdrop effortlessly and boost your rewards with my referral link below. 

It's time to MOON! 👇
`,
      },
      setting: {
        warning_link_telegram_success: "Telegram account linked successfully",
        button_link_to_telegram: "LINK WALLET TO TELEGRAM",
        button_give_feedback: "GIVE FEEDBACK",
        button_view_secret_phrase: "VIEW SECRET PHRASE",
        button_export_private_key: "EXPORT PRIVATE KEY",
        button_quit_game: "QUIT GAME",
      },
    },
    modal: {
      unopen_reward: {
        title: "Congratulations!",
        description: "You have obtained",
        button_cool: "Cool!",
        reward_id: "Reward ID",
        from: "From",
      },
      link_to_telegram: {
        title: "LINK TO TELEGRAM",
        description: "Get direct game updates and become eligible for our referral program",
        text_dont_show_again: "Don't show this again",
        button_link_wallet: "LINK WALLET",
      },
      upgrade: {
        container: {
          title: "UPGRADE STORAGE",
          description: "USE $MOON TOKEN TO UPGRADE YOUR CONTAINER FOR LONGER HARVEST",
        },
        lab: {
          title: "UPGRADE LAB",
          description: "USE $MOON TOKEN TO UPGRADE YOUR LAB TO RECRUIT MORE TINKERS",
        },
        label_current_level: "CURRENT LEVEL",
        label_upgrade_level: "UPGRADE LEVEL",
        text_moon: "$MOON",
        button_upgrade: "UPGRADE",
      },
      maintenance: {
        title: "MAINTENANCE NOTICE",
        description:
          "We've successfully migrated to a new smart contract to enhance your gaming experience. If your Tinkers or $MOON balance don't look right, let us know.",
        button_report_issue: "Report Issue",
      },
      leaderboard: {
        title: "Leaderboard",
        loading: "Getting leaderboard data",
        text_rank: "Rank",
        text_player_name: "Player Name",
        text_moon_hr_rate: "$MOON/Hour",
        text_total_players: "Total {count} Players",
        button_close: "CLOSE",
        label_boost: "Boost",
        button_rank_higher: "Tips to rank higher",
        button_share: "Share",
        mission_menu_title: {
          SWAP_TO: "Memecoin Trading Mission",
          HM_TIME_TRAVEL: "Time Traveling Mission",
          BRIDGE_FROM: "Bridging Mission",
        },
        mission_value1_title: {
          SWAP_TO: "Trade Volume",
          HM_TIME_TRAVEL: "Time Travel",
          BRIDGE_FROM: "Bridged Vol",
        },
        streak: "Streak",
        tinker_lab_rankings: "Tinker Lab Rankings",
        streak_rankings: "Streak Rankings",
      },
      promo: {
        title: "🌕 Join Harvest MOON!",
        description_1: "Your new, simple way to play & earn in the crypto world:",
        description_2: "🎮 𝗣𝗹𝗮𝘆: Fun tasks for rewards",
        description_3: "🌙 𝗛𝗮𝗿𝘃𝗲𝘀𝘁: Grab $MOON tokens",
        description_4: "🚀 𝗘𝗮𝗿𝗻: $MOON = Meteor airdrops",
        button_go: "Let's go!",
      },
      menu: {
        title: {
          [EHarvestMoon_Menu.home]: "",
          [EHarvestMoon_Menu.lab]: "LUMEN LAB",
          [EHarvestMoon_Menu.tinker]: "TINKER RECRUITMENT",
          [EHarvestMoon_Menu.referral]: "REFERRAL PORTAL",
          [EHarvestMoon_Menu.quest]: "CRYPTO QUESTS",
          [EHarvestMoon_Menu.setting]: "SETTINGS",
        },
        description: {
          [EHarvestMoon_Menu.home]: "",
          [EHarvestMoon_Menu.lab]:
            "Upgrade your container for longer harvest and increase lab capacity to recruit more Tinkers.",
          [EHarvestMoon_Menu.tinker]:
            "Use contracts for chance-based recruitment of Tinkers who harvest moonlight at varying rates.",
          [EHarvestMoon_Menu.referral]:
            "Each friend invited earns you a Basic Union Contract + 20% of their $MOON, forever.",
          [EHarvestMoon_Menu.quest]:
            "Missions that boost your crypto skills and leverage the power of DeFi for your benefit.",
          [EHarvestMoon_Menu.setting]: "",
        },
      },
      harvest_summary: {
        not_eligible: "Not eligible",
        label_click_to_reveal_prize: "Click to Reveal Prize",
        label_you_have_won: "You've won a",
        label_and_token_drop: "and a token drop",
        label_won_token_drop: "You won a token drop",
        button_click_to_continue: "Click to continue",
        contract_type: {
          basic: "BASIC CONTRACT",
          advanced: "ADVANCED CONTRACT",
          expert: "EXPERT CONTRACT",
        },
        title: "Harvest Summary",
        description:
          "Your harvest is complete! See how your Tinkers performed and if you qualified for contracts or token drops",
        congratulations: "Congratulations",
        contract_drop: "Contract Drop",
        token_drop_campaign: "Token Drop",
        criteria_not_met_title: "Criteria not met",
        criteria_not_met_desc: "You didn’t met campaign criteria, want your piece of $25K USDC? ",
        win_rate: "Win Rate",
        better_luck_next_time_title: "Better luck next time",
        better_luck_next_time_desc_1: "Improve your chance by upgrade your account",
        better_luck_next_time_desc_2: "The token drop is always 50/50 chance",
        you_have_won: "You've won",
        learn_more: "Learn More",
        you_got: "You got",
        view_more: "View More",
        traded: "Traded",
        text_upgrade_container: "Higher $MOON storage boosts your drop rate and harvest size.",
        text_upgrade_tier: {
          one: "Level 1 – You only qualify for Basic Contracts.",
          two: "Level 2 – You qualify for Basic and Advanced Contracts.",
          three: "Level 3 – You qualify for Basic, Advanced, and Expert Contracts.",
        },
        subtitle: "HARVEST RECEIPT",
        label_container_size: "TOTAL TIME",
        label_lab_capacity: "LUMEN LAB",
        label_total_moon_tokens: "TOTAL $MOON",
        text_moon: "$MOON",
        text_moon_harvested: "Harvested",
        text_moon_per_hour: "$MOON / Hour",
        text_union_contract_chance: "UNION CONTRACT LOTTERY!",
        text_harvest_and_win: "HARVEST & WIN",
        text_tinkers: "TINKERS",
        text_get_referral: "Get rewarded by sharing this on X! (referral link included)",
        label_win: "CONGRATULATIONS",
        text_win: "You've won a {contract_type}!",
        label_lose: "NEXT TIME!",
        text_lose: "HARVEST AGAIN FOR YOUR CHANCE AT A UNION CONTRACT!",
        button_close: "Close",
        share_on_x: "Share on X",
        rank: "Rank",
        content_share_on_x: `My latest Harvest Summary: Tinkers help me harvest free $MOON tokens for future airdrops

What is Harvest Moon? The simplest way to play and earn crypto, all through @MeteorWallet

𝗥𝗲𝗮𝗱𝘆 𝘁𝗼 𝗷𝗼𝗶𝗻?
First 3 clicks win a golden ticket for Beta`,
        label_upgrade_your_account: "Upgrade your account",
        label_harvesting_longer_hours: "Harvesting longer hours",
        label_enhance_your_moon_container: "Enhance your MOON Container",
        button_upgrade: "Upgrade Now",
        button_enhance: "Enhance Now",
        label_next_time: "NEXT TIME !",
        text_next_time: "Oops, improve your chances of securing a union contract by :",
        label_new_moon_balance: "$MOON Balance",
        label_drop_rate: "Drop Rate",
        hint_drop_rate:
          "The longer you harvest, the higher your contract drop rate. Additionally, your player level and container upgrades also influence your contract drops.",
        label_no_drop: "No Drop",
        label_drop: "Drop",
        reward: "Reward",
        result: "Result",
        win: "Win",
        try_again: "Try Again",
        win_odd: "Win Rate",
        random_odd: "Chance Roll",
      },
      recruitment: {
        text_recruit_with: "RECRUIT WITH",
        text_tinkers_to_recruit: "How many Tinkers do you want to recruit?",
        warning_max_tinker_count: "You can only recruit maximum ",
        button_use_max: "USE MAX",
        button_recruit: "RECRUIT",
      },
      recruitment_reveal: {
        text_the: "THE",
        text_moon_per_hour: "$MOON / HOUR",
        button_skip: "SKIP",
        button_click_to_continue: "CLICK TO CONTINUE",
      },
      recruitment_summary: {
        title: "RECRUITMENT SUMMARY",
        text_mph: "MPH",
        text_new_mph: "NEW MPH",
        button_ok: "OK",
        share_on_x: "SHARE ON X",
        label_max_capacity_reached: "Max lab capacity reached",
        button_details: "Details",
        button_upgrade_lab: "Upgrade Lab Now",
        content_share_on_x: `My new Tinker Recruitment: they help me harvest free $MOON tokens for future airdrops

What is Harvest Moon? The simplest way to play and earn crypto, all through @MeteorWallet

𝗥𝗲𝗮𝗱𝘆 𝘁𝗼 𝗷𝗼𝗶𝗻?
First 3 clicks win a golden ticket for Beta`,
        text_get_more_contract: "GET MORE CONTRACTS BY SHARING THIS ON X",
        text_referral_link: "REFERRAL LINK AUTOMATICALLY ADDED",
      },
      fusion_summary: {
        title: "Time Travel Summary",
        label_total_travelled: "Total Travelled",
        label_total_success: "Total Success",
        label_total_failed: "Total Failed",
        content_share_on_x_success: `Tinker survived time travel!🌌
Lvl'd up to harvest more $MOON

Earn @MeteorWallet #airdrops!

One-click on Telegram:
`,
        content_share_on_x_failed: `Tried to time travel, got rekt 😂💀
Need more tinkers ASAP!

Earn @MeteorWallet #airdrops!

One-click on Telegram:
`,
      },
      account_verified: {
        title: "ACCOUNT VERIFIED",
        description: "Your Telegram account has been verified.",
        button_ok: "OK",
      },
      coming_soon: {
        title: "COMING SOON",
      },
      warning: {
        title: "WARNING",
        button_ok: "OK",
      },
      production_guide: {
        title: "HARVESTING MOONLIGHT",
        text_moon_per_hour: "$MOON/hour",
        text_with: "with a",
        text_hour: "hour",
        text_container: "container",
        text_max_harvest: "max harvest",
        text_get_more_moon: "More $MOON/hour?",
        text_get_more_hours: "More hours? ",
        link_get_tinkers: "Get Tinkers",
        link_upgrade_container: "Upgrade Container",
      },
      storage_guide: {
        title: "MOONLIGHT STORAGE",
        link_upgrade_container: "Upgrade Container",
        text_your_storage: "Your storage is",
        text_full_and_fills: "full and fills up",
        text_every: "every",
        text_hours: "hours",
        text_want_more_hours: "Want more hours?",
      },
      tinker_guide: {
        title: "EXPLORER'S HANDBOOK",
        text_moon: "$MOON",
        text_harvest_rates: "HARVEST RATES",
        text_every_hour: "EVERY HOUR",
      },
    },
    tinker: {
      name: {
        "1": "Intern",
        "2": "Researcher",
        "3": "Scientist",
        "4": "Genius",
        "5": "Brain",
      },
    },
    contract: {
      name: {
        [EHM_UnionContractTypes.basic]: "Basic",
        [EHM_UnionContractTypes.advanced]: "Advanced",
        [EHM_UnionContractTypes.expert]: "Expert",
      },
      fullname: {
        [EHM_UnionContractTypes.basic]: "Basic Contract",
        [EHM_UnionContractTypes.advanced]: "Advanced Contract",
        [EHM_UnionContractTypes.expert]: "Expert Contract",
      },
      description: {
        [EHM_UnionContractTypes.basic]: "Recruits mostly Interns, sometimes Researchers",
        [EHM_UnionContractTypes.advanced]: "Recruits mostly Scientists, sometimes Geniuses",
        [EHM_UnionContractTypes.expert]: "Recruits mostly Genius, sometimes Brains",
      },
    },
    tinker_phase: {
      title: {
        [EHarvestMoon_TinkerGuideModalPhase.active_tinker]: "ACTIVE TINKERS",
        [EHarvestMoon_TinkerGuideModalPhase.union_contract]: "UNION CONTRACTS",
      },
      description: {
        [EHarvestMoon_TinkerGuideModalPhase.active_tinker]:
          "More Tinkers than space? We put the best ones to work. Make sure your lab has room to get the most from your Tinkers.",
        [EHarvestMoon_TinkerGuideModalPhase.union_contract]:
          "Use contracts for chance-based recruitment of Tinkers who harvest moonlight at varying rates.",
      },
    },
    share: {
      telegram: `𝗛𝗮𝘃𝗲 𝘆𝗼𝘂 𝗵𝗲𝗮𝗿𝗱 𝗼𝗳 𝗛𝗮𝗿𝘃𝗲𝘀𝘁 𝗠𝗢𝗢𝗡? I just joined and it's pretty much the simplest way to play & earn in the crypto world - powered by Meteor Wallet.

🎮 𝗣𝗹𝗮𝘆: Fun tasks for rewards

🌙 𝗛𝗮𝗿𝘃𝗲𝘀𝘁: Grab $MOON tokens

🚀 𝗘𝗮𝗿𝗻: $MOON = Meteor airdrops

𝗥𝗲𝗮𝗱𝘆 𝘁𝗼 𝗷𝗼𝗶𝗻?
First 3 clicks win a golden ticket for Beta
`,
    },
  },
  common: {
    transaction_not_safe_ids: {
      [ETransactionNotSafeId.not_safe_delete_account]: {
        title: "Delete Account detected",
        desc: "It appears that an external app is trying to delete your account in this transaction. We are preventing the execution of this transaction. Please use the Meteor Wallet directly if you wish to delete your account.",
      },
      [ETransactionNotSafeId.not_safe_deploy_contract]: {
        title: "Deploy Contract detected",
        desc: "It appears that an external app is trying to deploy a contract to your account in this transaction. This action is not safe. We are preventing the execution of this transaction.",
      },
      [ETransactionNotSafeId.not_safe_add_key_full_access]: {
        title: "Add Full Access Key detected",
        desc: "It appears that an external app is trying to add a full access key to your account in this transaction. This would allow them to drain your account. We are preventing the execution of this transaction.",
      },
      [ETransactionNotSafeId.not_safe_delete_key_full_access]: {
        title: "Delete Full Access Key detected",
        desc: "It appears that an external app is trying to delete a full access key from your account in this transaction. This may prevent you from having access to your account. We are preventing the execution of this transaction.",
      },
    },
    error_ids: {
      [EOldMeteorErrorId.merr_account_access_key_not_found]:
        "Unable to locate the account access key.",
      [EOldMeteorErrorId.merr_sign_message_verify_mismatch]:
        "Verification failed. Signature does not match.",
      [EOldMeteorErrorId.merr_account_signed_request_mismatch]:
        "Verification failed. Mismatch detected in signed request.",
      [EOldMeteorErrorId.merr_account_signed_request_not_full_access_key]:
        "Request does not correspond to a full access key.",
      [EOldMeteorErrorId.merr_enrollment_failed]: "Mission Enrollment Failed",
      [EOldMeteorErrorId.merr_enrollment_failed_no_gas]:
        "Insufficient balance. Please top up to proceed.",
      [EOldMeteorErrorId.merr_reward_redeem_failed]: "Transaction failed. Unable to redeem reward.",
      [EOldMeteorErrorId.merr_reward_redeem_failed_no_gas]:
        "Insufficient balance. Please top up to proceed.",
      [EOldMeteorErrorId.merr_reward_claim_ft_failed]: "Token reward claim unsuccessful.",
      [EOldMeteorErrorId.merr_reward_claim_ft_failed_no_gas]:
        "Insufficient balance. Please top up to proceed.",
      [EOldMeteorErrorId.merr_reward_claim_nft_failed]: "NFT reward claim unsuccessful.",
      [EOldMeteorErrorId.merr_reward_claim_nft_failed_no_gas]:
        "Insufficient balance. Please top up to proceed.",
      [EOldMeteorErrorId.merr_unwrap_near_failed]: "NEAR unwrapping process unsuccessful.",
      [EOldMeteorErrorId.merr_profile_update_failed]: "Profile update unsuccessful.",
      [EOldMeteorErrorId.merr_profile_update_pfp_failed]: "Profile picture update unsuccessful.",
      [EErrorId_AccountSignerExecutor.signer_executor_stale_execution]:
        "Execution stale. Attempted execution of outdated process.",
      [EErrorId_AccountSignerExecutor.signer_executor_execution_cancelled]:
        "Execution cancelled. User-initiated termination of process.",
      [EErrorId_AccountSignerExecutor.signer_executor_execution_not_finished]:
        "Execution interrupted. Process not yet completed.",
      [EErrorId_AccountSignerExecutor.signer_executor_only_cancel_async_signing]:
        "Cancellation denied. Asynchronous signing process not cancellable.",
      [EErrorId_AccountSignerExecutor.signer_executor_ordinal_state_nonexistent]:
        "Signer Executor Error: Ordinal State Nonexistent",
      [EErrorId_AccountSignerExecutor.signer_executor_step_index_nonexistent]:
        "Signer Executor Error: Step Index Nonexistent",
      [EErrorId_AccountSignerExecutor.publishing_transaction_not_signed]:
        "Transaction unsigned. Signing rejected on Ledger device.",
      [EErrorId_AccountSignerExecutor.publishing_transaction_failed]:
        "Transaction failure. Publishing process unsuccessful.",
      [EErrorId_AccountSignerExecutor.publishing_transaction_failed_final_execution_outcome]:
        "Transaction failure. Publishing process unsuccessful.",
      [EErrorId_AccountSignerExecutor.publishing_transaction_failed_receipt_execution_outcome]:
        "Transaction failure. Publishing process unsuccessful.",
      [EErrorId_AccountSignerExecutor.publishing_transaction_failed_near_error]:
        "Transaction failure. Publishing process unsuccessful.",
      [EErrorId_AccountSignerExecutor.publishing_delegated_transaction_failed]:
        "Transaction failure. Publishing process unsuccessful.",
      [EErr_NearLedger.ledger_user_rejected_action]: "User declined action on Ledger device.",
      [EErr_NearLedger.ledger_invalid_data_received]:
        "Invalid data. Incorrect or corrupted data received from Ledger.",
      [EErr_NearLedger.ledger_transaction_data_too_large]:
        "Data exceeds Limit. Transaction data size too large for Ledger.",
      [EErr_NearLedger.ledger_unknown_transport_status_error]:
        "Transport error. Unknown data transmission issue with Ledger.",
      [EErr_NearLedger.ledger_unknown_transport_error]:
        "Connection issue. Poor or unstable connection with Ledger device.",
      [EErr_NearLedger.ledger_device_browser_refresh_needed]:
        "Improper state. Ledger device not in correct operating state.",
      [EErr_NearLedger.ledger_device_unknown_error]:
        "Unknown error. Unidentified issue with Ledger device.",
      [EErr_NearLedger.ledger_device_connection_refused]:
        "User refused the connection to the Ledger device.",
      [EErr_NearLedger.ledger_near_app_not_open]: "NEAR app not open on Ledger",
      [EErr_NearLedger.ledger_unable_to_process_instruction]:
        "Ledger couldn't process instruction, most likely locked.",
      [EErr_NearLedger.ledger_device_locked]: "Ledger device is locked",
    },
    errors: {
      title_unknown_error: "Unknown Error",
      desc_unknown_error: "An unknown error occurred. Please let the Meteor team know.",
    },
    maintenance: {
      title_maintenance: "We're under maintenance",
      desc_maintenance:
        "Please check back soon, just putting little touch up on some pretty updates.",
    },
  },
  services: {
    near: {
      networkNames: {
        [ENearNetwork.testnet]: "Testnet",
        [ENearNetwork.betanet]: "Betanet",
        [ENearNetwork.mainnet]: "Mainnet",
        [ENearNetwork.localnet]: "Localnet",
      },
      networkNamesShort: {
        [ENearNetwork.testnet]: "Test",
        [ENearNetwork.betanet]: "Beta",
        [ENearNetwork.mainnet]: "Main",
        [ENearNetwork.localnet]: "Local",
      },
    },
    refresh: {
      refreshText: "Refresh",
      updatingText: "Updating",
    },
    copy: {
      common: "Copied {data}",
      copy_id: "Copy wallet ID",
      wallet: "Copied Wallet ID",
    },
    delete: {
      common: "Delete Account",
      delete: "Delete",
      cancel: "Cancel",
      delete_this_account: "Delete this account",
      delete_this_account_note: "Are you sure you want to remove this account from your wallet?",
    },
    fund: {
      almost_there: "Almost there !",
      check_now: "Check now",
      checking: "Checking...",
      send_at_least: "Send at least 0.1 Near to your wallet address to activate the account",
      fund_via_testnet: "Fund via Testnet",
      checking_again_in: "Checking again in ",
      error_occurred: "An error occurred while querying wallet state ",
    },
    user: {
      needLogin: "You need login to do that.",
    },
  },
  buttonText: {
    createNewAccount: "Create new wallet",
    importAccount: "Import an existing wallet",
    updateText: "Update",
    continueText: "Continue",
    confirmText: "Confirm",
    createWallet: "Create Wallet",
  },
  sidebarUi: {
    button_addWallet: "Add Wallet",
    button_settings: "Settings",
    button_signOut: "Lock Wallet",
    noWalletBlurb: "Create or import a new wallet to get started",
    notSignedInBlurb: "Sign to access your wallets",
  },
  mainUi: {
    menu_button_wallets: "Wallets",
    heading_myAssets: "My Assets",
    button_deposit: "Top Up",
    button_send: "Send",
    button_stake: "Stake",
    button_swap: "Swap",
    button_explore: "Explore",
    button_bridge: "Bridge",
    updating: "Updating...",
  },
  pageContent: {
    walletConnect: {
      blurb_noAccountFound: "No Meteor Wallet account found for connecting to external app",
    },
    linkdrop: {
      title_incorrect_link_format: "Oops, something went wrong",
      description_incorrect_link_format:
        "Incorrect link format. Please check your url and try again",
      title_drop_claimed: "Drop has been claimed.",
      description_drop_claimed:
        "This NEAR Drop has already been claimed.NEAR Drops can only be used to create a single account and the link then expires.",
      title_received_drop: "You've received a NEAR drop!",
      title_received_ft_drop: "You've received {symbol} drop!",
      description_received_drop: "Claim with an existing account or create a new account",
      claim: "Claim",
      claim_with_following_account: "Claim with the following account:",
      claim_with_new_account: "Claim with new account",
      claim_success_title: "Confirmed",
      claim_success_description: "You have successfully claimed the drop",
      claim_success_with_redirect_description:
        "You have successfully claimed the drop and will be redirected back to the app shortly.",
      something_went_wrong_title: "Something went wrong",
      something_went_wrong_description: "Please try again later or use another link.",
      or: "Or",
    },
    linkdropClaimedSuccess: {
      title: "Drop Claimed",
      subtitle: "The gifted assets have been added to your wallet successfully!",
      button_redirect: "Return to site",
    },
    topup: {
      heading_get_near: "Get $NEAR",
      buy_near: "Buy $NEAR",
      onramper_description: "Aggregator that has all major fiat-to-crypto onramps",
      bridge_from_eth_aurora: "Bridge From Ethereum/Aurora",
      rainbow_bridge_description: "Bridge between or send within Ethereum, NEAR and Aurora",
      supported_cex: "Supported Centralized Exchanges",
      okx_description:
        "Discover crypto, on top of one of the world's most reliable crypto trading & web3 apps",
      binance_description: "The world's leading blockchain ecosystem and digital asset exchange.",
      huobi_description: "The World's Leading Exchange",
      kraken_description: "Kraken is your bridge to the world of crypto.",
    },
    extensionConnect: {
      blurb_extensionInstalled: "Your accounts can now be accessed through the extension as well!",
      title_extensionInstalled: "Meteor Extension Installed",
      button_text_continueToApp: "Continue",
    },
    walletHome: {
      subtext_availableFunds: "Available Balance",
      tooltip_availableFunds: "Your spendable balance excluding funds locked or staked.",
      warning_needsRecoveryBackup: "Wallet Recovery Phrase Not Backed Up",
      warning_needsRecoveryBackup_desc: "Store Your Seed Phrase",
      warning_needsRecoveryBackup_btn: "Save Now",
      warning_insecureWallet: "Unencrypted Wallet",
      warning_insecureWallet_desc: "Protect Your Wallet",
      warning_insecureWallet_btn: "Set Password",
      warning_networkIssue_title: "Network Issues",
      warning_networkIssue_desc:
        "Near Protocol is congested. Transactions may be slow; some features may be temporarily unavailable.",
      warning_scamTokenCount: "{count} scam token is hidden",
      warning_scamTokenCount_multi: "{count} scam tokens are hidden",
      warning_hiddenTokenCount: "{count} small balance token hidden",
      warning_hiddenTokenCount_multi: "{count} small balance tokens hidden",
      button_updates: "Updates",
      tooltip_recent_updates: "You can find the latest updates here",
      tooltip_total_balance: "Total Balance",
      tooltip_storage_reserve: "Storage Reserve",
      tooltip_gas_reserve: "Gas Reserve",
      tooltip_spendable: "Spendable",
      import_token: {
        title: "Import Token",
        description: "Enter the token address to import the token into your wallet",
        placeholder: "Search Token Address ...",
        button_add_token: "Add Selected Token",
        market_price: "Market Price",
        my_balance: "My Balance",
        my_balance_in_usd: "My Balance in USD",
        warning_please_enter_token: "Please enter the token contract address above",
        warning_invalid_token: "The token address that you input is invalid",
        toast_title_token_added: "Token Added Successfully",
        toast_text_token_added: "You have added the token successfully",
      },
    },
    addressBook: {
      text_noAddressesFound: "No Addresses Found",
      heading_otherOwnedAccounts: "Your Other Wallets",
      heading_savedAccounts: "Saved Addresses",
      heading_recentlyUsedAccounts: "Recently Used Addresses",
    },
    walletDeposit: {
      heading_deposit: "Deposit",
      text_copy_wallet: "Copy Wallet ID ",
    },
    walletSwap: {
      swap: "Swap",
      confirm_swap: "Confirm Swap",
      something_wrong: "Something went wrong",
      failed_build_transaction: "Failed to build transaction",
      preparing_transaction: "Preparing your transaction",
      getting_transaction_ready: "Getting your transaction ready.",
      executing_step: "Executing Step",
      calling: "Calling",
      you_receive: "You receive",
      you_pay: "You pay",
      swap_successful: "Swap Successful",
      swap_success_desc: "You have swapped your tokens successully",
      swap_failed: "Swapped Failed",
      swap_failed_desc:
        "Something went wrong. Please check your transaction history for more details.",
      close: "Close",
      review_swap: "Review Swap",
      route_not_found: "Route Not Found",
      inadequate_balance: "Inadequate Balance",
      show_all_routes: "Show all available routes",
      to_contract: "to contract",
      do_no_close_page: "Please do not close this page or refresh your browser",
      provider: "Provider",
      price_impact: "Price Impact",
      meteor_fee: "Meteor Fee",
      meteor_fee_desc: "Zero Fees, Only Best Rates",
      provider_fee: "Provider Fee",
      network_fee: "Network Fee",
      swap_fee: "Swap Fee",
      route: "Provider",
      minimum_received: "Minimum Received",
      best_route: "Best Route",
      find_token_hint: "Search token with token symbols, name or address",
      label_swap_details: "Swap Details",
      label_please_enter_amount: "Please enter amount",
      label_select_token: "Select Token",
      hint_search_token: "Search token symbol, name or address",
      label_slippage: "Slippage",
      button_confirm: "Confirm",
      title_slippage: "Slippage Setting",
      desc_slippage:
        "Your transaction will fail if the price changes more than the slippage. Too high of a value will result in an unfavorable trade.",
      // label_support_fees: `Quote includes {METEOR_SWAP_FEE}% Meteor fees to support the team`,
      label_support_fees: "We charge no fee now, but fees may be added in the future.",
      label_loading: "Loading",
      label_fees: "Fees",
      label_quote: "Quote",
      label_error_message: "Error Message",
      label_successful: "Successful",
      description_success:
        "Your transaction was completed successfully! The swapped tokens are now available in your wallet.",
      description_failed:
        "Swap failed due to price movement beyond your slippage tolerance (${oldSlippage}%). Retry with higher tolerance (${suggestedSlippage}%).",
      label_swap_summary: "Swap Summary",
      label_you_send: "You Send",
      label_you_received: "You Received",
      button_back_to_home: "Back to Home",
      button_back_to_redirect_url: "Back to Redirect Url",
      button_try_again: "Try Again",
      title_slippage_error: "Oops, Slippage Error!",
    },
    walletStake: {
      liquid_staking: "Liquid Staking",
      standard_staking: "Standard Staking",
      liquid_staking_desc: "Stake your NEAR to receive stake tokens. You can then reinvest these.",
      standard_staking_desc: "Lock up your NEAR to receive ~10% APY",
      create_new_staking: "Create New Staking",
      create_new_staking_desc: "Earn rewards now by locking up your NEAR!",
      my_staked_validators: "My Staked Validators",
      display_newly_staked_note: "It may take ~1 minute to display your newly staked validator.",
      search_validator: "Search validator",
      load_more: "Load More",
      something_wrong: "Something went wrong",
      staking_failed: "Staking failed",
      staking_failed_went_wrong: "Staking failed: something went wrong",
      unstake_failed: "Unstaking failed",
      unstake_failed_went_wrong: "Unstaking failed: something went wrong",
      staked_success: "Staked Successfully",
      staked_success_msg: "You have successfully staked",
      unstaked_success: "Unstaked Successfully",
      unstaked_success_msg: "You have successfully unstaked",
      review_staking: "Review Staking",
      review_unstaking: "Review Unstaking",
      you_stake: "You Stake:",
      you_unstake: "You Unstake:",
      you_receive: "You Receive",
      validator_details: "Validator Details",
      confirm: "Confirm",
      staking: "Staking",
      close: "Close",
      stake: "Stake",
      unstake: "Unstake",
      to: "To",
      from: "From",
      create_liquid_staking: "Create Liquid Staking",
      liquid_unstake: "Liquid Unstake",
      inadequate_balance: "Inadequate Balance",
      minimum_liquid_note: "Minimum liquid staking amount is",
      staking_details: "Staking Details",
      you_are_staking: "You're staking",
      staking_with: "with",
      days: "Days",
      estimated_earnings: "Estimated Earnings",
      select_your_validator_pool: "Select Your Validator/Pool",
      select_validator: "Select Validator",
      insufficient_balance: "Insufficient Balance",
      use_max: "Use Max",
      available: "Available",
      create_standard_staking: "Create Standard Staking",
      amount_to_unstake_in: "Amount to unstake in",
      active: "Active",
      reward_token_s: "Reward Token(s)",
      inactive: "Inactive",
      total_staked: "Total Staked",
      estimated_apy: "Estimated APY",
      staked_near: "Staked NEAR",
      staked_near_tooltip: "Amount of near staked. NEAR token rewards are automatically re-staked.",
      unclaimed_reward: "Unclaimed Reward",
      unclaimed_reward_tooltip:
        "Rewards that have been earned, but not withdrawn. NEAR token rewards are automatically restaked.",
      you_unstaking: "You are unstaking",
      usually_take_72_hour_unstake: "and it usually takes 48~72 hours to unstake",
      unstaked_ready_to_claimed: "Your unstaked fund is ready to be claimed",
      claim_unstaked: "Claim Unstaked",
      stake_more: "Stake More",
      claim_reward: "Claim Reward",
      provider: "Provider",
      liquid_unstake_fee: "Liquid Unstake Fee",
      unlock_period: "Unlock Period",
      total_near_staked: "Total NEAR Staked",
      balance: "Balance",
      value_in_near: "Value in NEAR",
      and_it_usually_takes: "and it usually takes",
      to_unstake: "to unstake",
      delayed_unstake: "Delayed Unstake",
    },
    walletSend: {
      heading_send: "Send",
      input_heading_sendTo: "Send To",
      button_useMax: "Use Max",
      input_heading_selectAsset: "Select Asset",
      text_accountIdInfo:
        "The account ID must include a Top Level Account such as .near or contain exactly 64 characters.",
      input_placeHolder_sendTo: "Send to account ID",
      tooltip_addressBook: "Address Book",
      use_max: "Use Max",
      available: "Available",
      no_account_provide: "No account provide",
      account_id_note_1: "The account ID must be valid such as",
      account_id_note_2: "or contain exactly 64 characters.",
      account_id_note_3:
        "The account ID must be either a valid NEAR address (e.g., .near or implicit address) or a valid EVM address.",
      account_check_errors: {
        invalid_account: "Invalid account",
        invalid_account_format: "Invalid account format",
        invalid_account_length_long: "Invalid account length (too long)",
        invalid_account_length_short: "Invalid account length (too short)",
      },
      error_empty_amount: "Please fill in the amount field",
      warning_address_non_standard:
        "The address you are sending is non standard {network} suffix ({accountSuffix})",
      sending_bridged_token_alert:
        "This is a bridged token. Do not send it to exchanges like Binance.",
      account_no_exists_warning: "Account does not exist yet",
      named_account_no_exists_warning:
        "Sending to a named account that does not exist yet will likely fail",
      account_no_exists_warning_deposit:
        "Account does not exist yet- it will be created automatically on this deposit",
      sending: "Sending",
      to: "to",
      account_exists: "Account exists",
      send: "Send",
      confirm_send: "Confirm Send",
      finish: "Finish",
      txID: "Transaction ID",
      sendFtSuccess: "Send FT successful",
      sendSuccess: "Send successful",
      mode_not_support: "mode not supported",
      receiver_balance: "The account currently has {balance} {symbol}",
      receiver_balance_fail: "Unable to get balance",
      address_display_is_own_warning: "This is an external wallet address to this app",
      input_error_ft: "{label} are not transferable",
    },
    importWallet: {
      heading_confirmAccount: "Import Your Account",
      blurb_confirmAccount: "Pick the wallet you'd like to import",
      heading_inputPhraseSection: "Secret Phrase",
      blurb_inputPhraseSection: "Provide the wallet's secret recovery phrase to import the wallet",
      heading_chooseInputType: "How would you like to import your wallet?",
      // blurb_chooseInputType: "How would you like to import your wallet?",
      heading_passwordSection: "Import Wallet",
      heading_inputPrivateKeySection: "Private Key",
      blurb_inputPrivateKeySection: "Provide the wallet's private key to import the wallet",
      blurb_passwordSection: "Wallet password is required to import a wallet",
      toast_title_noAccountFound: "No Account Found",
      toast_text_noAccountFound: "Couldn't find any account linked to that secret recovery phrase",
      toast_title_unknownError: "Search Failed",
      toast_text_unknownError:
        "An API error occurred trying to check for accounts. Double check the phrase and try again.",
      toast_text_invalidKey: "Invalid key. Please check your input and try again.",
      a_12_word_secret: "A 12 word secret phrase",
      secret_phrase: "Secret Phrase",
      private_key: "Private Key",
      private_key_desc: "An account private key",
      hardware: "Ledger",
      hardware_desc: "A hardware wallet",
      words_12: "12 words",
      private_crypto_key: "Private crypto key",
      find_my_account: "Find my account",
      account: "Account",
      already_imported: "Already imported",
      text_approve_ledger: "Approve on Ledger Device",
      dont_see_wallet: "Can't find your account?",
      manual_import_here: "Import it manually.",
    },
    manualImport: {
      manual_import_account: "Manual Import Account",
      import: "Import Account",
      insert_your_account_id: "Insert your account id here to import your account",
      incorrect_account_id:
        "Invalid account id format, needs to be belongs to a root account such as .near, .tg or .sweat",
      account_not_exist_or_not_match: "Account does not exist or access key doesn't match",
      account_info_network_error:
        "Something went wrong when getting account info. Please try again later",
      account_found_and_import: "Account found, you can import the account now",
      close: "Close",
    },
    importWalletHardware: {
      title: "Hardware Wallet",
      subtitle: "Specify the HD path to import associated accounts.",
      toast_title_noAccountFound: "No Account Found",
      toast_text_noAccountFound: "No account found for the specified HD path.",
    },
    createWalletHardware: {
      title: "Hardware Wallet",
      subtitle: "Specify the HD path to create a new wallet.",
      button_confirm: "Create New Wallet",
      toast_title_noAccountFound: "Account exist",
      toast_text_noAccountFound: "An account for the given HD path already exists.",
    },
    signTx: {
      sign_message_request_title: "Sign Message",
      sign_message_request_desc: "Only sign messages for sites you trust",
      sign_message_request_submit_text: "Sign Message",
      sign_message_with_account: "Sign message with account",
      message_to_be_signed: "Message to be signed",
      close_sign_message_full_details: "Close Message Text",
      view_full_message: "View Full Message",
      potentially_do_some_kind_of_action: "Potentially execute a verified action on their app",
      does_not_execute_on_blockchain: "Executing anything on the blockchain",
      receiving_from_dapp: "Receiving details from Dapp",
      couldnt_parse_arg_login: "Couldn't parse the correct arguments for login",
      couldnt_parse_arg_logout: "Couldn't parse the correct arguments for logout",
      connect_request: "Connect Request",
      connect_with_acc: "Connect With Account",
      this_app_would_like_to: "This app would like to",
      know_your_add: "Know your wallet address",
      know_your_balance: "Know the balance of your account",
      network_fee_placeholder:
        "The application will be given permission to spend up to 0.25 NEAR towards network fees (gas) incurred during use.",
      network_fee_allowance: "Network Fee Allowance",
      something_went_wrong: "Something went wrong",
      create_import_wallet: "Create or Import New Wallet",
      contract: "Contract",
      connect: "Connect",
      cancel: "Cancel",
      already_submitted_part_1: "DApp request has already been submitted.",
      already_submitted_part_2: "Return to the DApp to see the result and take further action.",
      finished_success_part_1: "Transaction signed and submitted, you may close this window.",
      finished_error_part_1: "Something went wrong while completing the request:",
      finished_error_part_2: "Return the the DApp to retry the action.",
      close_wallet: "Close Wallet",
      request_logout_could_not_found:
        "The account requested for logout could not be found in the wallet",
      request_logout_sign_out_anyway: "Sign out of DApp anyway",
      sign_out_request: "Sign Out Request",
      sign_out_desc: "You have requested to be signed out of a contract",
      wallet: "Wallet",
      logout: "Logout",
      couldnt_parse_arg_verify: "Couldn't parse the correct arguments for authentication",
      request_authentication_not_found:
        "The account requested for authentication could not be found ",
      verification_request: "Verification Request",
      verification_request_desc: "Only verify your identity on sites that you trust",
      verify_account: "Verify with account",
      select_account: "Select an account",
      know_your_chosen_wallet_add: "Known your chosen wallet address",
      verify_own_wallet_add: "Verify that you own this wallet address",
      does_not_allow: "This does not allow",
      calling_method_on_behalf: "Calling methods or signing transactions on your behalf",
      verify: "Verify",
      estimated_changes: "Estimated Changes",
      send: "Send",
      you_sending_asset: "You're sending this asset",
      you_sending_assets: "You're sending these assets",
      couldnt_parse_arg_tx: "Couldn't parse the correct arguments for signing the transaction",
      approve_transactions: "Approve Transactions",
      approve_transaction: "Approve Transaction",
      transaction: "Transaction",
      approve: "Approve",
      close_details: "Close Details",
      view_transaction_details: "View Transaction Details",
      transaction_details: "Transaction Details",
      fees_tooltips: 'Also known as "gas"- a network processing fee for this transaction',
      fees_assurance:
        "Actual fees are often 90-95% lower than estimated and the remaining amount will be refunded",
      fees: "Fees",
      with_deposit: "With Deposit",
      from: "From",
      to: "To",
    },
    explore: {
      text_explore: "Explore",
      text_challenges: "Challenges",
      text_missions: "Missions",
      text_gear_staking: "$GEAR",
      text_rewards: "Rewards",
      trending_projects: "Trending Projects",
      defi: " DeFi",
      nfts: " NFTs",
      near_ecosystem: " Near Ecosystem",
      hide: "hide",
      show: "show",
      tonic_desc: "High-performance, fully decentralized trading platform on NEAR.",
      spin_desc: "First on-chain order book DEX on NEAR with a CEX like experience.",
      burrow_desc: "Supply and borrow interest-bearing assets on NEAR Protocol.",
      perk_desc: "Liquidity aggregator for NEAR with a full range of tokens & routing.",
      pembrock_desc: "First leveraged yield farming platform on NEAR.",
      meta_yield_desc: "A fundraising platform that allows any $NEAR holder to support projects.",
      paras_desc: "All-in-one social marketplace for creators and collectors",
      tradeport_desc: "Cross-chain trading platform aggregating NFTs from marketplaces",
      antisocial_desc:
        "Our own $GEAR is a legal tender on raffles by Antisocial Labs. Step 1: Swap $GEAR via Meteor or earn it with Tinkers. Step 2: Win NFTs ",
      near_social_desc: "A social data protocol for NEAR",
      near_crash_desc: "Try and cash out before the crash!",
      challenge: {
        btn_view_details: "View Details",
        btn_view_winners: "View Winners",
        btn_accept_challenge: "Accept Challenge",
        btn_challenge_accepted: "Challenge Accepted",
        status: {
          [EChallengeStatus.COMING_SOON]: "Coming Soon",
          [EChallengeStatus.ACTIVE]: "Active",
          [EChallengeStatus.ENDED_WITHOUT_WINNERS]: "Ended",
          [EChallengeStatus.ENDED_WITH_WINNERS]: "Ended",
          [EChallengeStatus.WINNERS_TO_BE_ANNOUNCED]: "Winners To Be Announced",
        },
      },
      mission: {
        label_my_profile: "My Profile",
        label_level: "Level",
        label_points_earned: "Points Earned",
        label_global_ranking: "Global Ranking",
        text_mission_unlock: "missions completed towards next level",
        label_daily_tasks: "Daily Missions",
        label_daily_task: "Daily Mission",
        label_points_reward: "points in reward",
        label_earn_more_side_quest: "Side Quests",
        label_completed: "Completed",
        label_earned: "earned",
        button_start_now: "Start Now",
        button_completed: "Completed",
        toast_mission_sign_up_success: "Now you can start doing challenges and claim rewards!",
        user_consent: {
          label_title: "Join Meteor Missions!",
          label_description:
            "Discover missions, collect points, and unlock rewards worth over $2500!",
          button_accept: "Okay, Let's Go!",
          text_note:
            "Thanks for joining Meteor Missions! Sit tight while we set things up for you (+-15sec).",
        },
        no_daily_task: "All set for today! Return tomorrow to continue your daily streak",
        no_side_quest: "You've cleared all the quests! Stay tuned for more missions coming soon.",
      },
      reward: {
        label_collected_points: "Available Points",
        label_redeem: "Redeem",
        label_redeem_history: "Redeem History",
        label_claim_reward: "Claim Reward",
        label_left: "left",
        button_redeem: "Redeem",
        button_harvest: "Harvest",
        button_claim: "Claim",
        placeholder_for_redeem_code: "Redeem code",
        code_required_to_claim: "Enter code from provider for reward",
        no_redeem_title: "No Available Rewards",
        no_redeem_description: "There are no offers ready for redemption at the moment.",
        no_claim_reward_title: "No Rewards Available",
        no_claim_reward_description:
          "Keep participating in missions to earn points and redeem them for rewards!",
      },
    },
    meteorCard: {
      home: {
        subtitle:
          "Join the Meteor community by signing up early for our exclusive DeFi Mastercard. Be among the first to enjoy seamless crypto spending with our upcoming card.",
        early_access_end: "Early Access Perks offer ends in",
        view_perks: "View Perks",
        apply_now: "Apply Now",
      },
      perkModal: {
        title1: "Early Access",
        title2: "Perks",
        item_title1: "Fully Refundable Deposit",
        item_subtitle1: "Reserve your spot now for just $5 USDC—fully refundable, no risk!",
        item_title2: "Promotional Fee",
        item_subtitle2:
          "Early Access Offer: Lock in your spot for just $5 USDC! (Valued at $19.99)",
        item_title3: "Exclusive Reward",
        item_subtitle3:
          "Earn an Expert Contract in Harvest Moon and boost your progress to qualify for Meteor airdrops.",
      },
      signup: {
        title: "Sign Up Now",
        subtitle: "Complete the form below to get early access:",
        email: "Email Address",
        country: "Country",
        country_placeholder: "Select Country",
        estimate_usage: "How often would you use your Meteor Mastercard monthly?",
        early_access_perks: "Early Access Perks",
        button_proceed: "Proceed with Payment",
        end_in: "End in",
        error_registered: "You're already registered",
        error_signup_status_not_ready:
          "The signup request is currently not ready (status: {status}). Please try again later",
      },
      myApplication: {
        application_applied: "Application Applied",
        title: "My Application",
        subtitle: "We will reach out to you soon with launch details.",
        wallet_id: "Wallet ID",
        email: "Email Address",
        country: "country",
        country_placeholder: "Select Country",
        cancel: "Cancel Application",
        update: "Update",
        error_cancel_status_not_ready:
          "The cancel request is currently not ready (status: {status}). Please try again in a few minutes",
      },
      insufficientBalance: {
        title: "Insufficient Balance",
        subtitle:
          "$5 Card deposit in USDC is required to activate your early access application. If you decide not to take the card, you can cancel within 7 days and get your deposit back.",
        back: "Back to Wallet",
        topup: "Topup USDC",
      },
      estimateUsageOption: {
        [EMeteorCardEstimateUsage.below_250]: "Light use (up to $250)",
        [EMeteorCardEstimateUsage.from_250_to_1000]: "Moderate use (up to $1000)",
        [EMeteorCardEstimateUsage.above_1000]: "Heavy use ($1000+)",
      },
    },
    appSettings: {
      heading_settings: "App Settings",
      button_language: "Language",
      button_addressBook: "Address Book",
      button_subtext_addressBook: "Commonly used addresses",
      button_autoLockTimer: "Auto-Lock Timer",
      button_subtext_autoLockTimer: "Auto-lock wallet timer duration",
      button_changePassword: "Change Password",
      button_removePasswordProtection: "Remove Password Protection",
      checkbox_removePasswordWarning: "Remove warning about insecure wallet",
      button_subtext_changePassword: "Change your unlock password",
      button_aboutMeteor: "About Meteor",
      button_subtext_aboutMeteor: "Our contact and community info",
      button_giveFeedback: "Report Issues or Give Feedback",
      button_subtext_giveFeedback: "Let us know what we can improve on",
      button_meteorCommunity: "Meteor Community",
      button_subtext_meteorCommunity: "Come and join us",
      sectionConnectedApp: {
        text_unlimitedAllowance: "Unlimited",
        text_deauthorize: "Deauthorize",
        text_gasFeeAllowance: "Gas Fee Allowance",
        text_allowedMethod: "Allowed Method",
        text_any: "Any",
      },
      sectionProfile: {
        update_profile_warning:
          "First time updating your profile will up to 0.04 NEAR as a storage deposit fee.",
        update_pfp_warning:
          "First time setting a PFP will attach up to 0.04 NEAR as a storage deposit fee.",
        pfp_updated: "PFP Updated.",
        profile_updated: "Profile Updated.",
        name: "Name",
        about: "About",
        pfp_tooltip: "PFP needs to be set on the NFT page",
        sync_near_social: "Use this profile across the NEAR ecosystem with Near Social.",
        sync_near_social_header: "Synchronize to NEAR Social",
        sync_near_social_desc:
          "First time synchronizing to NEAR Social will attach up to 0.04 NEAR as a storage deposit fee.",
        sync_now: "Sync Now",
        update: "Update",
        set_pfp: "Set PFP",
        account_synced: "Your account is already synced to NEAR Social",
        follower: "Follower",
      },
      sectionDeleteAccount: {
        text_warning: "Warning",
        text_delete_password:
          "Please make sure you have already backed up your recovery method or you might lose access to your account",
        text_action_desc: "This action will remove the following account from your wallet :",
        text_remove_account: "Remove from Meteor Wallet",
      },
      sectionChangePassword: {
        text_password_changed_success: "Password changed successfully",
        text_password_removed_success: "Password protection successfully removed",
        text_change_password_warning:
          "This will change your sign-in password for the entire wallet (all accounts)",
        text_finish: "Finish",
        text_change_password: "Change Password",
        text_create_password: "Create a new Password",
      },
      sectionCommunity: {
        text_thank_you: "Thank You for Choosing Meteor Wallet!",
        text_follow_twitter: "Follow Twitter",
        text_report_bug: "Report Issue",
        text_join_discord: "Join Discord",
        text_communityBlurb:
          "We'd love to have you as a member of our ever-growing community- and hear your thoughts about what we can do to improve.",
      },
      sectionAccessKey: {
        text_add_key: "Add New Access Key",
        text_edit_label: "Edit Label",
        text_revoke_access: "Revoke Access",
        text_revoke_access_key: "Revoke Access Key",
        text_remove_key_desc:
          "Are you sure you want to remove this access key from your Near Account?",
        text_cancel: "Cancel",
        text_remove_key: "Remove Key",
        text_primary_key: "Meteor Primary Key",
        text_hardware_key: "Hardware Key",
        text_hardware_ledger_key: "Ledger Key",
        text_hd_path: "HD Path",
        text_public_key: "Public Key",
        text_known_data: "Known data",
        text_private_key: "Private Key",
        text_secret_phrase: "Secret Phrase",
        text_unknown_to_meteor: "Unknown to Meteor",
        text_access_key_warning_msg:
          "Be sure that this access key is not linked to any recovery methods you still want to use! They will not  work anymore.",
        text_access_key: "Access Key",
        text_add_key_subtitle: "Generate or add an access key for this wallet",
        text_access_key_label: "Access Key Label",
        text_generate_new_key: "Generate New Key",
        text_generate_new_key_desc: "Generate a new seed phrase recovery key for this wallet",
        text_clear_label: "Clear Label",
      },
    },
    wallet: {
      max: "Max",
      heading_walletLocked: "Wallet Locked",
      button_unlockWallet: "Unlock Wallet",
      blurb_walletLocked: "This wallet is currently locked. Provide your password to unlock it.",
      toast_heading_passwordIncorrect: "Password was incorrect",
      toast_text_passwordIncorrect: "Failed to unlock the wallet",
      settings: {
        settings: "Settings",
        heading_settings: "Wallet Settings",
        input_heading_extractSecret: "View Secret Phrase",
        input_text_extractSecret: "Extract your wallet's secret phrase",
        input_heading_exportPrivateKey: "Export Private Key",
        input_heading_managePrivateKeys: "Manage Full Access Keys",
        input_text_managePrivateKeys: "View, label and rotate your private keys",
        input_text_exportPrivateKey: "Export your wallet's private key",
        input_heading_walletLabel: "Wallet Label",
        input_text_walletLabel: "Enter a label for this wallet",
        menu_heading_profile: "Profile",
        menu_text_profile: "Manage your profile",
        menu_heading_connectedApps: "Connected Apps",
        menu_text_connectedApps: "Manage app access to your wallet",
        menu_heading_securityAndRecovery: "Security and Recovery",
        menu_text_securityAndRecovery: "Manage your wallet's secret phrase and private keys",
        menu_heading_changePassword: "Change Password",
        menu_text_changePassword: "Change the password used to unlock your wallet",
        menu_heading_RemoveWalletAccount: "Remove Account",
        menu_text_removeWalletAccount: "Remove this account from your wallet",
        common: {
          account_not_created_secret_note_1:
            "This account was not created or imported (using Secret Phrase) via Meteor Wallet, so no encrypted secret phrase is currently available",
          account_not_created_secret_note_2:
            "Rest assured, your original secret phrase should still work as a recovery method if you haven't removed it from your Near account",
          account_not_created_secret_note_3:
            "Functionality to rotate your secret phrase in Meteor Wallet is in the works!",
          enterPasswordBlurb: "Wallet password required",
          enterPasswordCreateWalletBlurb: "Wallet password required to add a new wallet",
        },
        exportPrivateKey: {
          text_subheadingWarning:
            "Be very careful where you store or share this key. Anyone who has access to it can take over this wallet account.",
          text_copiedToClipboard: "Private key copied",
        },
        manageAccessKeys: {
          input_text_accessKeyLabel: "Enter a label for this Access Key",
          button_updateLabel: "Update Label",
        },
      },
    },
    signIn: {
      welcome: "Welcome ",
      blurb: " The decentralized web awaits...",
      button_unlock: "Unlock",
      input_header_password: "Unlock with password",
      text_forgot_password: "Forgot password?",
      toast_heading_passwordIncorrect: "Password was incorrect",
      toast_text_passwordIncorrect: "Failed to sign into your profile",
    },
    addWallet: {
      blurb: "Choose how you'd like to set up your wallet",
      heading_meteorWallet: "Meteor Wallet",
      button_import_wallet: "Import Wallet",
      button_subtext_import_wallet: "Import your existing wallet using a 12 word seed phrase",
      button_create_new_wallet: "Create New Wallet",
      button_subtext_create_new_wallet: "This will create a new wallet and seed phrase",
      text_named_wallet: "Named Wallet",
      text_named_wallet_desc: "A customized name that you pick",
      text_unavailable: "UNAVAILABLE",
    },
    createNewWallet: {
      heading_newWallet: "New Wallet",
      please_insert_password: "Wallet password required to add a new wallet",
      p4_please_try_again: "Please try again",
      p4_unforunately_something_went_wrong:
        "Unfortunately, something went wrong and we are unable to fund your wallet creation. You can create an implicit wallet and fund the wallet creation at the moment.",
      heading_newWalletChoice: "The Choice is Yours",
      subheading_newWalletChoice: "What kind of wallet would you like to create?",
      requires_initial_balance:
        "Requires initial balance of 0.1 NEAR to open, funded from a previously connected wallet",
      random_64_character: "A random 64 character identifier",
      next: "Next",
      traditional_crypto_wallet: "Traditional Crypto Wallet",
      new_wallet: "New Wallet",
      available_near: "Available NEAR",
      available_fund: "Available for funding",
      initial_wallet_balance: "Initial Wallet Balance",
      initial_wallet_balance_named_wallet:
        "At least 0.1 NEAR is required as an initial balance when creating a custom named wallet",
      select_funding_wallet: "Select Funding Wallet",
      no_account_selected: "No Account Selected",
      account_not_exist: "Account does not exist",
      not_enough_funds: "Not enough funds in account",
      initial_funding_amount: "Initial Funding Amount",
      account_identity: "Your Account Identity",
      account_identity_desc: "What would you like your custom Near wallet address to be?",
      is_available: "is available",
      username_is_available: "Congratulation. Your username is valid",
      account_already_exists: "Account name already exists",
      account_not_compatible: "Account name is not compatible",
      account_can_contain: "Your account ID can contain any of the following",
      lowercase_characters: "Lowercase characters",
      digits: "Digits",
      character_requirement: "Characters (_-) can be used as separators",
      account_cannot_contain: "Your account ID CANNOT contain",
      character_dot: 'Characters "@" or "."',
      more_than_64_characters: "More than 64 characters (including .",
      fewer_than_2_characters: "Fewer than 2 characters",
      explore_web3: "Explore Web3",
      step_into_future: "Step into the Future with Meteor",
      generateNew: "Generate New",
      claimIdentity: "Claim your identity",
      button_create_with_ledger: "Create with ledger",
      captcha_error_message:
        "Captcha verification failed. Please try again. If the issue persists and you suspect this to be a technical error, kindly report it to the Meteor Wallet Support Team for assistance.",
      exceed_request_limit:
        "Request limit exceeded. Please wait before retrying. If this seems incorrect, contact Meteor Wallet Support.",
      Section_P1_PickWalletName: {
        use_ledger_device: "Use ledger device",
      },
      extensionCreate: {
        title: "Create Wallet Disabled",
        description:
          "Account creation is temporarily disabled on the extension. Please create your wallet in the web wallet and then import it into the extension.",
        button_import: "Import an existing wallet",
        button_open_web_wallet: "Open Wallet on Web",
      },
    },
    gettingStarted: {
      button_getStarted: "Get Started",
      welcomeToMeteor: "Welcome to Meteor",
      blurb: "Securely store and stake your NEAR tokens and compatible assets with Meteor.",
    },
    createPassword: {
      buttons: {
        continue: "Continue",
      },
      agreeToTerms: (link) => (
        <>
          I agree to the{" "}
          <Link colorScheme={"brandPrimary"} fontWeight={600} href={link} isExternal={true}>
            Terms of Service
          </Link>
        </>
      ),
      heading: "Create a Password",
      blurb: "You will use this to unlock your wallet",
      placeholders: {
        enterPassword: "Enter Password",
        confirmPassword: "Confirm Password",
      },
      validation: {
        atLeast8: "At least 8 characters",
        doNotMatch: "Passwords do not match",
        strengthTooWeak: "Too Weak",
        strengthWeak: "Weak",
        strengthMedium: "Medium",
        strengthStrong: "Strong",
      },
    },
    recoveryPhrase: {
      heading: "Secret Recovery Phrase",
      blurb:
        "Save these 12 words to a password manager, or write them down and store in a secure place. Do not share them with anyone.",
      confirmSavedPhrase: "I saved my Secret Recovery Phrase",
      buttons: {
        continue: "Continue",
        copy: "Copy",
        generateNew: "Generate New",
      },
      toasts: {
        copiedToClipboard: "Copied to clipboard",
      },
    },
    seedPhraseConfirmation: {
      buttons: {
        confirm: "Confirm",
        back: "Back",
      },
      wordForFirst: "First",
      wordForLast: "Last",
      heading: "You saved it, right?",
      blurb:
        "Verify that you saved your seed phrase by clicking on the first (1st) and last (12th) word.",
      confirmationWrongHeading: "Recovery Phrase Words Incorrect",
      confirmationWrongBlurb:
        "Make sure you have saved this phrase in a secure place, and can recall it if needed",
      profilePasswordMismatchHeading: "Password incorrect",
      profilePasswordMismatchBlurb: "The current profile password does not match the one provided",
    },
    accountSuccess: {
      heading: "You're all done!",
      blurb: "Follow along with product updates or reach out if you have any questions",
      followUsOnTwitter: "Follow us on Twitter",
      joinDiscord: "Get help on Discord",
      button_finish: "Finish",
      button_redirect: "Visit Redirection URL",
      toast_title: "Create Account Success",
      toast_title_with_redirect:
        "Created account successfully, redirecting you back to the app shortly",
      toast_redirect_whitelisted_failed: "This redirect link hasn't been approved for redirection",
    },
    transactions: {
      heading_history: "History",
      badgeStatus: {
        [ETransactionBadgeStatus.SUCCEED]: "SUCCEED",
        [ETransactionBadgeStatus.FAILED]: "FAILED",
        [ETransactionBadgeStatus.LOADING]: "LOADING",
        [ETransactionBadgeStatus.PROCESSING]: "PROCESSING",
        [ETransactionBadgeStatus.WAITING]: "WAITING",
        [ETransactionBadgeStatus.UNKNOWN]: "UNKNOWN",
      },
      actionTitle: {
        [ENearIndexer_ActionType.CREATE_ACCOUNT]: "Create Account",
        [ENearIndexer_ActionType.DELETE_ACCOUNT]: "Delete Account",
        [ENearIndexer_ActionType.DELETE_KEY]: "Delete Key",
        [ENearIndexer_ActionType.DEPLOY_CONTRACT]: "Deploy Contract",
        [ENearIndexer_ActionType.FUNCTION_CALL]: "Function Call",
        [ENearIndexer_ActionType.TRANSFER]: "Transfer",
      },
      common: {
        call: "CALL",
        status: {
          success: "SUCCESS",
          failed: "FAILED",
          unknown: "UNKNOWN",
        },
      },
      loadingBottom: {
        more: "Load More",
        loading: "Loading",
        end: "Nothing Here",
        endTransaction90Days: "No More Transactions on last 90 days",
      },
      typeName: {
        receive: "Received",
        send: "Sent",
        self: "Self Called",
        unknown: "Others",
      },
      direction: {
        from: "From",
        to: "To",
        with: "With",
      },

      accessKey: {
        addKey: "A {key} added.",
        deleteKey: "A {key} deleted.",
        key: "Key",
        permissionTypes: {
          [ENearIndexer_AccessKeyPermission.FULL_ACCESS]: "Full Access Key",
          [ENearIndexer_AccessKeyPermission.FUNCTION_CALL]: "Function Call Key",
        },
        publicKey: "Public Key",
        receiverId: "Authorized Contract",
        allowMethodNames: "Allowed Methods",
        emptyMethodNames: "Any Method",
        allowance: "Allowance Amounts",
      },

      account: {
        createTitle: "Create Account",
        createdMessage: "Created account {account_id}.",
        deletedMessage: "Deleted account {account_id}.",
        publicKey: "Public Key",
        byId: "By Account",
        deposit: "Deposit",
        beneficiaryId: "Balance Transfer To",
      },

      deploy: {
        code: "code",
        message: "You have deployed {code} to {contract}.",
      },

      functionCall: {
        brief: "Called {method_name} on {receiver}",
        details: "Called method {method_name} on contract {receiver}.",
        cost: "Gas Limit:",
        deposit: "Deposit:",
        args: "Args:",
      },

      details: {
        transactionHash: "Transaction Hash",
        includedInBlockHash: "Block Hash",
        includedInChunkHash: "Chunk Hash",
        blockTimestamp: "Sign Time",
        signerAccountId: "Signer",
        signerPublicKey: "Public Key",
        receiverAccountId: "Receiver",
        convertedIntoReceiptId: "Receipt",
        receiptConversionBurnt: "Gas & Token Burnt",
        moreInformation: "More Infomation",
        lessInformation: "Less Infomation",
        action: "Actions",
        viewExplorer: "View On Explorer",
      },

      custom: {
        ftSwap: {
          title: "FT Swap",
          near: "Near Swap",
        },
        nftTrade: {
          direction: {
            [ENftOfferDir.TO_YOU]: "to You",
            [ENftOfferDir.FROM_YOU]: "from You",
          },
        },
      },
    },
    nftCollection: {
      heading_nft: "My Collectibles",
      nothing: "You have no NFTs yet.",
      total_nfts: "Total NFTs",
      total_floor_price: "Total Floor Price",
      total_floor: "Total Floor",
      floor_price: "Floor Price",
      contract: "Contract",
    },
    nftDetails: {
      button_send: "Send",
      button_explorer: "Explorer",
      button_view: "View",
      heading_description: "Description",
      heading_properties: "Properties",
    },
    voterModal: {
      title: "Make Your Wallet Count: Vote in NDC Elections. Shape NEAR's Future!",
      description:
        "The NEAR Digital Collective (NDC) is all about giving everyone a say in the NEAR network's future. It's about transparency, collective decisions, and self-determination.",
      description2:
        "Our first elections are coming up, so register as a voter before September 1, 23:59 UTC via I-AM-HUMAN. Make your voice count!",
      button_confirm: "Register as a voter",
      button_cancel: "Cancel",
      checkbox_dont_show: "Do not show again",
    },
    execution: {
      step: "Step",
      of: "of",
      transaction_hash: "Transaction Hash",
      button_finish: "Finish",
      title: "Executing Transaction",
      checking: "Checking",
      transaction_execution_status: {
        [ETransactionExecutionStatus.awaiting_signer]: "Awaiting Signer",
        [ETransactionExecutionStatus.failed]: "Failed",
        [ETransactionExecutionStatus.pending_signing]: "Pending Signing",
        [ETransactionExecutionStatus.publishing]: "Publishing",
        [ETransactionExecutionStatus.signed]: "Signed",
        [ETransactionExecutionStatus.success]: "Success",
      },
    },
    ledger: {
      title: "Ledger Device",
      connected: "Connected",
      button_try_again: "Try Again",
      ledger_device_alert: {
        [ELedgerConnectionStatus.connected]: {
          [ELedgerConnectedStatus.ready]: "",
          [ELedgerConnectedStatus.error]: "Error.",
          [ELedgerConnectedStatus.not_unlocked]:
            "Your Ledger device is locked. Please unlock to continue.",
          [ELedgerConnectedStatus.app_not_opened]: "Open the NEAR app on your Ledger to proceed.",
        },
        [ELedgerConnectionStatus.disconnected]: {
          [ELedgerDisconnectedStatus.awaiting_connection]: "Connect to your Ledger device.",
          [ELedgerDisconnectedStatus.browser_refresh_needed]: "Browser need refresh.",
          [ELedgerDisconnectedStatus.not_supported]: "Ledger not supported.",
          [ELedgerDisconnectedStatus.user_cancelled]:
            "Connection denied. Please try accepting the connection again.",
          [ELedgerDisconnectedStatus.error]: "Error.",
        },
        need_version_update:
          "The Near app version on your Ledger device is {current}. Please update to {minimum} or later. Not updating might cause transactions to fail.",
      },
      functionality_not_supported: "This function is not yet supported on Ledger devices.",
    },
  },
};
