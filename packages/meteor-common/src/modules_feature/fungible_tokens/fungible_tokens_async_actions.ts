import { createAsyncActionWithErrors } from "../../modules_utility/api_utilities/async_action_utils";
import {
  fungible_tokens_async_functions,
  getAccountFtsAndBalance,
  getAccountFtsContract,
  getAndSortAccountTokensProvidedContractIds,
  getFormattedBalanceByToken,
  getTokenPriceListFromDexScreener,
} from "./fungible_tokens_async_functions";

export const fungible_tokens_async_actions = {
  getTokenPriceList: createAsyncActionWithErrors(fungible_tokens_async_functions.getTokenPriceList),
  getFungibleTokenMetadata: createAsyncActionWithErrors(
    fungible_tokens_async_functions.getFungibleTokenMetadata,
  ),
  getTokenListWithPriceAndMetadata: createAsyncActionWithErrors(
    fungible_tokens_async_functions.getTokenListWithPriceAndMetadata,
  ),
  getTokenBalance: createAsyncActionWithErrors(fungible_tokens_async_functions.getTokenBalance),
  getAccountFtsContract: createAsyncActionWithErrors(getAccountFtsContract),
  getAndSortAccountTokensProvidedContractIds: createAsyncActionWithErrors(
    getAndSortAccountTokensProvidedContractIds,
  ),
  getFormattedBalanceByToken: createAsyncActionWithErrors(getFormattedBalanceByToken),
  getAccountFtsAndBalance: createAsyncActionWithErrors(getAccountFtsAndBalance),
  registerRefWhitelistToken: createAsyncActionWithErrors(
    fungible_tokens_async_functions.registerRefWhitelistToken,
  ),
  getTokenPriceListFromDexScreener: createAsyncActionWithErrors(getTokenPriceListFromDexScreener),
};

export const MeteorFtAsyncActions = {};
