import { Action, encodeSignedDelegate } from "@near-js/transactions";
import { memory_state } from "../../modules_app_core/state/memory_state";
import { IMeteorBackendV2SignatureInfo } from "../../modules_external/meteor_v2_api/meteor_v2_api.types";
import { getNearApi } from "../../modules_external/near/clients/near_api_js/NearApiJsClient";
import { IWithAccountIdAndNetwork } from "../../modules_external/near/types/near_input_helper_types";
import { IONearRpc_Query_ViewAccessKey_Output } from "../../modules_external/near/types/near_rpc_types";
import { INep0413_PayloadToSign } from "../../modules_external/near/types/standards/wallet_standard_types";
import { ITelegramAccountSignedPayload } from "../../modules_external/telegram/telegram.types";
import { telegram_async_functions } from "../telegram/telegram_async_function";
import { harvest_moon_async_functions } from "./harvest_moon_async_function";
import { HM_EXCHANGE_ROUTE } from "./harvest_moon_constants";
import { EHM_Exchange_InputAsset, EHM_Exchange_OutputAsset } from "./harvest_moon_enums";
import { IHM_Exchange_Route, IOHarvestMoonTelegramData } from "./harvest_moon_types";

export async function hmutils_signPayload({
  network,
  accountId,
}: IWithAccountIdAndNetwork): Promise<IMeteorBackendV2SignatureInfo> {
  let nonceBuffer = Buffer.alloc(32);
  nonceBuffer = crypto.getRandomValues(nonceBuffer);

  const payload: INep0413_PayloadToSign = {
    nonce: nonceBuffer,
    recipient: "telegram",
    message: `${Date.now()}:T:`,
  };

  const signed = await harvest_moon_async_functions.signMessage({
    accountId,
    network,
    payload,
  });

  return {
    signedPayload: {
      payload: { ...payload, nonce: payload.nonce.toString("base64") },
      publicKey: signed.publicKey,
      signature: signed.signature,
    },
    walletId: accountId,
    networkId: network,
  };
}

export async function hmutils_signPayloadTelegram({
  network,
  accountId,
  telegramData,
}: IOHarvestMoonTelegramData): Promise<IMeteorBackendV2SignatureInfo> {
  const signedPayload: ITelegramAccountSignedPayload =
    await telegram_async_functions.signTelegramLinkMessage({
      network,
      accountId,
      telegramData,
    });

  return signedPayload.walletSignedPayload;
}

export async function hmutils_signDelegateAction({
  network,
  accountId,
  actions,
}: IWithAccountIdAndNetwork & {
  actions: Action[];
}): Promise<string> {
  const account = await getNearApi(network).nativeApi.account(accountId);

  const block = await account.connection.provider.block({
    finality: "optimistic",
  });

  const signedDelegate = await account.signedDelegate({
    receiverId: accountId,
    actions: actions,
    blockHeightTtl: block.header.height + 600,
  });

  const encoded = encodeSignedDelegate(signedDelegate);
  const signedDelegateBase64 = Buffer.from(encoded).toString("base64");

  return signedDelegateBase64;
}

export function hmutils_validateAccessKey(
  rpcViewKeyResponse: IONearRpc_Query_ViewAccessKey_Output | null,
  contractId: string,
): boolean {
  return (
    !!rpcViewKeyResponse &&
    typeof rpcViewKeyResponse.permission === "object" &&
    rpcViewKeyResponse.permission.FunctionCall.receiver_id === contractId
  );
}

export async function waitForKeyStoreUpdate() {
  while (memory_state.updatingKeyStore) {
    await new Promise((r) => setTimeout(r, 500));
  }
  return;
}

// Special function for special event
export function isDoubleMoonWeek(): boolean {
  const DOUBLE_MOON_WEEK_START_TIMESTAMP = 1721865600000000000;
  const DOUBLE_MOON_WEEK_END_TIMESTAMP = 1722470400000000000;
  const current_timestamp = Date.now() * 1000000;

  if (
    current_timestamp >= DOUBLE_MOON_WEEK_START_TIMESTAMP &&
    current_timestamp <= DOUBLE_MOON_WEEK_END_TIMESTAMP
  ) {
    return true;
  }

  return false;
}

export function getMoonProductionRate(
  productionRatePerHour: string,
  showOriginalProductionRate?: boolean,
): string {
  if (showOriginalProductionRate) {
    return productionRatePerHour;
  }

  let multiplier = 1;

  if (isDoubleMoonWeek()) {
    multiplier = 2;
  }

  const initialProductionRatePerHour = productionRatePerHour === "" ? "0" : productionRatePerHour;
  const finalProductionRatePerHour = Number(initialProductionRatePerHour) * multiplier;

  return finalProductionRatePerHour.toString();
}

export function findFirstAvailableRoute(
  inputAsset: EHM_Exchange_InputAsset,
  outputAsset: EHM_Exchange_OutputAsset,
): IHM_Exchange_Route | undefined {
  return HM_EXCHANGE_ROUTE.find(
    (route) => route.input.id === inputAsset && route.output.id === outputAsset,
  );
}
