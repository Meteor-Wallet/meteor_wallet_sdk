import { Transaction } from "@near-wallet-selector/core";
import Big from "big.js";
import { IWithAccountIdAndNetwork } from "../../modules_external/near/types/near_input_helper_types";
import { getPerkClient } from "../../modules_external/perk/clients/client/PerkClient";
import { fungible_tokens_async_functions } from "../fungible_tokens/fungible_tokens_async_functions";
import { IMeteorFungibleTokenWithPrice } from "../fungible_tokens/fungible_tokens_types";
import { getWrapNearTokenContractId } from "../fungible_tokens/fungible_tokens_utils";
import { NEAR_TOKEN_ID } from "../staking/staking_constants";
import { WRAP_NEAR_GAS_IN_AMOUNT } from "./swap_constants";
import {
  IOBuildSwapForAccount_Input,
  IOBuildSwapForAccount_Output,
  IOGetRoutesForAccount_Input,
  IOGetRoutesForAccount_Output,
} from "./swap_types";
import { swap_utils } from "./swap_utils";

async function getRoutesForAccount({
  network,
  ...rest
}: IOGetRoutesForAccount_Input): Promise<IOGetRoutesForAccount_Output> {
  const isWrapNearTrx =
    rest.inputMint === NEAR_TOKEN_ID && rest.outputMint === getWrapNearTokenContractId(network);
  const isUnwrapNearTrx =
    rest.inputMint === getWrapNearTokenContractId(network) && rest.outputMint === NEAR_TOKEN_ID;

  const payload = { ...rest, network };
  // await newGetRoutes(payload);
  if (isWrapNearTrx || isUnwrapNearTrx) {
    return { routes: [swap_utils.buildWrapNearRoute(payload)] };
  } else {
    const { routes } = await getPerkClient(network).getRoutesForAccount(payload);
    return { routes };
  }
}

// async function newGetRoutes({
//   network,
//   swapMode,
//   inputMint,
//   outputMint,
//   amount,
//   ...rest
// }: IOGetRoutesForAccount_Input) {
//   inputMint =
//     inputMint === NEAR_TOKEN_ID
//       ? getWrapNearTokenContractId(network)
//       : inputMint;
//
//   const [inputTokenMetadata, outputTokenMetadata] = await Promise.all([
//     fungible_tokens_async_functions.getFungibleTokenMetadata({
//       contractId: inputMint,
//       network,
//     }),
//     fungible_tokens_async_functions.getFungibleTokenMetadata({
//       contractId: outputMint,
//       network,
//     }),
//   ]);
//
//   // Let take an example of us want to swap NEAR<>USDC and hoping to get 15 USDC
//   if (swapMode === ESwapMode.exact_out) {
//     // Step 1: Get how much 1 USDC worth in NEAR
//     const baseRateEstimationRoute = swap_utils.buildRefSmartRouterUrl(
//       outputMint,
//       inputMint,
//       MathUtil.parseAmount("1", outputTokenMetadata.decimals),
//     );
//
//     // Step 1.1: Here we know 1USDC = 0.24142793 NEAR
//     // NOTES: Never divide until you are sure the number is not too small
//     const baseRateEstimationResponse: RSR_ApiResponse = await fetch(
//       baseRateEstimationRoute,
//     ).then((res) => res.json());
//     const baseRate = Big(baseRateEstimationResponse.result_data.amount_out);
//     console.log(
//       `Base rate of 1 ${outputTokenMetadata.symbol} = ${baseRate} ${inputTokenMetadata.symbol}`,
//     );
//
//     // Step 2: Based on the rate we got in step 1, estimate how much NEAR we need to swap to get 15 USDC
//     const estimatedAmountIn = Big(amount)
//       .mul(baseRate)
//       .div(Big(10).pow(outputTokenMetadata.decimals));
//     console.log(`Estimated amount in: ${estimatedAmountIn}`);
//
//     // Step 3: Fetch using exact amount out and to get the exact rate
//     const exactRateRoute = swap_utils.buildRefSmartRouterUrl(
//       inputMint,
//       outputMint,
//       estimatedAmountIn.toFixed(24),
//     );
//     const exactRateResponse: RSR_ApiResponse = await fetch(exactRateRoute).then(
//       (res) => res.json(),
//     );
//
//     // This tells us how much USDC we get from 1 yoctoNear
//     const exactRate = Big(exactRateResponse.result_data.amount_out).div(
//       estimatedAmountIn,
//     );
//     const exactAmountIn = Big(amount).div(exactRate);
//     // .mul(Big(10).pow(inputTokenMetadata.decimals));
//     console.log(`Amount is: ${amount}`);
//     console.log(
//       `Amount out from estimated amount in: ${exactRateResponse.result_data.amount_out}`,
//     );
//     console.log(
//       `Exact rate: ${exactRate.toFixed(20)} ${outputTokenMetadata.symbol} per ${
//         inputTokenMetadata.symbol
//       }`,
//     );
//     console.log(
//       `Exact amount in: ${exactAmountIn
//         .div(Big(10).pow(inputTokenMetadata.decimals))
//         .toFixed()} ${inputTokenMetadata.symbol}`,
//     );
//     const optimizedExactAmountIn = Big(exactAmountIn).mul(1.0001);
//     console.log(
//       `Optimized amount in: ${optimizedExactAmountIn
//         .div(Big(10).pow(inputTokenMetadata.decimals))
//         .toFixed()} ${inputTokenMetadata.symbol}`,
//     );
//
//     const exactOutRoute = swap_utils.buildRefSmartRouterUrl(
//       inputMint,
//       outputMint,
//       optimizedExactAmountIn.toFixed(24),
//     );
//     const exactOutResponse: RSR_ApiResponse = await fetch(exactOutRoute).then(
//       (res) => res.json(),
//     );
//     console.log(
//       `Exact out amount will be: ${exactOutResponse.result_data.amount_out}`,
//     );
//     console.log(
//       `Pretty Exact out amount will be: ${Big(
//         exactOutResponse.result_data.amount_out,
//       )
//         .div(Big(10).pow(outputTokenMetadata.decimals))
//         .toFixed(24)}`,
//     );
//     // do {
//     //
//     // } while ()
//   }
//
//   // console.log(inputTokenMetadata, outputTokenMetadata);
// }

async function buildSwapTransactions({
  network,
  needUnwrapNear,
  ...rest
}: IOBuildSwapForAccount_Input): Promise<IOBuildSwapForAccount_Output> {
  const isWrapNearTrx =
    rest.route.inputMint === NEAR_TOKEN_ID &&
    rest.route.outputMint === getWrapNearTokenContractId(network);
  const isUnwrapNearTrx =
    rest.route.inputMint === getWrapNearTokenContractId(network) &&
    rest.route.outputMint === NEAR_TOKEN_ID;

  if (isWrapNearTrx) {
    return {
      transactions: [
        await buildWrapNearTransaction({
          network,
          accountId: rest.accountId,
          amount: Big(rest.route.amountIn),
          mode: "wrap",
        }),
      ],
    };
  } else if (isUnwrapNearTrx) {
    return {
      transactions: [
        await buildWrapNearTransaction({
          network,
          accountId: rest.accountId,
          amount: Big(rest.route.amountIn),
          mode: "unwrap",
        }),
      ],
    };
  } else {
    const { transactions: perkTransactions } = await getPerkClient(network).buildTransactions(rest);
    return { transactions: perkTransactions };
  }
}

async function buildWrapNearTransaction({
  network,
  accountId,
  amount,
  mode,
}: IWithAccountIdAndNetwork & {
  amount: Big;
  mode: "wrap" | "unwrap";
}): Promise<Transaction> {
  const contractId = getWrapNearTokenContractId(network);
  const methodName = mode === "wrap" ? "near_deposit" : "near_withdraw";
  return {
    signerId: accountId,
    receiverId: contractId,
    actions: [
      {
        type: "FunctionCall",
        params: {
          methodName,
          args: {
            amount: amount.toFixed(),
          },
          gas: WRAP_NEAR_GAS_IN_AMOUNT.toFixed(),
          deposit: mode === "wrap" ? amount.toFixed() : "1",
        },
      },
    ],
  };
}

async function getTokenListWithPriceAndMetadata({
  network,
}: IWithAccountIdAndNetwork): Promise<IMeteorFungibleTokenWithPrice[]> {
  const payload = await fungible_tokens_async_functions.getTokenListWithPriceAndMetadata({
    network,
  });

  const token_inactive = ["USDC", "USN"];
  const tokens_raw = payload ?? [];
  const tokens = tokens_raw.sort((a, b) => {
    if (token_inactive.includes(b.symbol)) {
      return -1;
    }
    return 0;
  });

  return tokens;
}

export const swap_async_functions = {
  getRoutesForAccount,
  buildSwapTransactions,
  getTokenListWithPriceAndMetadata,
};
