import { MeteorBackendV2Client } from "../../modules_external/meteor_v2_api/MeteorBackendV2Client";
import {
  IMeteorBackendSignedContent,
  IMeteorBackendV2SignatureInfo,
} from "../../modules_external/meteor_v2_api/meteor_v2_api.types";
import { IWithAccountIdAndNetwork } from "../../modules_external/near/types/near_input_helper_types";
import { INep0413_PayloadToSign } from "../../modules_external/near/types/standards/wallet_standard_types";
import {
  IOTelegram_CreateWallet_Input,
  ISignTelegramData,
  ITelegramAccountSignedPayload,
  ITelegramAuthPayload,
  ITelegramData,
  TFriendListResult,
} from "../../modules_external/telegram/telegram.types";
import { harvest_moon_async_functions } from "../harvest_moon/harvest_moon_async_function";
import { hmutils_signPayload } from "../harvest_moon/harvest_moon_utils";

const signTelegramLinkMessage = async ({
  network,
  accountId,
  telegramData,
  referrerDetails,
}: IWithAccountIdAndNetwork & {
  telegramData: ISignTelegramData;
  referrerDetails?: string;
}) => {
  let nonceBuffer = Buffer.alloc(32);
  nonceBuffer = crypto.getRandomValues(nonceBuffer);

  const telegramUserId = telegramData.initData?.user?.id.toString() ?? "";

  const payload: INep0413_PayloadToSign = {
    nonce: nonceBuffer,
    recipient: "telegram",
    message: `${Date.now()}:T:link_telegram_id:L:${telegramUserId}`,
  };

  // IN WALLET (access to private key)
  const signed = await harvest_moon_async_functions.signMessage({
    accountId,
    network,
    payload,
  });

  const signedPayload: IMeteorBackendSignedContent = {
    payload: {
      ...payload,
      nonce: payload.nonce.toString("base64"),
    },
    publicKey: signed.publicKey,
    signature: signed.signature,
  };
  const walletSignedPayload: IMeteorBackendV2SignatureInfo = {
    signedPayload,
    walletId: accountId,
    networkId: network,
  };

  const finalPayload: ITelegramAccountSignedPayload = {
    walletSignedPayload,
    telegramAuthPayload: telegramData.telegramAuthPayload,
    telegramId: telegramUserId,
    referrerDetails,
  };

  return finalPayload;
};

async function telegramCreateWallet(inputs: IOTelegram_CreateWallet_Input) {
  try {
    const meteorBackendV2Service = MeteorBackendV2Client.getInstance();

    const resp = await meteorBackendV2Service.telegramCreateWallet(inputs);

    return resp;
  } catch (error) {
    console.error(error);
    console.log({ ...(error as any) });
  }
}

async function telegramValidateInitData(telegramAuthPayload: ITelegramAuthPayload) {
  try {
    const meteorBackendV2Service = MeteorBackendV2Client.getInstance();

    const resp = await meteorBackendV2Service.telegramValidateInitData(telegramAuthPayload);

    return resp;
  } catch (error) {
    console.error(error);
    console.log({ ...(error as any) });
  }
}

async function getLinkedTelegramAccountForWallet(payload: IWithAccountIdAndNetwork) {
  const walletSignedPayload = await hmutils_signPayload(payload);
  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
  const resp = await meteorBackendV2Service.getLinkedTelegramAccountForWallet({
    walletSignedPayload,
  });
  return resp;
}

async function getLinkedTelegramAccountForWalletPublic(
  payload: IWithAccountIdAndNetwork & { checkWalletId: string },
) {
  const walletSignedPayload = await hmutils_signPayload(payload);
  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
  const resp = await meteorBackendV2Service.getLinkedTelegramAccountForWalletPublic({
    walletSignedPayload,
    walletId: payload.checkWalletId,
  });
  return resp;
}

async function getFriendList(
  payload: IWithAccountIdAndNetwork & {
    pageSize: number;
    page: number;
    isHarvestMoonInitialized?: boolean;
  },
): Promise<{
  result: TFriendListResult[];
  totalPage: number;
  total: number;
}> {
  const walletSignedPayload = await hmutils_signPayload(payload);
  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
  const resp = await meteorBackendV2Service.getFriendList({
    walletSignedPayload,
    pageSize: payload.pageSize,
    page: payload.page,
    isHarvestMoonInitialized: payload.isHarvestMoonInitialized,
  });
  return resp;
}

async function getLinkedTelegramAccountsForWallets({
  network,
  accountId,
  telegramData,
  wallets,
}: IWithAccountIdAndNetwork & {
  wallets: {
    walletId: string;
    networkId: string;
  }[];
  telegramData: ISignTelegramData;
}) {
  const walletSignedPayload: ITelegramAccountSignedPayload =
    await telegram_async_functions.signTelegramLinkMessage({
      network,
      accountId,
      telegramData,
    });
  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
  const resp = await meteorBackendV2Service.getLinkedTelegramAccountsForWallets({
    ...walletSignedPayload,
    wallets,
  });
  return resp;
}

async function getLinkedTelegramAccountForTelegramId(payload: ITelegramAuthPayload) {
  if (payload.initDataString === "") {
    return null;
  }
  const backendService = MeteorBackendV2Client.getInstance();
  const resp = await backendService.telegramGetLinkedAccount({
    telegramAuthPayload: payload,
  });
  return resp;
}

async function telegramLinkAccount({
  accountId,
  network,
  telegramData,
  referrerDetails,
}: IWithAccountIdAndNetwork & {
  telegramData: ISignTelegramData;
  referrerDetails?: string;
}) {
  const walletSignedPayload: ITelegramAccountSignedPayload =
    await telegram_async_functions.signTelegramLinkMessage({
      network,
      accountId,
      telegramData,
      referrerDetails,
    });

  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
  return await meteorBackendV2Service.telegramLinkAccount(walletSignedPayload);
}

async function getUnclaimActiveReferralCount(payload: ITelegramAuthPayload): Promise<number> {
  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
  return await meteorBackendV2Service.harvestMoonGetUnclaimActiveReferralCount({
    telegramAuthPayload: payload,
  });
}

async function getIsTelegramWhitelisted({
  telegramData,
}: {
  telegramData: ITelegramData;
}): Promise<boolean> {
  if (telegramData.telegramAuthPayload.initDataString === "") {
    return false;
  }
  const meteorBackendV2Service = MeteorBackendV2Client.getInstance();
  return await meteorBackendV2Service.getIsTelegramWhitelisted(telegramData);
}

export const telegram_async_functions = {
  signTelegramLinkMessage,
  telegramCreateWallet,
  telegramValidateInitData,
  getLinkedTelegramAccountForWallet,
  getLinkedTelegramAccountForTelegramId,
  telegramLinkAccount,
  getUnclaimActiveReferralCount,
  getIsTelegramWhitelisted,
  getLinkedTelegramAccountsForWallets,
  getFriendList,
  getLinkedTelegramAccountForWalletPublic,
};
