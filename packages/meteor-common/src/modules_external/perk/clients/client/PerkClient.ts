import type { SwapRoute } from "@perk.money/perk-swap-core";
import JSBI from "jsbi";
import {
  ESwapMode,
  IOGetRoutesForAccount_Input,
  IOGetRoutesForAccount_Output,
  RouteInfo,
} from "../../../../modules_feature/swap/swap_types";
import { ENearNetwork } from "../../../near/types/near_basic_types";
import { Perk } from "../PerkSwapCore";
import { SwapMode } from "../PerkSwapCore";
import { Provider } from "@near-js/providers";
import Big from "big.js";
import { getWrapNearTokenContractId } from "../../../../modules_feature/fungible_tokens/fungible_tokens_utils";
import { NEAR_TOKEN_ID } from "../../../../modules_feature/staking/staking_constants";
import { IOBuildTransactions_Input, IOBuildTransactions_Output } from "../../types_perk";
import { getNearFailoverRpcProvider } from "../../../../modules_feature/rpc/rpc_utils";

class PerkClient {
  provider: Provider;
  network: ENearNetwork;

  constructor(network: ENearNetwork) {
    this.network = network;
    this.provider = getNearFailoverRpcProvider(network);
  }

  async getRoutesForAccount({
    accountId,
    amount,
    outputMint,
    inputMint,
    slippage,
    tokenPrices,
    swapMode,
  }: IOGetRoutesForAccount_Input): Promise<IOGetRoutesForAccount_Output> {
    if (inputMint === NEAR_TOKEN_ID) {
      inputMint = getWrapNearTokenContractId(this.network);
    }
    if (outputMint === NEAR_TOKEN_ID) {
      outputMint = getWrapNearTokenContractId(this.network);
    }

    const perk = await Perk.load({
      // @ts-ignore
      provider: this.provider,
      user: accountId,
      routeCacheDuration: 3_000, // Time to refetch data on computeRoutes
    });

    let convertedSwapMode: SwapMode =
      swapMode === ESwapMode.exact_in ? SwapMode.ExactIn : SwapMode.ExactOut;
    const { routesInfos }: { routesInfos: SwapRoute[] } = await perk.computeRoutes({
      inputMint,
      outputMint,
      slippage, // percent
      amount: JSBI.BigInt(amount), // 1 wNEAR
      swapMode: convertedSwapMode, // could be ExactIn and ExactOut
    });

    const routes = routesInfos.map(
      ({
        inputMint,
        outputMint,
        minAmountOut,
        amountOut,
        amountIn,
        platformFee: { amount, token, pct },
        steps,
        priceImpact,
        notEnoughLiquidity,
        depositAndNetworkFee,
        swapMode,
      }): RouteInfo => ({
        inputMint,
        outputMint,
        steps,
        priceImpact,
        notEnoughLiquidity,
        minAmountOut: minAmountOut.toString(),
        amountOut: amountOut.toString(),
        amountIn: amountIn.toString(),
        platformFee: {
          amount: amount.toString(),
          token,
          pct,
        },
        depositAndNetworkFee: depositAndNetworkFee.toString(),
        networkFee: Big(tokenPrices["wrap.near"]?.price ?? "0.00")
          .mul(Big(depositAndNetworkFee.toString()).div(Big(10).pow(24)))
          .toFixed(2, Big.roundUp),
        swapFee: steps.reduce<string>((acc, curr) => {
          let token = tokenPrices[curr.feeMint];
          return Big(acc)
            .add(
              Big(token?.price ?? "0.00").mul(
                Big(curr.feeAmount.toString()).div(Big(10).pow(token?.decimal ?? 0)),
              ),
            )
            .toFixed(2, Big.roundUp);
        }, "0.00"),
        swapMode: swapMode === SwapMode.ExactIn ? ESwapMode.exact_in : ESwapMode.exact_out,
        simpleSteps: steps.map((step) => ({
          ...step,
          provider: step.amm.label,
          amountIn: step.amountIn.toString(),
          minAmountOut: step.minAmountOut.toString(),
          amountOut: step.amountOut.toString(),
          feeAmount: step.feeAmount.toString(),
        })),
      }),
    );

    return { routes };
  }

  async buildTransactions({
    accountId,
    route,
  }: IOBuildTransactions_Input): Promise<IOBuildTransactions_Output> {
    console.log("Trying to build transactions for swap", accountId, route);

    const perk = await Perk.load({
      // @ts-ignore
      provider: this.provider,
      user: accountId,
      // platformFeeAndAccounts: YOUR_PLATFORM_FEE
      routeCacheDuration: 10_000, // Time to refetch data on computeRoutes
    });

    const cast_route = {
      inputMint: route.inputMint,
      outputMint: route.outputMint,
      minAmountOut: JSBI.BigInt(route.minAmountOut),
      amountOut: JSBI.BigInt(route.amountOut),
      amountIn: JSBI.BigInt(route.amountIn),
      platformFee: {
        amount: JSBI.BigInt(route.platformFee.amount),
        token: route.platformFee.token,
        pct: route.platformFee.pct,
      },
      steps: route.steps,
      priceImpact: route.priceImpact,
      notEnoughLiquidity: route.notEnoughLiquidity,
      depositAndNetworkFee: JSBI.BigInt(route.depositAndNetworkFee),
      swapMode: route.swapMode === ESwapMode.exact_in ? SwapMode.ExactIn : SwapMode.ExactOut,
    };

    return perk.buildTransactions({ route: cast_route });
  }
}

const clients: {
  [key in ENearNetwork]?: PerkClient;
} = {};

export function getPerkClient(network: ENearNetwork): PerkClient {
  return new PerkClient(network);
}
