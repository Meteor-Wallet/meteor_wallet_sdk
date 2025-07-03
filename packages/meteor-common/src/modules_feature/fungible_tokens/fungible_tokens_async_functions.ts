import { ZSwapStoreConstants } from "@meteorwallet/app/src/state/stores/new_swap/ZSwapStore.constants";
import { FinalExecutionOutcome } from "@perk.money/perk-swap-core";
import Big from "big.js";
import _ from "lodash";
import { getNearApi } from "../../modules_external/near/clients/near_api_js/NearApiJsClient";
import { SAFE_NEAR_RESERVE } from "../../modules_external/near/near_constants";
import {
  FT_MINIMUM_STORAGE_BALANCE_LARGE,
  getFungibleTokensService,
} from "../../modules_external/near/services/near_fungible_tokens_service";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import {
  IWithAccountIdAndNetwork,
  IWithContractId,
  IWithNetwork,
} from "../../modules_external/near/types/near_input_helper_types";
import { toYoctoNear } from "../../modules_external/near/utils/near_formatting_utils";
import { convertStorageToNearCost } from "../../modules_external/near/utils/near_storage_utils";
import { RefFinance_HttpClient } from "../../modules_external/ref_finance/clients/RefFinance_HttpClient";
import { MathUtil } from "../../modules_utility/math/MathUtil";
import { getStorageBalance } from "../accounts/account_async_functions";
import { NearAccountSignerExecutor } from "../accounts/near_signer_executor/NearAccountSignerExecutor";
import { near_action_creators } from "../accounts/transactions/near_action_creators";
import { CoreIndexerAdapter } from "../core_indexer/CoreIndexerAdapter";
import { getBlacklistedTokens } from "../metadata/metadata_async_actions";
import { SWAP_TOKENS_TO_REMOVE } from "../swap/swap_constants";
import { NEAR_METADATA, TOKEN_ICON_PLACEHOLDER } from "./fungible_tokens_constants";
import { HIDDEN_TOKEN_LIST, WHITELISTED_TOKEN_LIST } from "./fungible_tokens_static_data";
import { tokenDataOverrideMap } from "./fungible_tokens_token_data_override";
import {
  IGetAccountFtsContract_Output,
  IMeteorFungibleTokenMetadata,
  IMeteorFungibleTokenWithPrice,
  IMeteorFungibleTokenWithPriceAndAmount,
  TTokenPriceList,
  TTokenPriceWithAddress,
} from "./fungible_tokens_types";
import {
  fungible_tokens_utils,
  getAllBlacklistedContracts,
  getWrapNearTokenContractId,
} from "./fungible_tokens_utils";

export const fungible_tokens_async_functions = {
  getFungibleTokenMetadata,
  getTokenPriceList: getTokenPriceListFromRefFinance,
  getTokenBalance,
  getTokenListWithPriceAndMetadata,
  getStorageBalanceBounds: getStorageBalanceBounds,
  getRefUserWhitelistedTokens,
  getRefBasicWhitelistedTokens,
  registerRefWhitelistToken,
  getRefWhitelistedPostfixTokens,
};

// Use this to get minimum storage deposit for FT
export async function getStorageBalanceBounds({
  accountId,
  contractId,
  network,
}: IWithAccountIdAndNetwork & { contractId: string }): Promise<string> {
  const account = await getNearApi(network).nativeApi.account(accountId);
  const result = (await account.viewFunction({
    contractId,
    methodName: "storage_balance_bounds",
  })) as { min: string; max: string };

  return result.min ?? FT_MINIMUM_STORAGE_BALANCE_LARGE;
}

export async function getFungibleTokenMetadata({
  contractId,
  network,
}: {
  contractId: string;
  network: ENearNetwork;
}): Promise<IMeteorFungibleTokenMetadata> {
  if (!contractId) {
    throw new Error("no cotract Id");
  }
  if (contractId.toLowerCase() === NEAR_METADATA.id.toLowerCase()) {
    return NEAR_METADATA;
  }
  try {
    const result = await getFungibleTokensService(network).getMetadata({
      contractId,
    });

    if (!result.icon) {
      result.icon = TOKEN_ICON_PLACEHOLDER;
    }
    const overrideData = tokenDataOverrideMap[contractId];
    return {
      ...result,
      id: contractId,
      icon: result.icon,
      ...overrideData,
    };
  } catch (err) {
    console.warn(`Error fetch metadata for: ${contractId} for error: ${JSON.stringify(err)}`);
    return {
      spec: "",
      id: contractId,
      name: "",
      symbol: "",
      // Setting decimals to 999 so it's being hidden due to very small balance
      decimals: 99,
      icon: "",
      reference: null,
      reference_hash: null,
    };
  }
}

export async function getTokenPriceListFromRefFinance({
  network,
}: IWithNetwork): Promise<TTokenPriceList> {
  try {
    const refFinanceClient = new RefFinance_HttpClient(network);
    return await refFinanceClient.getTokenPriceList();
  } catch (err) {
    console.error(
      `Error fetch token price list from Ref Finance for error: ${JSON.stringify(err)} `,
    );
    return {};
  }
}

export async function getTokenBalance({
  accountId,
  network,
  contractId,
}: IWithContractId & IWithAccountIdAndNetwork): Promise<string> {
  if (contractId === NEAR_METADATA.id) {
    try {
      const accountApi = await getNearApi(network).nativeApi.account(accountId);
      const accountState = await accountApi.state();
      let amount_usable = Big(accountState.amount)
        .minus(convertStorageToNearCost(accountState.storage_usage))
        .minus(Big(SAFE_NEAR_RESERVE));
      if (amount_usable.lte(0)) {
        return "0";
      }
      return amount_usable.toFixed();
    } catch (error) {
      console.warn(`Error fetch NEAR balance for: ${accountId}`);
      return "0";
    }
  }

  try {
    const result = await getFungibleTokensService(network).getBalanceOf({
      contractId,
      accountId,
    });
    return result;
  } catch (err) {
    console.warn(`Error fetch token balance for: ${contractId} for error: ${JSON.stringify(err)} `);
    // console.error(err);
    return "0";
  }
}

export async function getTokenPriceListFromDexScreener(
  tokenIds: string[],
): Promise<TTokenPriceList> {
  const tokenPriceList: TTokenPriceList = {};

  try {
    // separate tokenIds into batches of 30 tokens
    const tokenIdsBatch: string[][] = [];
    for (let i = 0; i < tokenIds.length; i += 5) {
      tokenIdsBatch.push(tokenIds.slice(i, i + 5));
    }
    await Promise.all(
      tokenIdsBatch.map(async (tokenIds: string[]) => {
        const res = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${tokenIds.join(",")}`,
        );
        const response = await res.json();
        const responsePairsLength = response?.pairs?.length ?? 0;
        for (let index = 0; index < responsePairsLength; index++) {
          tokenPriceList[response.pairs[index].baseToken.address] = {
            decimal: 0,
            price: response.pairs[index].priceUsd,
            symbol: response.pairs[index].baseToken.symbol,
          };
        }
      }),
    );
  } catch (err) {
    console.error(err);
    return tokenPriceList;
  }
  // await Promise.all(
  //   tokenIds.map(async (tokenId) => {
  //     try {
  //       const res = await fetch(
  //         `https://api.dexscreener.com/latest/dex/tokens/${tokenId}`,
  //       );
  //       const response = await res.json();
  //       tokenPriceList[tokenId] = {
  //         decimal: 0,
  //         price: response.pairs[0].priceUsd,
  //         symbol: "",
  //       };
  //     } catch (error) {
  //       console.warn(`Error fetch token info for: ${tokenId}`);
  //     }
  //   }),
  // );
  return tokenPriceList;
}

// NOTE:
// This method is used in swap
// 1. This function returns all tokens from WHITELISTED_TOKEN_LIST
// 2. We fetch metadata from RPC, and price from Ref Finance
// 3. Token metadata override happens in step 5
async function getTokenListWithPriceAndMetadata({
  network,
  getTokenBalance = false,
  accountId,
}: IWithNetwork & {
  accountId?: string;
  getTokenBalance?: boolean;
}): Promise<IMeteorFungibleTokenWithPrice[]> {
  // This is a private function here.
  async function getMetadataAndCombine(
    refToken: Pick<TTokenPriceWithAddress, "price" | "address">,
  ): Promise<IMeteorFungibleTokenWithPrice | null> {
    const metadata = await getFungibleTokenMetadata({
      contractId: refToken.address,
      network,
    });
    if (metadata) {
      return {
        ...metadata,
        price_in_usd: refToken.price,
      };
    }
    return null;
  }

  let tokenPriceList: TTokenPriceWithAddress[] = [];
  let whitelistedTokenList: string[] = WHITELISTED_TOKEN_LIST[network];
  let dexScreenerPriceTokenList: string[] = fungible_tokens_utils.getTokensThatNeedDsPrice();

  // Step 1: Get token price
  const [dexScreenerPriceList, refFinancePriceList] = await Promise.all([
    getTokenPriceListFromDexScreener(dexScreenerPriceTokenList),
    getTokenPriceListFromRefFinance({ network }),
  ]);
  for (const token in dexScreenerPriceList) {
    tokenPriceList.push({ ...dexScreenerPriceList[token], address: token });
  }
  for (const token in refFinancePriceList) {
    if (!dexScreenerPriceList.hasOwnProperty(token)) {
      tokenPriceList.push({ ...refFinancePriceList[token], address: token });
    }
  }

  // Step 2: Get token metadata for whitelisted token, add the price in
  whitelistedTokenList = [
    ...new Set([
      ...whitelistedTokenList,
      ...Object.keys(refFinancePriceList),
      ...Object.keys(dexScreenerPriceList),
    ]),
  ];
  const getMetadataPromises: Promise<IMeteorFungibleTokenWithPrice | null>[] = [];
  whitelistedTokenList.forEach((whitelistedTokenId) => {
    let refTokenWithPrice = tokenPriceList.find(
      (refToken) => refToken.address === whitelistedTokenId,
    );
    if (refTokenWithPrice) {
      getMetadataPromises.push(getMetadataAndCombine(refTokenWithPrice));
    } else {
      getMetadataPromises.push(
        getMetadataAndCombine({
          price: "0",
          address: whitelistedTokenId,
        }),
      );
    }
  });

  const tokensWithMetadata = await Promise.all(getMetadataPromises);
  const cleanTokensWithMetadata = tokensWithMetadata.filter(
    (metadata) => metadata != null,
  ) as IMeteorFungibleTokenWithPrice[];

  // Step 4: Combine tokens and remove tokens
  cleanTokensWithMetadata.filter((token) => !SWAP_TOKENS_TO_REMOVE.includes(token.id));
  cleanTokensWithMetadata.unshift({
    ...NEAR_METADATA,
    price_in_usd: refFinancePriceList[getWrapNearTokenContractId(network)]?.price ?? "0",
  });

  // Step 5: Sort tokens by relevance and override data
  const finalTokenList = fungible_tokens_utils
    .sortTokensByRelevance(cleanTokensWithMetadata, network)
    .map((token) => {
      const finalToken = _.omit(token, [
        "tags",
        "extensions",
        "address",
        "nearEnv",
      ]) as IMeteorFungibleTokenWithPrice;
      const overrideData = tokenDataOverrideMap[token.id];

      return { ...finalToken, ...overrideData };
    });
  return finalTokenList;
}

// export interface TIOGetInscriptionHolderInfos_Input {
//   accountId: string;
// }
//
// export type TIOGetInscriptionHolderInfos_Output = {
//   contractName: string;
//   balance: string;
//   metadata: INearFungibleTokenMetadata;
// }[];
//
// export async function getInscriptionHolderInfos({
//   accountId,
// }: TIOGetInscriptionHolderInfos_Input): Promise<TIOGetInscriptionHolderInfos_Output> {
//   if (!accountId) {
//     return [
//       {
//         contractName: "NEAT",
//         balance: "0",
//         metadata: {
//           spec: "",
//           name: "NEAT",
//           symbol: "NEAT",
//           decimals: 8,
//           icon: NEAT_IMAGE,
//           reference: null,
//           reference_hash: null,
//         },
//       },
//     ];
//   }
//   const res = await TheGraph.getInscriptionHolderInfoApi({
//     accountId,
//   });
//   return [
//     {
//       contractName: "NEAT",
//       balance: res.holderInfos[0]?.amount || "0",
//       metadata: {
//         spec: "",
//         name: "NEAT",
//         symbol: "NEAT",
//         decimals: 8,
//         icon: NEAT_IMAGE,
//         reference: null,
//         reference_hash: null,
//       },
//     },
//   ];
// }

export async function getAccountFtsContract({
  network,
  accountId,
}: IWithAccountIdAndNetwork): Promise<IGetAccountFtsContract_Output> {
  const blacklistedTokens = await getBlacklistedTokens();
  const accountFtList = await CoreIndexerAdapter.getInstance(network).getAccountFtList(accountId);
  const blacklisted = getAllBlacklistedContracts(accountFtList, blacklistedTokens);
  const hiddenTokens = HIDDEN_TOKEN_LIST[network];

  return {
    regular: accountFtList
      .filter((item) => !blacklisted.includes(item))
      .filter((item) => !hiddenTokens.includes(item)),
    blacklisted,
  };
}

export async function getAccountFtsAndBalance({
  network,
  accountId,
}: IWithAccountIdAndNetwork): Promise<IMeteorFungibleTokenWithPriceAndAmount[]> {
  const accountFtList = await getAccountFtsContract({ network, accountId });
  return await getAndSortAccountTokensProvidedContractIds({
    network,
    accountId,
    contractIds: accountFtList.regular,
  });
}

export async function getAndSortAccountTokensProvidedContractIds({
  network,
  accountId,
  contractIds,
}: {
  network: ENearNetwork;
  accountId: string;
  contractIds: string[];
  excludeInscriptionToken?: boolean;
}): Promise<IMeteorFungibleTokenWithPriceAndAmount[]> {
  let dexScreenerPriceTokenList: string[] = fungible_tokens_utils.getTokensThatNeedDsPrice();
  const [ftMetadataList, ftBalances, refPrices, dsPrices] = await Promise.all([
    Promise.all(contractIds.map((contractId) => getFungibleTokenMetadata({ contractId, network }))),
    Promise.all(
      contractIds.map((contractId) => getTokenBalance({ contractId, accountId, network })),
    ),
    getTokenPriceListFromRefFinance({ network }),
    getTokenPriceListFromDexScreener(dexScreenerPriceTokenList),
  ]);

  let ftList: IMeteorFungibleTokenWithPriceAndAmount[] = ftMetadataList
    .map((ftMetadata, i) => {
      const overrideData = ftMetadata?.id ? tokenDataOverrideMap[ftMetadata.id] : undefined;
      let tokenPriceObject = refPrices[ftMetadata?.id || ""];
      if (!tokenPriceObject) {
        tokenPriceObject = dsPrices[ftMetadata?.id || ""];
      }
      let amountFormatted = MathUtil.humanReadableFromBigInt(
        ftBalances[i],
        ftMetadata?.decimals,
        4,
      );
      if (!ftMetadata || !ftMetadata?.id) {
        return undefined;
      }

      return {
        ...ftMetadata,
        price_in_usd: overrideData?.price_in_usd ?? Number.parseFloat(tokenPriceObject?.price ?? 0),
        amountFormatted: amountFormatted,
      };
    })
    .filter((ftList) => ftList) as IMeteorFungibleTokenWithPriceAndAmount[];

  return fungible_tokens_utils.formatAndSortTokensByWorth(ftList);
}

export async function getFormattedBalanceByToken({
  network,
  accountId,
  contractName,
}: {
  network: ENearNetwork;
  accountId: string;
  contractName: string;
}) {
  let receiverBalance = "0";
  if (contractName.toLowerCase() === "near") {
    const accountApi = await getNearApi(network).nativeApi.account(accountId);
    const accountState = await accountApi.state();

    const amount_usable: string = Big(accountState.amount)
      .minus(convertStorageToNearCost(accountState.storage_usage))
      .toFixed();
    const receiverNearBalance = MathUtil.humanReadableFromBigInt(
      amount_usable,
      NEAR_METADATA.decimals,
      6,
    );
    receiverBalance = receiverNearBalance;
  } else {
    const receiverTokenBalance = await getAndSortAccountTokensProvidedContractIds({
      network,
      accountId,
      contractIds: [contractName],
    });
    if (receiverTokenBalance && receiverTokenBalance.length > 0) {
      receiverBalance = receiverTokenBalance[0].amountFormatted;
    }
  }

  if (Big(receiverBalance).lt(0)) {
    return "0";
  }

  return receiverBalance;
}

async function getRefBasicWhitelistedTokens({
  accountId,
  network,
}: IWithAccountIdAndNetwork): Promise<string[]> {
  try {
    const account = await getNearApi(network).nativeApi.account("dontcare");
    const result = await account.viewFunction({
      contractId: ZSwapStoreConstants[network].refContractId,
      methodName: "get_whitelisted_tokens",
    });
    return result;
  } catch (e) {
    console.error(e);
    return WHITELISTED_TOKEN_LIST[network];
  }
}

async function getRefUserWhitelistedTokens({ accountId, network }: IWithAccountIdAndNetwork) {
  try {
    const account = await getNearApi(network).nativeApi.account("dontcare");
    const result = await account.viewFunction({
      contractId: ZSwapStoreConstants[network].refContractId,
      methodName: "get_user_whitelisted_tokens",
      args: {
        account_id: accountId,
      },
    });
    return result;
  } catch (e) {
    console.error(e);
    return [];
  }
}

async function registerRefWhitelistToken({
  network,
  accountId,
  contractIds,
}: IWithAccountIdAndNetwork & {
  contractIds: string[];
}): Promise<FinalExecutionOutcome> {
  const refContractId = ZSwapStoreConstants[network].refContractId;

  const depositTransaction = {
    receiverId: refContractId,
    actions: [
      near_action_creators.functionCall({
        contractId: refContractId,
        methodName: "storage_deposit",
        args: {
          account_id: accountId,
          registration_only: false,
        },
        attachedDeposit: BigInt(toYoctoNear(0.1)),
      }),
    ],
  };
  const actualTransaction = {
    receiverId: refContractId,
    actions: [
      near_action_creators.functionCall({
        contractId: refContractId,
        methodName: "register_tokens",
        gas: BigInt(300000000000000),
        attachedDeposit: BigInt(1),
        args: {
          token_ids: contractIds,
        },
      }),
    ],
  };

  const storageAvailable = await getStorageBalance({
    contractId: refContractId,
    accountId,
    network,
  });

  if (storageAvailable?.total === undefined) {
    const [_, withDepositRes] = await NearAccountSignerExecutor.getInstance(
      accountId,
      network,
    ).startTransactionsAwait([depositTransaction, actualTransaction]);
    return withDepositRes;
  } else {
    const [res] = await NearAccountSignerExecutor.getInstance(
      accountId,
      network,
    ).startTransactionsAwait([actualTransaction]);
    return res;
  }
}

async function getRefWhitelistedPostfixTokens({
  network,
}: IWithAccountIdAndNetwork): Promise<string[]> {
  try {
    const account = await getNearApi(network).nativeApi.account("dontcare");
    const result = await account.viewFunction({
      contractId: ZSwapStoreConstants[network].refContractId,
      methodName: "metadata",
    });
    return result["auto_whitelisted_postfix"];
  } catch (e) {
    console.error(e);
    return [];
  }
}
