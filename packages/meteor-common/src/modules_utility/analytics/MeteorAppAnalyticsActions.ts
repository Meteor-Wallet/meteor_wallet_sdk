import type { Location } from "react-router";
import { AppStore } from "../../modules_app_core/state/app_store/AppStore";
import { EThemeMode } from "../../modules_app_core/theme/ThemeStatic";
import { anal } from "./MeteorAnalytics";
import {
  EMeteorAnalytics_SubType_UserAction,
  EMeteorAnalytics_SubType_WalletAction,
} from "./meteor_analytics_enums";
import {
  TMeteorEventMeta_UserAction_ChangeLanguage,
  TMeteorEventMeta_UserAction_ChangeNetwork,
  TMeteorEventMeta_UserAction_ChangeTheme,
  TMeteorEventMeta_UserAction_Voter_Registration_Attempt,
  TMeteorEventMeta_UserAction_Voter_Registration_Onboarded,
  TMeteorEventMeta_WalletAction_CreateWallet,
  TMeteorEventMeta_WalletAction_HmTimeTravel,
  TMeteorEventMeta_WalletAction_ImportWallet,
  TMeteorEventMeta_WalletAction_LiquidDelayedUnstake,
  TMeteorEventMeta_WalletAction_LiquidStake,
  TMeteorEventMeta_WalletAction_LiquidUnstake,
  TMeteorEventMeta_WalletAction_NormalStake,
  TMeteorEventMeta_WalletAction_NormalUnstake,
  TMeteorEventMeta_WalletAction_SendFtToken,
  TMeteorEventMeta_WalletAction_SendNearToken,
  TMeteorEventMeta_WalletAction_SendNft,
  TMeteorEventMeta_WalletAction_SignInToDappFail,
  TMeteorEventMeta_WalletAction_SignInToDappOk,
  TMeteorEventMeta_WalletAction_SignInToDappRequest,
  TMeteorEventMeta_WalletAction_SignOutOfDappFail,
  TMeteorEventMeta_WalletAction_SignOutOfDappOk,
  TMeteorEventMeta_WalletAction_SignOutOfDappRequest,
  TMeteorEventMeta_WalletAction_SignTransactionFail,
  TMeteorEventMeta_WalletAction_SignTransactionOk,
  TMeteorEventMeta_WalletAction_SignTransactionRequest,
  TMeteorEventMeta_WalletAction_Swap,
} from "./types/meteor_analytics_app_types";

function sendPageView({ pathname, search }: Location) {
  const { selectedAccountId, allAccounts, selectedNetwork } = AppStore.getRawState();
  const account = allAccounts.find((a) => a.id === selectedAccountId);
  const hashId = account?.hashId;
  const accountId = account?.id;
  const nearNetwork = account?.network ?? selectedNetwork;

  anal()
    .pageView({
      path: pathname,
      queryString: search,
      wHash: hashId,
      wId: accountId,
      nearNetwork,
    })
    .flush();
}

function userAction_unlock() {
  return anal().userAction(EMeteorAnalytics_SubType_UserAction.unlock);
}

function userAction_changeTheme(meta: TMeteorEventMeta_UserAction_ChangeTheme) {
  return anal().userAction(EMeteorAnalytics_SubType_UserAction.change_theme, meta);
}

function userAction_changeLanguage(meta: TMeteorEventMeta_UserAction_ChangeLanguage) {
  return anal().userAction(EMeteorAnalytics_SubType_UserAction.change_language, meta);
}

function userAction_changeNetwork(meta: TMeteorEventMeta_UserAction_ChangeNetwork) {
  return anal().userAction(EMeteorAnalytics_SubType_UserAction.change_network, meta);
}

function userAction_voter_registration_attempt(
  meta: TMeteorEventMeta_UserAction_Voter_Registration_Attempt,
) {
  return anal().userAction(EMeteorAnalytics_SubType_UserAction.voter_registration_attempt, meta);
}

function userAction_voter_registration_onboarded(
  meta: TMeteorEventMeta_UserAction_Voter_Registration_Onboarded,
) {
  const votersRaw = localStorage.getItem("voter_registration_onboarded") ?? "[]";
  const voters = JSON.parse(votersRaw);

  if (!voters.includes(meta.accountId)) {
    anal().userAction(EMeteorAnalytics_SubType_UserAction.voter_registration_onboarded, meta);

    localStorage.setItem(
      "voter_registration_onboarded",
      JSON.stringify([...voters, meta.accountId]),
    );
  }
}

function userAction_challengeButton(meta) {
  return anal().userAction(EMeteorAnalytics_SubType_UserAction.button_click, meta);
}

function walletAction_sendNear(meta: TMeteorEventMeta_WalletAction_SendNearToken) {
  return anal().walletAction(EMeteorAnalytics_SubType_WalletAction.send_near, meta);
}

function walletAction_sendFtToken(meta: TMeteorEventMeta_WalletAction_SendFtToken) {
  return anal().walletAction(EMeteorAnalytics_SubType_WalletAction.send_ft, meta);
}

function walletAction_swap(meta: TMeteorEventMeta_WalletAction_Swap) {
  return anal().walletAction(EMeteorAnalytics_SubType_WalletAction.swap, meta);
}

function walletAction_normalStake(meta: TMeteorEventMeta_WalletAction_NormalStake) {
  return anal().walletAction(EMeteorAnalytics_SubType_WalletAction.normal_stake, meta);
}

function walletAction_normalUnstake(meta: TMeteorEventMeta_WalletAction_NormalUnstake) {
  return anal().walletAction(EMeteorAnalytics_SubType_WalletAction.normal_unstake, meta);
}

function walletAction_liquidStake(meta: TMeteorEventMeta_WalletAction_LiquidStake) {
  return anal().walletAction(EMeteorAnalytics_SubType_WalletAction.liquid_stake, meta);
}

function walletAction_liquidUnstake(meta: TMeteorEventMeta_WalletAction_LiquidUnstake) {
  return anal().walletAction(EMeteorAnalytics_SubType_WalletAction.liquid_unstake, meta);
}

function walletAction_liquidDelayedUnstake(
  meta: TMeteorEventMeta_WalletAction_LiquidDelayedUnstake,
) {
  return anal().walletAction(EMeteorAnalytics_SubType_WalletAction.liquid_delayed_unstake, meta);
}

function walletAction_sendNft(meta: TMeteorEventMeta_WalletAction_SendNft) {
  return anal().walletAction(EMeteorAnalytics_SubType_WalletAction.send_nft, meta);
}

function walletAction_createWallet(meta: TMeteorEventMeta_WalletAction_CreateWallet) {
  return anal().walletAction(EMeteorAnalytics_SubType_WalletAction.create_wallet, meta);
}

function walletAction_importWallet(meta: TMeteorEventMeta_WalletAction_ImportWallet) {
  return anal().walletAction(EMeteorAnalytics_SubType_WalletAction.import_wallet, meta);
}

function walletAction_signTransactionRequest(
  meta: TMeteorEventMeta_WalletAction_SignTransactionRequest,
) {
  return anal().walletAction(EMeteorAnalytics_SubType_WalletAction.sign_transaction_request, meta);
}

function walletAction_signTransactionOk(meta: TMeteorEventMeta_WalletAction_SignTransactionOk) {
  return anal().walletAction(EMeteorAnalytics_SubType_WalletAction.sign_transaction_ok, meta);
}

function walletAction_signTransactionFail(meta: TMeteorEventMeta_WalletAction_SignTransactionFail) {
  return anal().walletAction(EMeteorAnalytics_SubType_WalletAction.sign_transaction_fail, meta);
}

function walletAction_signInToDappRequest(meta: TMeteorEventMeta_WalletAction_SignInToDappRequest) {
  return anal().walletAction(EMeteorAnalytics_SubType_WalletAction.sign_in_dapp_request, meta);
}

function walletAction_signInToDappOk(meta: TMeteorEventMeta_WalletAction_SignInToDappOk) {
  return anal().walletAction(EMeteorAnalytics_SubType_WalletAction.sign_in_dapp_ok, meta);
}

function walletAction_signInToDappFail(meta: TMeteorEventMeta_WalletAction_SignInToDappFail) {
  return anal().walletAction(EMeteorAnalytics_SubType_WalletAction.sign_in_dapp_fail, meta);
}

function walletAction_signOutOfDappRequest(
  meta: TMeteorEventMeta_WalletAction_SignOutOfDappRequest,
) {
  return anal().walletAction(EMeteorAnalytics_SubType_WalletAction.sign_out_dapp_request, meta);
}

function walletAction_signOutOfDappOk(meta: TMeteorEventMeta_WalletAction_SignOutOfDappOk) {
  return anal().walletAction(EMeteorAnalytics_SubType_WalletAction.sign_out_dapp_ok, meta);
}

function walletAction_signOutOfDappFail(meta: TMeteorEventMeta_WalletAction_SignOutOfDappFail) {
  return anal().walletAction(EMeteorAnalytics_SubType_WalletAction.sign_out_dapp_fail, meta);
}

function walletAction_hmTimeTravel(meta: TMeteorEventMeta_WalletAction_HmTimeTravel) {
  return anal().walletAction(EMeteorAnalytics_SubType_WalletAction.hm_time_travel_tinker, meta);
}

interface IOnCloseMeta {
  themeMode: EThemeMode;
}

function setOnCloseMeta(meta: IOnCloseMeta) {
  anal().setMetaForOnClose(meta);
}

export const MeteorAppAnalyticsActions = {
  sendPageView,
  userAction_unlock,
  userAction_changeLanguage,
  userAction_changeTheme,
  userAction_changeNetwork,
  userAction_voter_registration_attempt,
  userAction_voter_registration_onboarded,
  userAction_challengeButton,
  walletAction_sendNear,
  walletAction_sendFtToken,
  walletAction_sendNft,
  walletAction_swap,
  walletAction_normalStake,
  walletAction_normalUnstake,
  walletAction_liquidStake,
  walletAction_liquidUnstake,
  walletAction_liquidDelayedUnstake,
  walletAction_createWallet,
  walletAction_importWallet,
  walletAction_signTransactionRequest,
  walletAction_signTransactionOk,
  walletAction_signTransactionFail,
  walletAction_signInToDappRequest,
  walletAction_signInToDappOk,
  walletAction_signInToDappFail,
  walletAction_signOutOfDappRequest,
  walletAction_signOutOfDappOk,
  walletAction_signOutOfDappFail,
  walletAction_hmTimeTravel,
  setOnCloseMeta,
};
