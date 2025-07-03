import { createAsyncActionWithErrors } from "../../modules_utility/api_utilities/async_action_utils";
import { telegram_async_functions } from "./telegram_async_function";

export const telegram_async_action = {
  telegramCreateWallet: createAsyncActionWithErrors(telegram_async_functions.telegramCreateWallet),
  telegramValidateInitData: createAsyncActionWithErrors(
    telegram_async_functions.telegramValidateInitData,
  ),
  getLinkedTelegramAccountForWallet: createAsyncActionWithErrors(
    telegram_async_functions.getLinkedTelegramAccountForWallet,
  ),
  getLinkedTelegramAccountForWalletPublic: createAsyncActionWithErrors(
    telegram_async_functions.getLinkedTelegramAccountForWalletPublic,
  ),
  getLinkedTelegramAccountForTelegramId: createAsyncActionWithErrors(
    telegram_async_functions.getLinkedTelegramAccountForTelegramId,
  ),
  telegramLinkAccount: createAsyncActionWithErrors(telegram_async_functions.telegramLinkAccount),
  getUnclaimActiveReferralCount: createAsyncActionWithErrors(
    telegram_async_functions.getUnclaimActiveReferralCount,
  ),
  getIsTelegramWhitelisted: createAsyncActionWithErrors(
    telegram_async_functions.getIsTelegramWhitelisted,
  ),
  getLinkedTelegramAccountsForWallets: createAsyncActionWithErrors(
    telegram_async_functions.getLinkedTelegramAccountsForWallets,
  ),
  getFriendList: createAsyncActionWithErrors(telegram_async_functions.getFriendList),
};
