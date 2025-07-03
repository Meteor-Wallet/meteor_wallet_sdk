import Big from "big.js";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { NEAR_TOKEN_ID } from "../staking/staking_constants";
import { FT_DEFAULT_ORDER } from "./fungible_tokens_constants";
import { tokenDataOverrideMap } from "./fungible_tokens_token_data_override";
import {
  IMeteorFungibleTokenBalance,
  IMeteorFungibleTokenWithPrice,
  IMeteorFungibleTokenWithPriceAndAmount,
} from "./fungible_tokens_types";

export const fungible_tokens_utils = {
  sortTokensByRelevance,
  formatAndSortTokensByWorth,
  renameTokenSymbol,
  getTokensThatNeedDsPrice,
  sortTokensByWorth,
};

/**
 * rename the symbol to human-readable symbol
 */
function renameTokenSymbol(address: string, fallbackSymbol: string): string {
  const data = tokenDataOverrideMap[address];
  // If there's an override for the symbol, return that; otherwise, return the provided symbol
  return data && data.symbol ? data.symbol : fallbackSymbol;
}

export function getWrapNearTokenContractId(network: ENearNetwork) {
  if (network === ENearNetwork.mainnet) {
    return "wrap.near";
  }
  return "wrap.testnet";
}

export function getUSDCTokenContractId(network: ENearNetwork) {
  if (network === ENearNetwork.mainnet) {
    return "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near";
  }
  return "usdc.fakes.testnet";
}

function sortTokensByRelevance(
  tokenList: IMeteorFungibleTokenBalance[] | IMeteorFungibleTokenWithPrice[],
  networkId: ENearNetwork,
): IMeteorFungibleTokenBalance[] | IMeteorFungibleTokenWithPrice[] {
  let prioritizedTokens = FT_DEFAULT_ORDER[networkId];
  tokenList = tokenList.sort((a, b) => {
    if (prioritizedTokens.includes(a.id) && prioritizedTokens.includes(b.id)) {
      return prioritizedTokens.indexOf(a.id) - prioritizedTokens.indexOf(b.id);
    } else if (prioritizedTokens.includes(a.id)) {
      return -1;
    } else if (prioritizedTokens.includes(b.id)) {
      return 1;
    }
    return a.id.localeCompare(b.id);
  });

  return tokenList;
}

function sortTokensByWorth(
  tokenList: IMeteorFungibleTokenBalance[],
  nearFirst: boolean = false,
): IMeteorFungibleTokenBalance[] {
  tokenList = tokenList.sort((a, b) => {
    if (nearFirst) {
      if (a.id === NEAR_TOKEN_ID) return -1;
      if (b.id === NEAR_TOKEN_ID) return 1;
    }

    const aBalanceWorth = new Big(a.balance)
      .div(Big(10).pow(a.decimals))
      .mul(Big(a.price_in_usd ?? 0));
    const bBalanceWorth = new Big(b.balance)
      .div(Big(10).pow(b.decimals))
      .mul(Big(b.price_in_usd ?? 0));

    // Sort by balance worth in descending order
    return bBalanceWorth.minus(aBalanceWorth).toNumber();
  });

  return tokenList;
}

function formatAndSortTokensByWorth(tokenList: IMeteorFungibleTokenWithPriceAndAmount[]) {
  tokenList = tokenList.sort((a, b) => {
    const aWorth = parseFloat(a.amountFormatted) * parseFloat(a.price_in_usd);
    const bWorth = parseFloat(b.amountFormatted) * parseFloat(b.price_in_usd);

    if (!aWorth && !bWorth) {
      if (b.amountFormatted === "0" && a.amountFormatted === "0") {
        return parseFloat(b.price_in_usd) - parseFloat(a.price_in_usd);
      }
      return Number(b.amountFormatted) - Number(a.amountFormatted);
    } else {
      return bWorth - aWorth;
    }
  });

  return tokenList;
}

export function getAllBlacklistedContracts(contracts: string[], blacklisted: string[]): string[] {
  return contracts.filter((contract) =>
    blacklisted.some((token) => contract === token || contract.endsWith("." + token)),
  );
}

function getTokensThatNeedDsPrice(): string[] {
  return Object.keys(tokenDataOverrideMap).filter(
    (token) => tokenDataOverrideMap[token].needDSPrice,
  );
}
