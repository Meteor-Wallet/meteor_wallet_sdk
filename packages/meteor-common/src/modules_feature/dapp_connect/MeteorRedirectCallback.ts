import { AppStore } from "../../modules_app_core/state/app_store/AppStore";
import { TExternalAction } from "../../modules_app_core/state/app_store/AppStore_types";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { transaction_utils } from "../transactions/transaction_utils";
import {
  EDappActionConnectionStatus,
  EDappActionSource,
  EExternalActionType,
  EWalletExternalActionStatus,
  TReferrerBits,
} from "./types_dappConnect";
import {
  ZO_DappSignInAction_Combined,
  ZO_DappSignTransactionAction_UrlQuery,
} from "./validation_dappConnect";

export function initializeRedirectCallback(
  network: ENearNetwork,
  action: EExternalActionType,
  queryObject: any,
) {
  let referrer: TReferrerBits = {
    knownRef: false,
  };

  try {
    const refUrl = new URL(document.referrer);
    referrer = {
      knownRef: true,
      referrerHost: refUrl.hostname,
      referrerOrigin: refUrl.origin,
      referrerFull: document.referrer,
    };
  } catch (e) {
    console.error(e);
    console.warn(
      "No referrer window found, might not be able to respond to dapp which sent the request.",
    );
  }

  if (action === EExternalActionType.sign) {
    console.log("Found sign action");
    const callback_url =
      queryObject.callback_url ?? queryObject.success_url ?? queryObject.failure_url;
    // const transactions = queryObject.transactions;
    const parsed = ZO_DappSignTransactionAction_UrlQuery.safeParse({
      ...queryObject,
      callback_url,
    });

    if (parsed.success) {
      const externalAction: TExternalAction = {
        ...referrer,
        uid: "",
        connectionStatus: EDappActionConnectionStatus.connected,
        actionType: EExternalActionType.sign,
        source: EDappActionSource.website_callback,
        network,
        inputs: {
          status: EWalletExternalActionStatus.UNCONFIRMED,
          transactions: transaction_utils.deserializeTransactionsFromString(
            parsed.data.transactions,
          ),
          // callback_url: parsed.data.callback_url,
          // meta: parsed.data.meta,
        },
      };

      AppStore.update((s) => {
        s.externalActionSource = EDappActionSource.website_callback;
        s.externalActions = [externalAction];
      });
    } else {
      console.warn("Parse error while trying to get app sign transaction in URL", parsed.error);
    }
    // TODO implement signing
  } else if (action === EExternalActionType.login) {
    const callback_url =
      queryObject.callback_url ?? queryObject.success_url ?? queryObject.failure_url;
    const parsed = ZO_DappSignInAction_Combined.safeParse({
      ...queryObject,
      callback_url,
    });

    if (parsed.success) {
      const externalAction: TExternalAction = {
        ...referrer,
        connectionStatus: EDappActionConnectionStatus.connected,
        uid: "",
        actionType: EExternalActionType.login,
        source: EDappActionSource.website_callback,
        inputs: parsed.data,
        network,
      };

      AppStore.update((s) => {
        s.externalActionSource = EDappActionSource.website_callback;
        s.externalActions = [externalAction];
      });
    } else {
      console.warn("Parse error while trying to get app login details", parsed.error);
    }
  }
}
