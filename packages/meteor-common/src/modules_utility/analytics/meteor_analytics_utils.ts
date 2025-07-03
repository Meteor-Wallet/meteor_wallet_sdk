import { ZodSchema, z } from "zod";
import { fromYoctoNear } from "../../modules_external/near/utils/near_formatting_utils";
import {
  IDappAction_Login,
  IDappAction_Logout,
  IDappAction_SignTransaction,
} from "../../modules_feature/dapp_connect/types_dappConnect";
import { transaction_utils } from "../../modules_feature/transactions/transaction_utils";
import { MeteorEncryptionUtils } from "../cryptography/MeteorEncryptionUtils";
import { ObjectUtils } from "../data_type_utils/ObjectUtils";
import { ZodUtils } from "../validation/ZodUtils";
import {
  ZMeteorEventMeta_AppHidden,
  ZMeteorEventMeta_Initialize,
  ZMeteorEventMeta_PageView,
  ZMeteorEventMeta_WalletAction_Base,
} from "./meteor_analytics_data_models";
import {
  EMeteorAnalytics_EventType,
  EMeteorAnalytics_SubType_UserAction,
  EMeteorAnalytics_SubType_WalletAction,
} from "./meteor_analytics_enums";
import {
  keyMapAppInputsToBigQuery,
  schemaForUserActionId,
  schemaForWalletActionId,
} from "./meteor_analytics_static_data";
import {
  TMeteorEventMeta_WalletAction_SignInToDappRequest,
  TMeteorEventMeta_WalletAction_SignOutOfDappRequest,
  TMeteorEventMeta_WalletAction_SignTransactionRequest,
  TMeteorEventObject,
} from "./types/meteor_analytics_app_types";
import {
  IMeteor_BigQueryTable_AppEvent_Base,
  TMeteor_BigQueryTable_AppEvents,
  TMeteor_BigQueryTable_EventMetaExtras,
} from "./types/meteor_analytics_bigquery_types";

function convertAppEventDataToBigQueryColumns<T extends TMeteor_BigQueryTable_EventMetaExtras>(
  appData: TMeteorEventObject,
  appDataSchema: ZodSchema,
): (T & IMeteor_BigQueryTable_AppEvent_Base) | null {
  const eventParts: IMeteor_BigQueryTable_AppEvent_Base = {
    app_anonId: appData.anonId,
    app_driver: appData.appDriver,
    app_version: appData.appVersion,
    app_release: appData.appRelease,
    app_longSessionId: appData.longSessionId,
    app_memSessionId: appData.memSessionId,
    eventType: appData.eventType,
    eventSubTypeId: appData.eventSubTypeId,
  };

  const checked = ZodUtils.parseOrNull(appDataSchema, appData.eventMeta);

  if (checked == null) {
    return null;
  }

  return {
    ...ObjectUtils.convertObjectPropertyNames(checked, keyMapAppInputsToBigQuery),
    ...eventParts,
  };
}

function parseMeteorEventObjectForBigQuery(
  meteorData: TMeteorEventObject,
): TMeteor_BigQueryTable_AppEvents | null {
  const eventType = meteorData.eventType;

  if (eventType === EMeteorAnalytics_EventType.initialized) {
    return convertAppEventDataToBigQueryColumns(meteorData, ZMeteorEventMeta_Initialize.partial());
  }

  if (eventType === EMeteorAnalytics_EventType.page_view) {
    return convertAppEventDataToBigQueryColumns(meteorData, ZMeteorEventMeta_PageView);
  }

  if (eventType === EMeteorAnalytics_EventType.app_hidden) {
    return convertAppEventDataToBigQueryColumns(meteorData, ZMeteorEventMeta_AppHidden);
  }

  if (eventType === EMeteorAnalytics_EventType.user_action) {
    const userActionId = ZodUtils.parseOrNull(
      z.nativeEnum(EMeteorAnalytics_SubType_UserAction),
      meteorData.eventSubTypeId,
    );

    if (userActionId == null) {
      return null;
    }

    if (userActionId in schemaForUserActionId) {
      const schema = schemaForUserActionId[userActionId];

      if (schema != null) {
        return convertAppEventDataToBigQueryColumns(meteorData, schema);
      }
    } else {
      return null;
    }
  }

  if (eventType === EMeteorAnalytics_EventType.wallet_action) {
    const walletActionId = ZodUtils.parseOrNull(
      z.nativeEnum(EMeteorAnalytics_SubType_WalletAction),
      meteorData.eventSubTypeId,
    );

    if (walletActionId == null) {
      return null;
    }

    const walletBaseCheck = ZodUtils.parseOrNull(
      ZMeteorEventMeta_WalletAction_Base,
      meteorData.eventMeta,
    );

    if (walletBaseCheck == null) {
      return null;
    }

    if (walletActionId in schemaForWalletActionId) {
      const schema = schemaForWalletActionId[walletActionId];

      if (schema != null) {
        return convertAppEventDataToBigQueryColumns(meteorData, schema);
      }
    } else {
      return null;
    }
  }

  return {
    app_anonId: meteorData.anonId,
    app_driver: meteorData.appDriver,
    app_version: meteorData.appVersion,
    app_release: meteorData.appRelease,
    app_longSessionId: meteorData.longSessionId,
    app_memSessionId: meteorData.memSessionId,
    eventType: meteorData.eventType,
    eventSubTypeId: meteorData.eventSubTypeId,
  };
}

async function convertExternalActionToSignTransactionRequest(
  externalAction: IDappAction_SignTransaction,
): Promise<TMeteorEventMeta_WalletAction_SignTransactionRequest[]> {
  const base: Pick<
    TMeteorEventMeta_WalletAction_SignTransactionRequest,
    "externalHost" | "nearNetwork" | "requestId"
  > = {
    requestId: externalAction.uid,
    nearNetwork: externalAction.network,
    externalHost: externalAction.referrerHost ?? "",
  };

  const actions: TMeteorEventMeta_WalletAction_SignTransactionRequest[] = [];
  let trxOrd = 0;
  let actionTotalOrd = 0;

  for (const trx of externalAction.inputs.transactions) {
    let actionOrd = 0;
    const wHash = await MeteorEncryptionUtils.getWalletIdHash(trx.signerId);

    for (const action of trx.actions) {
      const actionMeta: TMeteorEventMeta_WalletAction_SignTransactionRequest = {
        ...base,
        wId: trx.signerId,
        wHash,
        signContractId: trx.receiverId,
        trxOrd,
        actionOrd,
        actionTotalOrd,
      };

      if (action.functionCall != null) {
        actionMeta.signContractMethod = action.functionCall.methodName;
        actionMeta.nearAmount = Number(fromYoctoNear(action.functionCall.deposit.toString(10)));
        const parsed = transaction_utils.tryParseArgsBase64Json(action.functionCall.args);

        if (parsed) {
          actionMeta.actionArgsJson = JSON.stringify(parsed);
          actionMeta.actionArgsJsonObject = parsed;
        }
      }

      if (action.transfer != null) {
        actionMeta.nearAmount = Number(fromYoctoNear(action.transfer.deposit.toString(10)));
      }

      if (action.stake != null) {
      }

      actions.push(actionMeta);
      actionOrd += 1;
      actionTotalOrd += 1;
    }

    trxOrd += 1;
  }

  return actions;
}

async function convertExternalActionToSignInToDappMeta(
  externalAction: IDappAction_Login,
  walletId: string,
): Promise<TMeteorEventMeta_WalletAction_SignInToDappRequest> {
  const wHash = await MeteorEncryptionUtils.getWalletIdHash(walletId);

  return {
    nearNetwork: externalAction.network,
    wId: walletId,
    wHash,
    allowType: externalAction.inputs.type,
    signContractId: externalAction.inputs.contract_id,
    allowMethods: externalAction.inputs.methods,
    requestId: externalAction.uid,
    externalHost: externalAction.referrerHost ?? "",
  };
}

async function convertExternalActionToSignOutOfDappMeta(
  externalAction: IDappAction_Logout,
): Promise<TMeteorEventMeta_WalletAction_SignOutOfDappRequest> {
  return {
    nearNetwork: externalAction.network,
    wId: externalAction.inputs.accountId,
    wHash: await MeteorEncryptionUtils.getWalletIdHash(externalAction.inputs.accountId),
    signContractId: externalAction.inputs.contractInfo.contract_id,
    requestId: externalAction.uid,
    externalHost: externalAction.referrerHost ?? "",
  };
}

export const meteor_analytics_utils = {
  parseMeteorEventObjectForBigQuery,
  convertExternalActionToSignInToDappMeta,
  convertExternalActionToSignOutOfDappMeta,
  convertExternalActionToSignTransactionRequest,
};
