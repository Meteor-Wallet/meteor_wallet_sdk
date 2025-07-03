import { z } from "zod";
import {
  ZMeteorEventMeta_AppHidden,
  ZMeteorEventMeta_Initialize,
  ZMeteorEventMeta_PageView,
  ZMeteorEventMeta_UserAction_ChangeLanguage,
  ZMeteorEventMeta_UserAction_ChangeNetwork,
  ZMeteorEventMeta_UserAction_ChangeTheme,
  ZMeteorEventMeta_UserAction_Voter_Registration_Attempt,
  ZMeteorEventMeta_UserAction_Voter_Registration_Onboarded,
  ZMeteorEventMeta_WalletAction_CreateWallet,
  ZMeteorEventMeta_WalletAction_HmTimeTravel,
  ZMeteorEventMeta_WalletAction_ImportWallet,
  ZMeteorEventMeta_WalletAction_LiquidDelayedUnstake,
  ZMeteorEventMeta_WalletAction_LiquidStake,
  ZMeteorEventMeta_WalletAction_LiquidUnstake,
  ZMeteorEventMeta_WalletAction_NormalStake,
  ZMeteorEventMeta_WalletAction_NormalUnstake,
  ZMeteorEventMeta_WalletAction_SendFtToken,
  ZMeteorEventMeta_WalletAction_SendNearToken,
  ZMeteorEventMeta_WalletAction_SendNft,
  ZMeteorEventMeta_WalletAction_SignInToDappFail,
  ZMeteorEventMeta_WalletAction_SignInToDappOk,
  ZMeteorEventMeta_WalletAction_SignInToDappRequest,
  ZMeteorEventMeta_WalletAction_SignOutOfDappFail,
  ZMeteorEventMeta_WalletAction_SignOutOfDappOk,
  ZMeteorEventMeta_WalletAction_SignOutOfDappRequest,
  ZMeteorEventMeta_WalletAction_SignTransactionFail,
  ZMeteorEventMeta_WalletAction_SignTransactionOk,
  ZMeteorEventMeta_WalletAction_SignTransactionRequest,
  ZMeteorEventMeta_WalletAction_Swap,
  ZMeteorEventObject,
} from "../meteor_analytics_data_models";

export type TMeteorEventObject = z.infer<typeof ZMeteorEventObject>;
export type TMeteorEventMeta_Initialize = z.infer<typeof ZMeteorEventMeta_Initialize>;
export type TMeteorEventMeta_PageView = z.infer<typeof ZMeteorEventMeta_PageView>;
export type TMeteorEventMeta_AppHidden = z.infer<typeof ZMeteorEventMeta_AppHidden>;
export type TMeteorEventMeta_UserAction_ChangeTheme = z.infer<
  typeof ZMeteorEventMeta_UserAction_ChangeTheme
>;
export type TMeteorEventMeta_UserAction_ChangeNetwork = z.infer<
  typeof ZMeteorEventMeta_UserAction_ChangeNetwork
>;
export type TMeteorEventMeta_UserAction_ChangeLanguage = z.infer<
  typeof ZMeteorEventMeta_UserAction_ChangeLanguage
>;
export type TMeteorEventMeta_UserAction_Voter_Registration_Attempt = z.infer<
  typeof ZMeteorEventMeta_UserAction_Voter_Registration_Attempt
>;
export type TMeteorEventMeta_UserAction_Voter_Registration_Onboarded = z.infer<
  typeof ZMeteorEventMeta_UserAction_Voter_Registration_Onboarded
>;

// WALLET BASIC ACTIONS
export type TMeteorEventMeta_WalletAction_SendFtToken = z.infer<
  typeof ZMeteorEventMeta_WalletAction_SendFtToken
>;
export type TMeteorEventMeta_WalletAction_SendNearToken = z.infer<
  typeof ZMeteorEventMeta_WalletAction_SendNearToken
>;
export type TMeteorEventMeta_WalletAction_SendNft = z.infer<
  typeof ZMeteorEventMeta_WalletAction_SendNft
>;
export type TMeteorEventMeta_WalletAction_Swap = z.infer<typeof ZMeteorEventMeta_WalletAction_Swap>;

// STAKING
export type TMeteorEventMeta_WalletAction_NormalStake = z.infer<
  typeof ZMeteorEventMeta_WalletAction_NormalStake
>;

export type TMeteorEventMeta_WalletAction_NormalUnstake = z.infer<
  typeof ZMeteorEventMeta_WalletAction_NormalUnstake
>;

export type TMeteorEventMeta_WalletAction_LiquidStake = z.infer<
  typeof ZMeteorEventMeta_WalletAction_LiquidStake
>;

export type TMeteorEventMeta_WalletAction_LiquidUnstake = z.infer<
  typeof ZMeteorEventMeta_WalletAction_LiquidUnstake
>;

export type TMeteorEventMeta_WalletAction_LiquidDelayedUnstake = z.infer<
  typeof ZMeteorEventMeta_WalletAction_LiquidDelayedUnstake
>;

// WALLET MANAGEMENT
export type TMeteorEventMeta_WalletAction_CreateWallet = z.infer<
  typeof ZMeteorEventMeta_WalletAction_CreateWallet
>;
export type TMeteorEventMeta_WalletAction_ImportWallet = z.infer<
  typeof ZMeteorEventMeta_WalletAction_ImportWallet
>;

// TRANSACTIONS
export type TMeteorEventMeta_WalletAction_SignTransactionRequest = z.infer<
  typeof ZMeteorEventMeta_WalletAction_SignTransactionRequest
>;
export type TMeteorEventMeta_WalletAction_SignTransactionOk = z.infer<
  typeof ZMeteorEventMeta_WalletAction_SignTransactionOk
>;
export type TMeteorEventMeta_WalletAction_SignTransactionFail = z.infer<
  typeof ZMeteorEventMeta_WalletAction_SignTransactionFail
>;

export type TMeteorEventMeta_WalletAction_SignInToDappOk = z.infer<
  typeof ZMeteorEventMeta_WalletAction_SignInToDappOk
>;
export type TMeteorEventMeta_WalletAction_SignInToDappRequest = z.infer<
  typeof ZMeteorEventMeta_WalletAction_SignInToDappRequest
>;
export type TMeteorEventMeta_WalletAction_SignInToDappFail = z.infer<
  typeof ZMeteorEventMeta_WalletAction_SignInToDappFail
>;

export type TMeteorEventMeta_WalletAction_SignOutOfDappRequest = z.infer<
  typeof ZMeteorEventMeta_WalletAction_SignOutOfDappRequest
>;
export type TMeteorEventMeta_WalletAction_SignOutOfDappOk = z.infer<
  typeof ZMeteorEventMeta_WalletAction_SignOutOfDappOk
>;
export type TMeteorEventMeta_WalletAction_SignOutOfDappFail = z.infer<
  typeof ZMeteorEventMeta_WalletAction_SignOutOfDappFail
>;
export type TMeteorEventMeta_WalletAction_HmTimeTravel = z.infer<
  typeof ZMeteorEventMeta_WalletAction_HmTimeTravel
>;

export type TMeteorEventMeta_AppAction =
  | TMeteorEventMeta_Initialize
  | TMeteorEventMeta_PageView
  | TMeteorEventMeta_AppHidden;

export type TMeteorEventMeta_UserAction =
  | TMeteorEventMeta_UserAction_ChangeNetwork
  | TMeteorEventMeta_UserAction_ChangeTheme
  | TMeteorEventMeta_UserAction_ChangeLanguage
  | TMeteorEventMeta_UserAction_Voter_Registration_Attempt
  | TMeteorEventMeta_UserAction_Voter_Registration_Onboarded;

export type TMeteorEventMeta_WalletAction =
  | TMeteorEventMeta_WalletAction_SendFtToken
  | TMeteorEventMeta_WalletAction_SendNearToken
  | TMeteorEventMeta_WalletAction_SendNft
  | TMeteorEventMeta_WalletAction_Swap
  | TMeteorEventMeta_WalletAction_NormalStake
  | TMeteorEventMeta_WalletAction_NormalUnstake
  | TMeteorEventMeta_WalletAction_LiquidStake
  | TMeteorEventMeta_WalletAction_LiquidUnstake
  | TMeteorEventMeta_WalletAction_LiquidDelayedUnstake
  | TMeteorEventMeta_WalletAction_CreateWallet
  | TMeteorEventMeta_WalletAction_ImportWallet
  | TMeteorEventMeta_WalletAction_SignTransactionRequest
  | TMeteorEventMeta_WalletAction_SignTransactionOk
  | TMeteorEventMeta_WalletAction_SignTransactionFail
  | TMeteorEventMeta_WalletAction_SignInToDappRequest
  | TMeteorEventMeta_WalletAction_SignInToDappOk
  | TMeteorEventMeta_WalletAction_SignInToDappFail
  | TMeteorEventMeta_WalletAction_SignOutOfDappRequest
  | TMeteorEventMeta_WalletAction_SignOutOfDappOk
  | TMeteorEventMeta_WalletAction_SignOutOfDappFail
  | TMeteorEventMeta_WalletAction_HmTimeTravel;

export type TMeteorEventMeta_All =
  | TMeteorEventMeta_AppAction
  | TMeteorEventMeta_UserAction
  | TMeteorEventMeta_WalletAction;
