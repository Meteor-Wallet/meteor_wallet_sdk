import { IOBackendV2_CreateWallet_Input } from "../meteor_v2_api/meteor_v2_api.io_types";
import { IMeteorBackendV2SignatureInfo } from "../meteor_v2_api/meteor_v2_api.types";
import { ENearNetwork } from "../near/types/near_basic_types";

export interface ISignTelegramData {
  initData: {
    user?: Pick<ITelegramUserData, "id">;
  } | null;
  telegramAuthPayload: ITelegramAuthPayload;
}

interface ITelegramUserData {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  added_to_attachment_menu?: boolean;
  allows_write_to_pm?: boolean;
  photo_url?: string;
}

interface ITelegramChatData {
  id: number;
  type: "group" | "supergroup" | "channel";
  title: string;
  username?: string;
  photo_url?: string;
}

export interface ITelegramAuthPayload {
  initDataString: string;
}

export interface ITelegramAccountSignedPayload {
  walletSignedPayload: IMeteorBackendV2SignatureInfo;
  telegramAuthPayload: ITelegramAuthPayload;
  telegramId: string;
  referrerDetails?: string;
}

export interface ITelegramUserKeyPayload_v1 {
  telegramAuthPayload: ITelegramAuthPayload;
  version: "v1";
  localKey: string;
}

export interface ITelegramUserKeyPayload_v2 {
  telegramAuthPayload: ITelegramAuthPayload;
  version: "v2";
}

export type TTelegramUserKeyPayload = ITelegramUserKeyPayload_v1 | ITelegramUserKeyPayload_v2;

export interface ITelegramData {
  initData: {
    query_id?: string;
    user?: ITelegramUserData;
    receiver?: ITelegramUserData;
    chat?: ITelegramChatData;
    chat_type?: "sender" | "private" | "group" | "supergroup" | "channel";
    chat_instance?: string;
    start_param?: string;
    can_send_after?: number;
    auth_date: number;
    hash: string;
  } | null;
  platform: string;
  version: string;
  telegramAuthPayload: ITelegramAuthPayload;
}

export interface ITelegramLinkedWallet {
  id: number;
  telegram_id: string;
  network_id: ENearNetwork;
  wallet_id: string;
  is_primary: boolean;
  telegram_username: string;
  gas_free_trx_count: number;
  responder_last_reminded_at?: string;
  telegram_name: string;
  referrer_telegram_id: string | null;
  // TODO add rest here
}

export interface IOTelegram_CreateWallet_Input extends IOBackendV2_CreateWallet_Input {
  telegramAuthPayload: ITelegramAuthPayload;
}

export type TTelegramLinkedWalletWithTier = ITelegramLinkedWallet & {
  tier: number | null;
  last_7_days_contribution: string;
  hm_account_info: {
    last_harvested_at: Date;
    vault_level: number;
    lab_level: number;
  } | null;
};

// for backward compat, we don't really need type
export type TFriendListResult = { type: "complete" } & TTelegramLinkedWalletWithTier;
