import Big from "big.js";
import { formatTokenAmount } from "../../modules_external/near/utils/near_formatting_utils";
import { MathUtil } from "../../modules_utility/math/MathUtil";
import { IMeteorFungibleTokenWithPrice } from "../fungible_tokens/fungible_tokens_types";
import { WRAP_NEAR_GAS_IN_NEAR } from "./swap_constants";
import { ESwapMode, IOGetRoutesForAccount_Input, RouteInfo } from "./swap_types";

export const swap_utils = {
  compareRoutePercentage: compareRoutePercentageDifference,
  compareRouteAmount,
  buildWrapNearRoute,
};

function compareRoutePercentageDifference(
  bestRoute: RouteInfo,
  selectedRoute: RouteInfo,
  mode: ESwapMode,
): number {
  if (mode === ESwapMode.exact_in) {
    return parseFloat(
      Big(bestRoute.amountOut)
        .minus(selectedRoute.amountOut)
        .div(selectedRoute.amountOut)
        .mul("100")
        .toFixed(2),
    );
  } else {
    return parseFloat(
      Big(selectedRoute.amountIn)
        .minus(bestRoute.amountIn)
        .div(bestRoute.amountIn)
        .mul("100")
        .toFixed(2),
    );
  }
}

function compareRouteAmount(
  selectedRoute: RouteInfo,
  token: IMeteorFungibleTokenWithPrice,
  mode: ESwapMode,
): string {
  if (mode === ESwapMode.exact_in) {
    return `You receive ${parseFloat(
      formatTokenAmount(selectedRoute.amountOut, token.decimals, 6),
    )} ${token.symbol}`;
  } else {
    return `You pay ${parseFloat(
      formatTokenAmount(selectedRoute.amountIn, token.decimals, 6),
    )} ${token.symbol}`;
  }
}

function buildWrapNearRoute(input: IOGetRoutesForAccount_Input): RouteInfo {
  return {
    steps: [],
    simpleSteps: [],
    minAmountOut: input.amount,
    amountOut: input.amount,
    amountIn: input.amount,
    priceImpact: 0,
    notEnoughLiquidity: false,
    depositAndNetworkFee: "0",
    networkFee: MathUtil.humanReadableFromBigInt(WRAP_NEAR_GAS_IN_NEAR.toString(), 24),
    swapFee: "0",
    platformFee: {
      amount: "0",
      token: "0",
      pct: 0,
    },
    ...input,
  };
}
