import { Account } from "@near-js/accounts";
import { KeyPair, KeyPairString } from "@near-js/crypto";
import { JsonRpcProvider } from "@near-js/providers";
import { Action, Transaction } from "@near-wallet-selector/core";
import type { Route, SwapStep } from "@perk.money/perk-swap-core";
import type {
  RefFinancePool,
  RefFinanceSimplePool,
  Reserves,
} from "@perk.money/perk-swap-core/dist/amms/refFinance/types";
import type { RefFinanceStablePool } from "@perk.money/perk-swap-core/dist/amms/refFinance/types";
import type {
  SpinMarketOrderbookResponse,
  SpinMarketResponse,
} from "@perk.money/perk-swap-core/dist/amms/spin/types";
import type {
  TonicMarketResponse,
  TonicOrderBookResponse,
} from "@perk.money/perk-swap-core/dist/amms/tonic/types";
import { TokenInfo, TokenListProvider } from "@tonic-foundation/token-list";
import Decimal from "decimal.js";
import { Near, connect, keyStores } from "near-api-js";
import { NEAR_BASE_CONFIG_FOR_NETWORK } from "../../near/near_static_data";
import { JSBI } from "./dependencies/jsbi";

const ZERO = /*#__PURE__*/ JSBI.BigInt(0);

const STORAGE_TO_REGISTER_WITH_MFT = "100000000000000000000000";
const REF_FINANCE_ID = "v2.ref-finance.near";
const JUMBO_ID = "v1.jumbo_exchange.near";
const TONIC_ID = "v1.orderbook.near";
const WRAPPED_NEAR_ID = "wrap.near";
const MEMO = "perk"; // TODO: change
const DEFAULT_GAS = "150000000000000";

const token_USDC = "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1";

enum SwapMode {
  ExactIn = "ExactIn",
  ExactOut = "ExactOut",
}

/*(function (SwapMode) {
  SwapMode["ExactIn"] = "ExactIn";
  SwapMode["ExactOut"] = "ExactOut";
})(SwapMode || (SwapMode = {}));*/

const decimalsExponentiateBase = /*#__PURE__*/ JSBI.BigInt(10);
const addDecimals = (number: JSBI, decimals: JSBI | number) => {
  const decimalsJSBI = decimals instanceof JSBI ? decimals : JSBI.BigInt(decimals);
  const multiplier = JSBI.exponentiate(decimalsExponentiateBase, decimalsJSBI);
  return JSBI.multiply(number, multiplier);
};
const removeDecimals = (number: JSBI, decimals: JSBI | number) => {
  const decimalsJSBI = decimals instanceof JSBI ? decimals : JSBI.BigInt(decimals);
  const multiplier = JSBI.exponentiate(decimalsExponentiateBase, decimalsJSBI);
  return JSBI.divide(number, multiplier);
};
const changeDecimals = (number: JSBI, fromDecimals: JSBI | number, toDecimals: JSBI | number) => {
  return removeDecimals(addDecimals(number, toDecimals), fromDecimals);
};

const filterEmptyPools = (pools: RefFinancePool[]) =>
  pools.filter((pool) => pool.shares_total_supply !== "0");

const createCorrelation = (arr1, arr2) =>
  arr1.reduce((acc, curr, index) => acc.set(curr, arr2[index]), new Map());

const createReserves = (pool: RefFinancePool) =>
  createCorrelation(
    pool.token_account_ids,
    pool.amounts.map((a) => JSBI.BigInt(a)),
  );

const createCAmountReserves = (pool: RefFinanceStablePool) =>
  createCorrelation(
    pool.token_account_ids,
    pool.c_amounts.map((a) => JSBI.BigInt(a)),
  );

const getMostLiquidPools = (pools: RefFinancePool[]) => {
  const poolsMap = pools.reduce((acc, pool) => {
    const tokenAccountsIds = pool.token_account_ids.sort();
    const id = `${tokenAccountsIds[0]}_${tokenAccountsIds[1]}`;

    if (acc.has(id)) {
      const savedPools = acc.get(id) || [];
      acc.set(id, [...savedPools, pool]);
    } else {
      acc.set(id, [pool]);
    }

    return acc;
  }, new Map());

  return Array.from(poolsMap.values()).flatMap((poolsByTokens: RefFinancePool[]) => {
    return poolsByTokens.sort((poolA, poolB) => {
      const [tokenA, tokenB] = poolA.token_account_ids;
      return JSBI.greaterThan(
        JSBI.BigInt(poolB.reserves.get(tokenA) || ZERO),
        JSBI.BigInt(poolA.reserves.get(tokenA) || ZERO),
      ) &&
        JSBI.greaterThan(
          JSBI.BigInt(poolB.reserves.get(tokenB) || ZERO),
          JSBI.BigInt(poolA.reserves.get(tokenB) || ZERO),
        )
        ? 1
        : -1;
    })[0];
  });
};

const filterMostLiquidUniqPools = (pools: RefFinancePool[]) => {
  const notEmptyPools = filterEmptyPools(pools);
  const simplePools = notEmptyPools.filter((pool) => pool.pool_kind === "SIMPLE_POOL");
  return getMostLiquidPools(simplePools);
};

const getNumberOfPools = async ({
  provider,
  ammId,
}: {
  provider: JsonRpcProvider;
  ammId: string;
}) => {
  return await provider
    .query<any>({
      request_type: "call_function",
      account_id: ammId,
      method_name: "get_number_of_pools",
      args_base64: Buffer.from(JSON.stringify({})).toString("base64"),
      finality: "optimistic",
    })
    .then((res) => JSON.parse(Buffer.from(res.result).toString()));
};

const parseSimplePool = (pool: RefFinanceSimplePool, id: number): RefFinanceSimplePool => {
  return { ...pool, id, reserves: createReserves(pool) };
};

const loadSimplePool = async ({
  provider,
  ammId,
  poolId,
}: {
  provider: JsonRpcProvider;
  ammId: string;
  poolId: number;
}) => {
  const pool = await provider
    .query<any>({
      request_type: "call_function",
      account_id: ammId,
      method_name: "get_pool",
      args_base64: Buffer.from(
        JSON.stringify({
          pool_id: poolId,
        }),
      ).toString("base64"),
      finality: "optimistic",
    })
    .then((res) => JSON.parse(Buffer.from(res.result).toString()));
  return parseSimplePool(pool, poolId);
};

const loadPool = async ({
  provider,
  ammId,
  poolId,
  poolKind,
}: {
  provider: JsonRpcProvider;
  ammId: string;
  poolId: number;
  poolKind: string;
}) => {
  if (poolKind) {
    switch (poolKind) {
      case "STABLE_SWAP":
        return await getStablePool(provider, ammId, poolId);

      case "RATED_SWAP":
        return await getRatedPool(provider, ammId, poolId);

      default:
        // @ts-ignore
        return await loadSimplePool({
          provider,
          ammId,
          poolId,
        });
    }
  } else {
    // @ts-ignore
    return await loadSimplePool({
      provider,
      ammId,
      poolId,
    });
  }
};

const loadPools = async ({
  provider,
  ammId,
  index = 0,
  limit,
}: {
  provider: JsonRpcProvider;
  ammId: string;
  index?: number;
  limit: number;
}) => {
  return await provider
    .query<any>({
      request_type: "call_function",
      account_id: ammId,
      method_name: "get_pools",
      args_base64: Buffer.from(
        JSON.stringify({
          from_index: index,
          limit,
        }),
      ).toString("base64"),
      finality: "optimistic",
    })
    .then((res) => JSON.parse(Buffer.from(res.result).toString()));
};

const parseStableSwapPool = (pool: RefFinanceStablePool, id: number) => {
  const STABLE_SWAP_LP_DECIMALS = 18;
  return {
    ...pool,
    id,
    reserves: createReserves(pool),
    cAmountReserves: createCAmountReserves(pool),
    decimals: createCorrelation(pool.token_account_ids, pool.decimals),
    // @ts-ignore
    rates: createCorrelation(
      pool.token_account_ids,
      pool.c_amounts.map(() => addDecimals(JSBI.BigInt(1), STABLE_SWAP_LP_DECIMALS)),
    ),
    pool_kind: "STABLE_SWAP",
  };
};

async function getStablePool(provider: JsonRpcProvider, exchange: string, poolId: number) {
  const pool = await provider
    .query<any>({
      request_type: "call_function",
      account_id: exchange,
      method_name: "get_stable_pool",
      args_base64: Buffer.from(
        JSON.stringify({
          pool_id: poolId,
        }),
      ).toString("base64"),
      finality: "optimistic",
    })
    .then((res) => JSON.parse(Buffer.from(res.result).toString()));
  return parseStableSwapPool(pool, poolId);
}

const parseRatedPool = (pool, poolId) => {
  return {
    ...pool,
    id: poolId,
    reserves: createReserves(pool),
    cAmountReserves: createCAmountReserves(pool),
    decimals: createCorrelation(pool.token_account_ids, pool.decimals),
    rates: createCorrelation(
      pool.token_account_ids,
      pool.rates.map((r) => JSBI.BigInt(r)),
    ),
    pool_kind: "RATED_SWAP",
  };
};

/**
 * Fetch a rated pool. Rated pools are an improved version of stable pools.
 * @param provider
 * @param poolId
 * @returns
 */

async function getRatedPool(provider, exchange, poolId) {
  const pool = await provider
    .query({
      request_type: "call_function",
      account_id: exchange,
      method_name: "get_rated_pool",
      args_base64: Buffer.from(
        JSON.stringify({
          pool_id: poolId,
        }),
      ).toString("base64"),
      finality: "optimistic",
    })
    .then((res) => JSON.parse(Buffer.from(res.result).toString()));
  return parseRatedPool(pool, poolId);
}

const loadAllPools = async ({
  provider,
  ammId,
}: {
  provider: JsonRpcProvider;
  ammId: string;
}): Promise<{
  simplePools: RefFinanceSimplePool[];
  stablePools: RefFinanceStablePool[];
}> => {
  const numberOfPools = await getNumberOfPools({
    provider,
    ammId,
  });
  let poolsCounter = 0;
  let poolsPromises: Promise<RefFinancePool>[] = [];
  const poolsBatchToLoad = 500;

  while (numberOfPools > poolsCounter) {
    const poolsBatchPromise = loadPools({
      provider,
      ammId,
      index: poolsCounter,
      limit: poolsBatchToLoad,
    });
    poolsPromises.push(poolsBatchPromise);
    poolsCounter += poolsBatchToLoad;
  }

  const pools = (await Promise.all(poolsPromises)).flat();
  const poolsWithIndexes = pools.map((pool, index) =>
    parseSimplePool(pool as RefFinanceSimplePool, index),
  ) as RefFinancePool[]; // @ts-ignore

  const simplePools = poolsWithIndexes.filter(
    (pool) => pool.pool_kind === "SIMPLE_POOL",
  ) as RefFinanceSimplePool[];

  const rawStablePools = poolsWithIndexes.filter(
    (pool) => pool.pool_kind !== "SIMPLE_POOL",
  ) as RefFinanceStablePool[];

  const stablePools: RefFinanceStablePool[] = await Promise.all(
    rawStablePools.map((pool) => {
      if (pool.pool_kind === "STABLE_SWAP") {
        return getStablePool(provider, ammId, pool.id);
      } else {
        return getRatedPool(provider, ammId, pool.id);
      }
    }),
  );
  return {
    simplePools,
    stablePools,
  };
}; // will test later

async function createRefTransactions({
  user,
  swapSteps,
}: {
  user: string;
  swapSteps: SwapStep[];
}): Promise<Transaction[]> {
  const transactions: any[] = []; // works only for 1 and 2 steps route, if there will be 3 and more steps
  // in future - we'll need to update it

  const actionsList = swapSteps.map((swapStep, index, arr) => {
    const { amm, inputMint, outputMint, amountIn, minAmountOut } = swapStep;
    const commonActionInfo = {
      pool_id: amm.instanceId,
      token_in: inputMint,
      token_out: outputMint,
    };
    const isFirstSwapStep = index === 0;
    const isMultiHop = arr.length > 1; // for direct route specify both amount in & out

    if (!isMultiHop) {
      return {
        ...commonActionInfo,
        amount_in: amountIn.toString(),
        min_amount_out: minAmountOut.toString(),
      };
    } // for first step in multi hop we skip min amount out and specify iy only
    // on last step of swap route

    if (isFirstSwapStep) {
      return {
        ...commonActionInfo,
        amount_in: amountIn.toString(),
        min_amount_out: "0",
      };
    } // for last step we specify only min amount out - so we take all amount out from
    // prev step as amount in, and fail automatically if it's less then needed for min_amount_out

    return {
      pool_id: amm.instanceId,
      token_in: inputMint,
      token_out: outputMint,
      min_amount_out: minAmountOut.toString(),
    };
  });
  const { amm: commonAMM, inputMint, amountIn } = swapSteps[0];
  transactions.push({
    receiverId: inputMint,
    signerId: user,
    actions: [
      {
        type: "FunctionCall",
        params: {
          methodName: "ft_transfer_call",
          args: {
            receiver_id: commonAMM.contractId,
            amount: amountIn.toString(),
            msg: JSON.stringify({
              force: 0,
              actions: actionsList,
            }),
            memo: MEMO,
          },
          gas: DEFAULT_GAS,
          deposit: "1",
        },
      },
    ],
  });
  return transactions;
}

const FEE_DIVISOR$1 = /*#__PURE__*/ JSBI.BigInt(10000); // From ref.finance/jumbo specs

function getOutputAmount({ reserves, poolFee = 0, slippage, inputMint, outputMint, inputAmount }) {
  const inputPoolBalance = reserves.get(inputMint) || ZERO;
  const outputPoolBalance = reserves.get(outputMint) || ZERO;

  if (JSBI.equal(inputPoolBalance, ZERO) || JSBI.equal(outputPoolBalance, ZERO)) {
    return {
      amountIn: inputAmount,
      amountOut: ZERO,
      minAmountOut: ZERO,
      feeAmount: ZERO,
      notEnoughLiquidity: true,
      priceImpact: 0,
    };
  }

  const feeAmount = JSBI.divide(JSBI.multiply(JSBI.BigInt(poolFee), inputAmount), FEE_DIVISOR$1);
  const inputAmountLessFees = JSBI.subtract(inputAmount, feeAmount);
  const numerator = JSBI.multiply(inputAmountLessFees, outputPoolBalance);
  const denominator = JSBI.add(inputPoolBalance, inputAmountLessFees);
  const amountOut = JSBI.divide(numerator, denominator);
  const amountOutLessSlippage = slippage.getFor(amountOut);
  const finalPrice = +inputPoolBalance.toString() / +outputPoolBalance.toString();
  const newPrice = +inputAmount.toString() / +amountOut.toString();
  const priceImpact = (newPrice - finalPrice) / newPrice;
  return {
    notEnoughLiquidity: false,
    amountIn: inputAmount,
    amountOut,
    minAmountOut: amountOutLessSlippage,
    feeAmount,
    priceImpact,
  };
}

function getInputAmount({ reserves, poolFee = 0, slippage, inputMint, outputMint, outputAmount }) {
  const inputPoolBalance = reserves.get(inputMint) || ZERO;
  const outputPoolBalance = reserves.get(outputMint) || ZERO;

  if (JSBI.equal(inputPoolBalance, ZERO) || JSBI.equal(outputPoolBalance, ZERO)) {
    return {
      amountIn: ZERO,
      amountOut: outputAmount,
      minAmountOut: outputAmount,
      feeAmount: ZERO,
      notEnoughLiquidity: true,
      priceImpact: 0,
    };
  }

  const numerator = JSBI.multiply(outputAmount, inputPoolBalance);
  const denominator = JSBI.subtract(outputPoolBalance, outputAmount);
  const amountIn = JSBI.divide(numerator, denominator);
  const feeAmount = JSBI.divide(JSBI.multiply(JSBI.BigInt(poolFee), amountIn), FEE_DIVISOR$1);
  const amountInWithFees = JSBI.add(amountIn, feeAmount);
  const slippageAmount = JSBI.divide(
    JSBI.multiply(outputAmount, slippage.numerator),
    slippage.denominator,
  );
  const minAmountOut = JSBI.subtract(outputAmount, slippageAmount);
  const finalPrice = +inputPoolBalance.toString() / +outputPoolBalance.toString();
  const newPrice = +amountInWithFees.toString() / +outputAmount.toString();
  const priceImpact = (newPrice - finalPrice) / newPrice;
  return {
    notEnoughLiquidity: false,
    amountIn: amountInWithFees,
    amountOut: outputAmount,
    minAmountOut,
    feeAmount,
    priceImpact,
  };
}

const calc_d = ({ pool }: { pool: RefFinanceStablePool }) => {
  const { amp, cAmountReserves } = pool;
  const token_num = cAmountReserves.size;
  const numReserves = Array.from(cAmountReserves.values()).map((v) => +v.toString());
  const sum_amounts = numReserves.reduce((acc, amount) => acc + amount, 0);
  let d_prev = 0;
  let d = sum_amounts;

  for (let i = 0; i < 256; i++) {
    let d_prod = d;

    for (const c_amount of numReserves) {
      d_prod = (d_prod * d) / (c_amount * token_num);
    }

    d_prev = d;
    const ann = amp * token_num ** token_num;
    const numerator = d_prev * (d_prod * token_num + ann * sum_amounts);
    const denominator = d_prev * (ann - 1) + d_prod * (token_num + 1);
    d = numerator / denominator;
    if (Math.abs(d - d_prev) <= 1) break;
  }

  return d;
};
const calc_y = ({ pool, x_c_amount, tokenInId, tokenOutId }) => {
  const token_num = pool.cAmountReserves.size;
  const ann = pool.amp * token_num ** token_num;
  const d = calc_d({
    pool,
  });
  let s = x_c_amount;
  let c = (d * d) / x_c_amount; // need for 3-token pools

  for (const [token, amount] of pool.cAmountReserves) {
    if (token !== tokenInId && token !== tokenOutId) {
      const numAmount = +amount.toString();
      s += numAmount;
      c = (c * d) / numAmount;
    }
  }

  c = (c * d) / (ann * token_num ** token_num);
  const b = d / ann + s;
  let y_prev = 0;
  let y = d;

  for (let i = 0; i < 256; i++) {
    y_prev = y;
    const y_numerator = y ** 2 + c;
    const y_denominator = 2 * y + b - d;
    y = y_numerator / y_denominator;
    if (Math.abs(y - y_prev) <= 1) break;
  }

  return y;
};
const FEE_DIVISOR = 10000;

const tradeFee = (amount, trade_fee) => {
  return JSBI.divide(JSBI.multiply(amount, trade_fee), JSBI.BigInt(FEE_DIVISOR));
};

function calc_swap({ pool, tokenInId, tokenOutId, amountIn }) {
  const inputTokenBalance = pool.cAmountReserves.get(tokenInId) || "0";
  const y = calc_y({
    pool,
    x_c_amount: +JSBI.add(amountIn, JSBI.BigInt(inputTokenBalance)).toString(),
    tokenInId,
    tokenOutId,
  });
  const outputTokenBalance = pool.cAmountReserves.get(tokenOutId) || "0";
  const amountOut = JSBI.BigInt(+outputTokenBalance.toString() - y);
  const fee = tradeFee(amountOut, JSBI.BigInt(pool.total_fee));
  const amountOutLessFees = JSBI.subtract(amountOut, fee);
  return [amountOutLessFees, fee];
} // TODO: add output types

interface IOGetStableAmount_Input {
  tokenInId: string;
  tokenOutId: string;
  slippage: Percentage;
  amountIn: JSBI;
  stablePool: RefFinanceStablePool;
}

interface IOGetStableAmount_Output {
  amountIn: JSBI;
  amountOut: JSBI;
  minAmountOut: JSBI;
  feeAmount: JSBI;
  notEnoughLiquidity: boolean;
  priceImpact: number;
}

function getStableOutputAmount({
  tokenInId,
  tokenOutId,
  slippage,
  amountIn,
  stablePool,
}: IOGetStableAmount_Input): IOGetStableAmount_Output {
  // hardcoded decimals for tokens in pool
  const STABLE_LP_TOKEN_DECIMALS = stablePool.pool_kind === "STABLE_SWAP" ? 18 : 24;
  const inputTokenDecimals = stablePool.decimals.get(tokenInId) || null;
  const outputTokenDecimals = stablePool.decimals.get(tokenOutId) || null;

  if (inputTokenDecimals === null || outputTokenDecimals === null) {
    console.error({
      inputTokenDecimals,
      outputTokenDecimals,
      stablePool,
      tokenInId,
      tokenOutId,
    });
    throw new Error("No info about decimals of tokens");
  } // amount * rate / stable lp

  const updatedCReservesNum = Array.from(stablePool.cAmountReserves.entries()).map(
    ([tokenId, amount]) => {
      const rate = stablePool.rates.get(tokenId) || null;

      if (!rate) {
        throw new Error("No rate for token");
      }

      return [
        tokenId,
        removeDecimals(
          JSBI.multiply(amount as unknown as JSBI, rate as unknown as JSBI),
          STABLE_LP_TOKEN_DECIMALS,
        ),
      ];
    },
  );
  const updatedCReserves = updatedCReservesNum.reduce(
    (acc, [tokenId, amount]) => acc.set(tokenId, amount),
    new Map(),
  );
  const updatedStablePool = {
    ...stablePool,
    cAmountReserves: updatedCReserves,
  }; // change decimals from one to another

  const amountInWithHardcodedDecimals = changeDecimals(
    amountIn,
    inputTokenDecimals,
    STABLE_LP_TOKEN_DECIMALS,
  );
  const inputPoolBalance = updatedCReserves.get(tokenInId) || ZERO;
  const outputPoolBalance = updatedCReserves.get(tokenOutId) || ZERO;

  if (JSBI.equal(inputPoolBalance, ZERO) || JSBI.equal(outputPoolBalance, ZERO)) {
    return {
      amountIn,
      amountOut: ZERO,
      minAmountOut: ZERO,
      feeAmount: ZERO,
      notEnoughLiquidity: true,
      priceImpact: 0,
    };
  }

  const [amount_swapped, fee] = calc_swap({
    tokenInId,
    amountIn: amountInWithHardcodedDecimals,
    tokenOutId,
    pool: updatedStablePool,
  });
  const rateIn = stablePool.rates.get(tokenInId) || null;
  const rateOut = stablePool.rates.get(tokenOutId) || null;

  if (!rateIn || !rateOut) {
    throw new Error("No rate for in or out token");
  }

  const amountOutWithRate = JSBI.divide(
    addDecimals(amount_swapped, STABLE_LP_TOKEN_DECIMALS),
    rateOut as unknown as JSBI,
  );
  const feeWithRate = JSBI.divide(
    addDecimals(fee, STABLE_LP_TOKEN_DECIMALS),
    rateOut as unknown as JSBI,
  );
  const amountOutWithTokenDecimals = changeDecimals(
    amountOutWithRate,
    STABLE_LP_TOKEN_DECIMALS,
    outputTokenDecimals,
  );
  const feeAmountWithTokenDecimals = changeDecimals(
    feeWithRate,
    STABLE_LP_TOKEN_DECIMALS,
    outputTokenDecimals,
  );
  const minAmountOut = slippage.getFor(amountOutWithTokenDecimals);
  const marketPrice = +rateOut.toString() / +rateIn.toString();
  const newMarketPrice = +amountInWithHardcodedDecimals.toString() / +amount_swapped.toString();
  const priceImpact = (newMarketPrice - marketPrice) / newMarketPrice;
  return {
    notEnoughLiquidity: false,
    amountIn,
    amountOut: amountOutWithTokenDecimals,
    minAmountOut,
    feeAmount: feeAmountWithTokenDecimals,
    priceImpact,
  };
} // TODO: separate & pass swap func as param

const createSwapOptions = (params) => {
  const {
    stablePool,
    tokenInId,
    tokenOutId,
    slippage,
    minAmount,
    maxAmount,
    numberOfSteps = 200,
  } = params;
  const stepSize = JSBI.divide(JSBI.subtract(maxAmount, minAmount), JSBI.BigInt(numberOfSteps));
  const swapOptions = Array.from(Array(numberOfSteps).keys())
    .map((v) => v + 1)
    .map((iteration) => {
      const amountIn = JSBI.add(minAmount, JSBI.multiply(stepSize, JSBI.BigInt(iteration)));
      const { notEnoughLiquidity, amountOut, minAmountOut, feeAmount, priceImpact } =
        getStableOutputAmount({
          amountIn,
          tokenOutId,
          tokenInId,
          slippage,
          stablePool,
        });
      return {
        priceImpact,
        notEnoughLiquidity,
        amountIn,
        amountOut,
        minAmountOut,
        feeAmount,
      };
    });
  return swapOptions;
};

interface IOFindBestOption_Input extends Omit<IOGetStableAmount_Input, "amountIn"> {
  amountIn?: JSBI;
  outputAmount: JSBI;
  appproxInputAmount: JSBI;
  minAmountMultiplier?: number;
  maxAmountMultiplier?: number;
  numberOfSteps?: number;
}

interface IBestOption {
  feeAmount: JSBI;
  swapAmountOutDiff: JSBI;
  amountIn: JSBI;
  amountOut: JSBI;
  minAmountOut: JSBI;
  priceImpact: number;
  notEnoughLiquidity: boolean;
}

const findBestOption = (params: IOFindBestOption_Input): IBestOption => {
  const {
    stablePool,
    tokenInId,
    tokenOutId,
    outputAmount,
    slippage,
    appproxInputAmount,
    minAmountMultiplier = 0,
    maxAmountMultiplier = 2,
    numberOfSteps = 200,
  } = params;
  const minAmount = removeDecimals(
    JSBI.multiply(appproxInputAmount, JSBI.BigInt(minAmountMultiplier * 10 ** 3)),
    3,
  );
  const maxAmount = removeDecimals(
    JSBI.multiply(appproxInputAmount, JSBI.BigInt(maxAmountMultiplier * 10 ** 3)),
    3,
  ); // create array of results swapping tokenA-tokenB and tokenB-tokenA

  const swapResults = createSwapOptions({
    stablePool,
    tokenInId,
    tokenOutId,
    slippage,
    minAmount,
    maxAmount,
    numberOfSteps,
  }); // take the closes one to pool amount ratio - user amount ratio

  const swapAmounts = swapResults
    .map((ratios) => {
      const { amountOut } = ratios;
      const swapAmountOutDiff = JSBI.subtract(amountOut, outputAmount);
      const absDiff = JSBI.lessThan(swapAmountOutDiff, ZERO)
        ? JSBI.unaryMinus(swapAmountOutDiff)
        : swapAmountOutDiff;
      return { ...ratios, swapAmountOutDiff: absDiff };
    })
    .sort((ratioA, ratioB) =>
      JSBI.equal(ratioA.swapAmountOutDiff, ratioB.swapAmountOutDiff)
        ? 0
        : JSBI.lessThan(ratioA.swapAmountOutDiff, ratioB.swapAmountOutDiff)
          ? -1
          : 1,
    );
  return swapAmounts[0];
}; // TODO: update this method to do it by calculations, not searching the best match

const getStableInputAmount = ({
  tokenInId,
  tokenOutId,
  amountOut,
  slippage,
  stablePool,
}: IOGetStableAmount_Input & { amountOut: JSBI }): IBestOption => {
  // we expect that it's almost the same
  const appproxInputAmount = amountOut;
  let bestOption: null | IBestOption = null;
  const numberOfIterations = 2;

  for (let i = 0; i < numberOfIterations; i += 1) {
    if (!bestOption) {
      bestOption = findBestOption({
        stablePool,
        tokenInId,
        tokenOutId,
        slippage,
        outputAmount: amountOut,
        appproxInputAmount,
        numberOfSteps: 200,
      });
    } else {
      bestOption = findBestOption({
        stablePool,
        tokenInId,
        tokenOutId,
        slippage,
        outputAmount: amountOut,
        appproxInputAmount: bestOption.amountIn,
        minAmountMultiplier: 0.95,
        maxAmountMultiplier: 1.05,
        numberOfSteps: 200,
      });
    }
  }

  if (!bestOption) {
    throw new Error("No best option for getInputAmount");
  }

  return bestOption;
};

class Jumbo {
  id: string;
  contractId: string;
  instanceId: number;
  label: string;
  pool: RefFinancePool;
  isSimplePool: boolean;
  reserves: Reserves;

  constructor(pool: RefFinancePool) {
    this.label = "Jumbo";
    this.id = `${pool.id}`;
    this.contractId = JUMBO_ID;
    this.instanceId = pool.id;
    this.pool = pool;
    this.isSimplePool = pool.pool_kind === "SIMPLE_POOL";
    this.reserves = pool.reserves;
  }

  static async loadPools({ provider }) {
    try {
      const { simplePools, stablePools } = await loadAllPools({
        provider,
        ammId: JUMBO_ID,
      });
      const mostLiquidPools = filterMostLiquidUniqPools(simplePools);
      return [...mostLiquidPools, ...stablePools].map((pool) => new Jumbo(pool));
    } catch (e) {
      console.log("Error loading pools for Ref Finance", e);
    }

    return [];
  }

  getQuote(quoteParams) {
    const { inputMint, outputMint, amount, slippage, swapMode } = quoteParams;
    const feePct = this.pool.total_fee / 10000;

    if (swapMode === SwapMode.ExactIn) {
      if (this.isSimplePool) {
        const { notEnoughLiquidity, amountIn, amountOut, minAmountOut, feeAmount, priceImpact } =
          getOutputAmount({
            reserves: this.pool.reserves,
            poolFee: this.pool.total_fee,
            inputMint,
            outputMint,
            inputAmount: amount,
            slippage,
          });
        return {
          notEnoughLiquidity,
          amountIn,
          amountOut,
          minAmountOut,
          feePct,
          feeMint: inputMint,
          feeAmount,
          priceImpact,
        };
      } else {
        const { notEnoughLiquidity, amountIn, amountOut, minAmountOut, feeAmount, priceImpact } =
          getStableOutputAmount({
            tokenInId: inputMint,
            tokenOutId: outputMint,
            slippage,
            // @ts-ignore
            stablePool: this.pool,
            amountIn: amount,
          });
        return {
          notEnoughLiquidity,
          amountIn,
          amountOut,
          minAmountOut,
          feePct,
          feeMint: inputMint,
          feeAmount,
          priceImpact,
        };
      }
    } else if (swapMode === SwapMode.ExactOut) {
      if (this.isSimplePool) {
        const { amountIn, amountOut, minAmountOut, feeAmount, priceImpact, notEnoughLiquidity } =
          getInputAmount({
            reserves: this.pool.reserves,
            poolFee: this.pool.total_fee,
            inputMint,
            outputMint,
            outputAmount: amount,
            slippage,
          });
        return {
          notEnoughLiquidity,
          amountIn,
          amountOut,
          minAmountOut,
          feePct,
          feeMint: inputMint,
          feeAmount,
          priceImpact,
        };
      } else {
        const { notEnoughLiquidity, feeAmount, amountIn, amountOut, minAmountOut, priceImpact } =
          getStableInputAmount({
            tokenInId: inputMint,
            tokenOutId: outputMint,
            slippage,
            // @ts-ignore
            stablePool: this.pool,
            amountOut: amount,
          });
        return {
          notEnoughLiquidity,
          amountIn,
          amountOut,
          minAmountOut,
          feePct,
          feeMint: inputMint,
          feeAmount,
          priceImpact,
        };
      }
    }

    throw new Error("Unknown swap mode type");
  }

  async getPromiseForUpdate({ provider }) {
    return loadPool({
      provider,
      ammId: this.contractId,
      poolId: this.instanceId,
      poolKind: this.pool.pool_kind,
    }).then((pool) => {
      this.pool = pool;
    });
  }

  async createSwapInstructions(params) {
    const { user, swapStep } = params;
    const swapTransactions = await createRefTransactions({
      user,
      swapSteps: [swapStep],
    });
    console.log("swapTransactions", swapTransactions);
    return swapTransactions;
  }

  async createSwapRouteInstructions(params) {
    const { user, swapRoute } = params;
    const swapTransactions = await createRefTransactions({
      user,
      swapSteps: swapRoute.steps,
    });
    console.log("swapTransactions", swapTransactions);
    return swapTransactions;
  }

  get reserveTokenMints() {
    return this.pool.token_account_ids;
  }
}

class RefFinance {
  label: string;
  id: string;
  contractId: string;
  instanceId: number;
  pool: RefFinancePool;
  isSimplePool: boolean;

  constructor(pool) {
    this.label = "Ref.Finance";
    this.id = `${pool.id}`;
    this.contractId = REF_FINANCE_ID;
    this.instanceId = pool.id;
    this.pool = pool;
    this.isSimplePool = pool.pool_kind === "SIMPLE_POOL";
  }

  static async loadPools({ provider }: { provider: JsonRpcProvider }) {
    try {
      const { simplePools, stablePools } = await loadAllPools({
        provider,
        ammId: REF_FINANCE_ID,
      });
      const mostLiquidSimplePools = filterMostLiquidUniqPools(simplePools);
      return [...mostLiquidSimplePools, ...stablePools].map((pool) => new RefFinance(pool));
    } catch (e) {
      console.log("Error loading pools for Ref Finance", e);
    }

    return [];
  }

  getQuote(quoteParams) {
    const { inputMint, outputMint, amount, slippage, swapMode } = quoteParams;
    const feePct = this.pool.total_fee / 10000;

    if (swapMode === SwapMode.ExactIn) {
      if (this.isSimplePool) {
        const { notEnoughLiquidity, amountIn, amountOut, minAmountOut, feeAmount, priceImpact } =
          getOutputAmount({
            reserves: this.pool.reserves,
            poolFee: this.pool.total_fee,
            inputMint,
            outputMint,
            inputAmount: amount,
            slippage,
          });
        return {
          notEnoughLiquidity,
          amountIn,
          amountOut,
          minAmountOut,
          feePct,
          feeMint: inputMint,
          feeAmount,
          priceImpact,
        };
      } else {
        const { notEnoughLiquidity, amountIn, amountOut, minAmountOut, feeAmount, priceImpact } =
          getStableOutputAmount({
            tokenInId: inputMint,
            tokenOutId: outputMint,
            slippage,
            // @ts-ignore
            stablePool: this.pool,
            amountIn: amount,
          });
        return {
          notEnoughLiquidity,
          amountIn,
          amountOut,
          minAmountOut,
          feePct,
          feeMint: inputMint,
          feeAmount,
          priceImpact,
        };
      }
    } else if (swapMode === SwapMode.ExactOut) {
      if (this.isSimplePool) {
        const { amountIn, amountOut, minAmountOut, feeAmount, priceImpact, notEnoughLiquidity } =
          getInputAmount({
            reserves: this.pool.reserves,
            poolFee: this.pool.total_fee,
            inputMint,
            outputMint,
            outputAmount: amount,
            slippage,
          });
        return {
          notEnoughLiquidity,
          amountIn,
          amountOut,
          minAmountOut,
          feePct,
          feeMint: inputMint,
          feeAmount,
          priceImpact,
        };
      } else {
        const { notEnoughLiquidity, feeAmount, amountIn, amountOut, minAmountOut, priceImpact } =
          getStableInputAmount({
            tokenInId: inputMint,
            tokenOutId: outputMint,
            slippage,
            // @ts-ignore
            stablePool: this.pool,
            amountOut: amount,
          });
        return {
          notEnoughLiquidity,
          amountIn,
          amountOut,
          minAmountOut,
          feePct,
          feeMint: inputMint,
          feeAmount,
          priceImpact,
        };
      }
    }

    throw new Error("Unknown swap mode type");
  }

  async getPromiseForUpdate({ provider }) {
    return loadPool({
      provider,
      ammId: this.contractId,
      poolId: this.instanceId,
      poolKind: this.pool.pool_kind,
    }).then((pool) => {
      this.pool = pool;
    });
  }

  async createSwapInstructions(params) {
    const { user, swapStep } = params;
    const swapTransactions = await createRefTransactions({
      user,
      swapSteps: [swapStep],
    });
    console.log("swapTransactions", swapTransactions);
    return swapTransactions;
  }

  async createSwapRouteInstructions(params) {
    const { user, swapRoute } = params;
    const swapTransactions = await createRefTransactions({
      user,
      swapSteps: swapRoute.steps,
    });
    console.log("swapTransactions", swapTransactions);
    return swapTransactions;
  }

  get reserveTokenMints() {
    return this.pool.token_account_ids;
  }
}

const SLIPPAGE_NUMERATOR = 10000;
const SLIPPAGE_DENOMINATOR = 1000000;
const FEE_BPS_DENOMINATOR = 100000;

class Percentage {
  numerator: JSBI;
  denominator: JSBI;

  constructor(numerator: JSBI, denominator: JSBI) {
    this.toString = () => {
      return `${this.numerator.toString()}/${this.denominator.toString()}`;
    };

    this.numerator = numerator;
    this.denominator = denominator;
  }

  static fromSlippageNumber(num) {
    return new Percentage(JSBI.BigInt(num * SLIPPAGE_NUMERATOR), JSBI.BigInt(SLIPPAGE_DENOMINATOR));
  }

  static fromFeeBpsNumber(num) {
    return new Percentage(JSBI.BigInt(num), JSBI.BigInt(FEE_BPS_DENOMINATOR));
  }

  getFor(amount) {
    const numerator = JSBI.BigInt(this.numerator.toString());
    const denominator = JSBI.BigInt(this.denominator.toString());
    return JSBI.divide(JSBI.multiply(amount, JSBI.subtract(denominator, numerator)), denominator);
  }

  getFrom(amount) {
    const numerator = JSBI.BigInt(this.numerator.toString());
    const denominator = JSBI.BigInt(this.denominator.toString());
    return JSBI.divide(JSBI.multiply(amount, numerator), denominator);
  }
}

interface IOLoadAccountStorageBalanceForToken_Output {
  tokenId: string;
  existing: boolean;
  storageBalance: any;
}

const loadAccountStorageBalance = async ({
  provider,
  tokenId,
  tokenOwnerId,
}: {
  provider: JsonRpcProvider;
  tokenId: string;
  tokenOwnerId: string;
}): Promise<IOLoadAccountStorageBalanceForToken_Output> => {
  if (!tokenId || !tokenOwnerId) {
    console.error(
      "No token id or token owner id for loading account storage balance",
      `tokenId: ${tokenId}`,
      `tokenOwnerId: ${tokenOwnerId}`,
    );
    return {
      tokenId,
      existing: false,
      storageBalance: null,
    };
  }

  const res = await provider
    .query<any>({
      request_type: "call_function",
      account_id: tokenId,
      method_name: "storage_balance_of",
      args_base64: Buffer.from(
        JSON.stringify({
          account_id: tokenOwnerId,
        }),
      ).toString("base64"),
      finality: "optimistic",
    })
    .then((res) => JSON.parse(Buffer.from(res.result).toString()));
  return {
    tokenId,
    existing: res !== null,
    storageBalance: res,
  };
};

async function registerToken(provider, tokenId, user) {
  const tokenOutActions = new Array();
  const { storageBalance: tokenRegistered } = await loadAccountStorageBalance({
    provider,
    tokenId,
    tokenOwnerId: user,
  });

  if (tokenRegistered) {
    return undefined;
  }

  tokenOutActions.push({
    type: "FunctionCall",
    params: {
      methodName: "storage_deposit",
      args: {
        registration_only: true,
        account_id: user,
      },
      gas: DEFAULT_GAS,
      deposit: STORAGE_TO_REGISTER_WITH_MFT,
    },
  });
  return {
    receiverId: tokenId,
    signerId: user,
    actions: tokenOutActions,
  };
}

const builDepositNearActions = async (account: Account, amount: JSBI) => {
  const actions = new Array();
  const registerTokenTx = await registerToken(
    account.connection.provider,
    WRAPPED_NEAR_ID,
    account.accountId,
  );
  let deposit = amount;

  if (registerTokenTx) {
    actions.push(...registerTokenTx.actions);
  } else {
    const balance = await account.viewFunction({
      contractId: WRAPPED_NEAR_ID,
      methodName: "ft_balance_of",
      args: {
        account_id: account.accountId,
      },
    });

    if (JSBI.greaterThanOrEqual(JSBI.BigInt(balance), deposit)) {
      return [];
    }

    console.log("NEAR account found, balance:", balance);
    deposit = JSBI.subtract(amount, JSBI.BigInt(balance));
  }

  actions.push({
    type: "FunctionCall",
    params: {
      methodName: "near_deposit",
      args: {},
      gas: DEFAULT_GAS,
      deposit: deposit.toString(),
    },
  });
  return actions;
};
const buildDepositNearTransaction = async (account: Account, amount: JSBI) => {
  const transaction = {
    receiverId: WRAPPED_NEAR_ID,
    signerId: account.accountId,
    actions: await builDepositNearActions(account, amount),
  };
  return transaction;
};

const buildWithdrawNearActions = async (amount: JSBI): Promise<Action[]> => {
  const actions: Action[] = [];
  const withdrawAmount = amount.toString();
  actions.push({
    type: "FunctionCall",
    params: {
      methodName: "near_withdraw",
      args: {
        amount: withdrawAmount,
      },
      gas: DEFAULT_GAS,
      deposit: "1",
    },
  }); // TBD: close wrapped account/return deposit

  return actions;
};
const buildWithdrawNearTransaction = async (signerId: string, amount: JSBI) => {
  const transaction = {
    receiverId: WRAPPED_NEAR_ID,
    signerId,
    actions: await buildWithdrawNearActions(amount),
  };
  return transaction;
};

const callFunction = async (params) => {
  const { provider, accountId, method, args = {} } = params;
  const response = await provider.query({
    request_type: "call_function",
    account_id: accountId,
    method_name: method,
    args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
    finality: "optimistic",
  });
  const parsedResponse = JSON.parse(Buffer.from(response.result).toString());
  return parsedResponse;
};

const SPIN_CONTRACT_ADDRESS = "spot.spin-fi.near";

const NATIVE_NEAR_ADDRESS = "near.near";

class SpinFinanceMarket {
  rawMarket: SpinMarketResponse;
  id: string;
  reserveTokenMints: string[];
  instanceId: number;
  label: string;
  contractId: string;
  orderBook?: SpinMarketOrderbookResponse;

  constructor(rawMarket: SpinMarketResponse) {
    this.rawMarket = rawMarket;
    this.label = "Spin Finance";
    this.contractId = SPIN_CONTRACT_ADDRESS;
    this.orderBook = undefined;
    this.id = `${rawMarket.id}`;
    this.instanceId = rawMarket.id; // Pass wrapped near to the router

    this.reserveTokenMints = [rawMarket.base.address, rawMarket.quote.address].map((_) =>
      _ === NATIVE_NEAR_ADDRESS ? WRAPPED_NEAR_ID : _,
    );
  }

  static async loadUserDeposits({ user, provider }) {
    const deposits = await callFunction({
      provider,
      accountId: SPIN_CONTRACT_ADDRESS,
      method: "get_deposits",
      args: {
        account_id: user,
      },
    });
    return deposits;
  }

  static createWithdrawFromDepositsTransaction({ user, token, amount }) {
    const isNearToken = token === NATIVE_NEAR_ADDRESS;
    const transaction = {
      receiverId: SPIN_CONTRACT_ADDRESS,
      signerId: user,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "withdraw",
            args: {
              token: isNearToken ? NATIVE_NEAR_ADDRESS : token,
              amount,
            },
            gas: DEFAULT_GAS,
            deposit: isNearToken ? "0" : "1",
          },
        },
      ],
    }; // @ts-ignore

    return transaction;
  }

  async createSwapInstructions(swapParams) {
    const { user, swapStep, provider } = swapParams;
    const transactions: any[] = [];
    const deposits = await SpinFinanceMarket.loadUserDeposits({
      user,
      provider,
    });
    const inputDepositToken =
      swapStep.inputMint === WRAPPED_NEAR_ID ? NATIVE_NEAR_ADDRESS : swapStep.inputMint;
    const existingAmount = JSBI.BigInt(deposits[inputDepositToken] || "0");
    const { address: baseAddress } = this.rawMarket.base;
    const { address: quoteAddress } = this.rawMarket.quote;
    const isSellBase =
      baseAddress === swapStep.inputMint ||
      (baseAddress === NATIVE_NEAR_ADDRESS && swapStep.inputMint === WRAPPED_NEAR_ID);
    const isNativeMarket =
      baseAddress === NATIVE_NEAR_ADDRESS || quoteAddress === NATIVE_NEAR_ADDRESS; // Deposit if not enough

    if (JSBI.lessThan(existingAmount, swapStep.amountIn)) {
      const amountToAdd = JSBI.subtract(swapStep.amountIn, existingAmount); // Deposit native NEAR

      if (isNativeMarket && swapStep.inputMint === WRAPPED_NEAR_ID) {
        // Unwrap wrapped NEAR
        transactions.push(await buildWithdrawNearTransaction(user, amountToAdd)); // Deposit near

        transactions.push({
          receiverId: SPIN_CONTRACT_ADDRESS,
          signerId: user,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "deposit_near",
                args: {},
                gas: DEFAULT_GAS,
                deposit: amountToAdd.toString(),
              },
            },
          ],
        });
      } else {
        // Deposit FT
        transactions.push({
          receiverId: swapStep.inputMint,
          signerId: user,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "ft_transfer_call",
                args: {
                  receiver_id: SPIN_CONTRACT_ADDRESS,
                  amount: amountToAdd.toString(),
                  msg: "",
                },
                gas: DEFAULT_GAS,
                deposit: "1",
              },
            },
          ],
        });
      }
    }

    const methodName = isSellBase ? "place_ask" : "place_bid";
    const quoteNominator = 10 ** this.rawMarket.quote.decimal;
    const orderStep = new Decimal(this.rawMarket.limits.step_size);
    let quantity = new Decimal((isSellBase ? swapStep.amountIn : swapStep.minAmountOut).toString())
      .div(orderStep)
      .floor()
      .mul(orderStep); // if we buy base then quantity is what we'll receive, but spin fi
    // charge fee from amount out, that's why we need to add it here

    if (!isSellBase) {
      quantity = quantity.add(swapStep.feeAmount.toString()).div(orderStep).ceil().mul(orderStep);
    }

    const quoteAmount = new Decimal(
      (isSellBase ? swapStep.minAmountOut : swapStep.amountIn).toString(),
    ).div(quoteNominator);
    const tickSize = new Decimal(this.rawMarket.limits.tick_size);
    const price = quoteAmount
      .mul(quoteNominator)
      .div(tickSize)
      .div(quantity.div(10 ** this.rawMarket.base.decimal))
      .floor()
      .mul(tickSize); // Place market order

    transactions.push({
      receiverId: SPIN_CONTRACT_ADDRESS,
      signerId: user,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName,
            args: {
              market_id: this.rawMarket.id,
              price: price.ceil().toFixed(0),
              quantity: quantity.toFixed(0),
              market_order: true,
              memo: MEMO,
            },
            gas: DEFAULT_GAS,
            deposit: "0",
          },
        },
      ],
    });
    const withdrawAmount = swapStep.minAmountOut.toString();
    const withdrawToken =
      swapStep.outputMint === WRAPPED_NEAR_ID ? NATIVE_NEAR_ADDRESS : swapStep.outputMint; // Withdraw

    transactions.push(
      SpinFinanceMarket.createWithdrawFromDepositsTransaction({
        user,
        token: withdrawToken,
        amount: withdrawAmount,
      }),
    );

    if (isNativeMarket && swapStep.outputMint === WRAPPED_NEAR_ID) {
      // Wrap NEAR back
      transactions.push({
        receiverId: WRAPPED_NEAR_ID,
        signerId: user,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "near_deposit",
              args: {},
              gas: DEFAULT_GAS,
              deposit: withdrawAmount,
            },
          },
        ],
      });
    }

    return transactions;
  }

  async createSwapRouteInstructions(swapParams) {
    const { provider, user, swapRoute } = swapParams;
    const transactions: any[] = [];

    for (let routeStep of swapRoute.steps) {
      const stepTransactions = await routeStep.amm.createSwapInstructions({
        provider,
        user,
        swapStep: routeStep,
      });
      transactions.push(...stepTransactions);
    }

    return transactions;
  }

  async getPromiseForUpdate({ provider }) {
    try {
      const orderBook = await callFunction({
        provider,
        accountId: SPIN_CONTRACT_ADDRESS,
        method: "get_orderbook",
        args: {
          market_id: this.rawMarket.id,
          limit: 100,
        },
      });
      this.orderBook = orderBook;
    } catch (e) {
      console.log("error getPromiseForUpdate spin for market", this.rawMarket.id);
    }
  }

  getQuote(quoteParams) {
    if (!this.orderBook) {
      throw new Error(`Order book for market ${this.rawMarket.ticker} is not loaded`);
    }

    const isSellBase =
      quoteParams.inputMint === this.rawMarket.base.address ||
      (quoteParams.inputMint === WRAPPED_NEAR_ID &&
        this.rawMarket.base.address === NATIVE_NEAR_ADDRESS);
    const side = isSellBase ? this.orderBook.bid_orders : this.orderBook.ask_orders;
    const isAmountInBase =
      (isSellBase && quoteParams.swapMode === SwapMode.ExactIn) ||
      (!isSellBase && quoteParams.swapMode === SwapMode.ExactOut);
    let restUserAmount = new Decimal(quoteParams.amount.toString());
    let amountIn = new Decimal(0);
    let amountOut = new Decimal(0);
    const baseMultiplier = new Decimal(10).pow(this.rawMarket.base.decimal);
    const stepSize = new Decimal(this.rawMarket.limits.step_size);
    const fee = new Decimal(this.rawMarket.fees.taker_fee).div(10 ** this.rawMarket.fees.decimals);

    for (const order of side) {
      const price = new Decimal(order.price);
      const restAmountInBase = isAmountInBase
        ? restUserAmount.div(stepSize).floor().mul(stepSize)
        : restUserAmount.mul(baseMultiplier).div(price).div(stepSize).floor().mul(stepSize);
      const orderAmount = new Decimal(order.quantity);
      const takeFromLevelInBase = Decimal.min(restAmountInBase, orderAmount);
      const takeFromLevelInQuote = takeFromLevelInBase.mul(price).div(baseMultiplier);
      amountIn = isSellBase
        ? amountIn.add(takeFromLevelInBase)
        : amountIn.add(takeFromLevelInQuote);
      amountOut = isSellBase
        ? amountOut.add(takeFromLevelInQuote)
        : amountOut.add(takeFromLevelInBase);
      const feeAmount = amountOut.mul(fee);
      const amountOutLessFee = amountOut.sub(feeAmount).floor();
      let minAmountOut = new Decimal(
        quoteParams.slippage.getFor(JSBI.BigInt(amountOutLessFee.floor().toString())).toString(),
      ); // after removing slippage part requires to be stripped

      if (!isSellBase) {
        minAmountOut = minAmountOut.div(stepSize).floor().mul(stepSize);
      }

      restUserAmount = restUserAmount.sub(
        isAmountInBase ? takeFromLevelInBase : takeFromLevelInQuote,
      );

      if (takeFromLevelInBase.lessThanOrEqualTo(0)) {
        const amountInBase = isSellBase ? amountIn : minAmountOut;
        const amountInQuote = isSellBase ? minAmountOut : amountIn; // check market limits for base token

        const isAmountInBaseGreaterMinLimit = amountInBase.greaterThanOrEqualTo(
          new Decimal(this.rawMarket.limits.min_base_quantity),
        );
        const isAmountInBaseLessMaxLimit = amountInBase.lessThanOrEqualTo(
          new Decimal(this.rawMarket.limits.max_base_quantity),
        ); // check market limits for quote token

        const isAmountInQuoteGreaterMinLimit = amountInQuote.greaterThanOrEqualTo(
          new Decimal(this.rawMarket.limits.min_quote_quantity),
        );
        const isAmountInQuoteLessMaxLimit = amountInQuote.lessThanOrEqualTo(
          new Decimal(this.rawMarket.limits.max_quote_quantity),
        );
        return {
          amountIn: JSBI.BigInt(amountIn.floor().toString()),
          amountOut: JSBI.BigInt(amountOutLessFee.floor().toString()),
          minAmountOut: JSBI.BigInt(minAmountOut.floor().toString()),
          feeAmount: JSBI.BigInt(feeAmount.floor().toString()),
          feeMint: quoteParams.outputMint,
          feePct: parseFloat(this.rawMarket.fees.taker_fee) / 10 ** this.rawMarket.base.decimal,
          notEnoughLiquidity: !(
            isAmountInBaseGreaterMinLimit &&
            isAmountInBaseLessMaxLimit &&
            isAmountInQuoteGreaterMinLimit &&
            isAmountInQuoteLessMaxLimit
          ),
          priceImpact: 0,
        };
      }
    }

    const feeAmount = amountOut.mul(fee);
    return {
      amountIn: JSBI.BigInt(amountIn.floor().toString()),
      amountOut: JSBI.BigInt(amountOut.sub(feeAmount).floor().toString()),
      minAmountOut: quoteParams.slippage.getFor(JSBI.BigInt(amountOut.floor().toString())),
      feeAmount: JSBI.BigInt(feeAmount.floor().toString()),
      feeMint: quoteParams.inputMint,
      feePct: parseFloat(this.rawMarket.fees.taker_fee) / 10 ** this.rawMarket.base.decimal,
      notEnoughLiquidity: true,
      priceImpact: 0,
    };
  }

  static async loadMarkets(params) {
    const { provider } = params;
    const markets = await callFunction({
      accountId: SPIN_CONTRACT_ADDRESS,
      method: "get_markets",
      provider,
    });
    return markets.map((market) => new SpinFinanceMarket(market));
  }
}

const TONIC_FEE_DIVISOR = 10000; // By design

const roundForStep = (n, step, up = false) => {
  JSBI.BigInt(step);

  if (up) {
    return n.div(step).ceil().mul(step);
  }

  return n.div(step).floor().mul(step);
};

class TonicFoundationMarket {
  market: TonicMarketResponse;
  id: string;
  label: string;
  contractId: string;
  orderBook: TonicOrderBookResponse;
  instanceId: number;
  reserveTokenMints: string[];

  constructor(market: TonicMarketResponse) {
    this.market = market;
    this.label = "Tonic";
    this.contractId = TONIC_ID;
    this.id = this.market.id;
    this.instanceId = Math.round(Math.random() * 1000000); // Tonic doesn't have an instance id

    this.orderBook = this.market.orderbook;
    this.reserveTokenMints = [
      this.market.base_token.token_type.type === "ft"
        ? this.market.base_token.token_type.account_id
        : WRAPPED_NEAR_ID,
      this.market.quote_token.token_type.type === "ft"
        ? this.market.quote_token.token_type.account_id
        : WRAPPED_NEAR_ID,
    ];
  }

  async getPromiseForUpdate({ provider }) {
    const orderBook = await callFunction({
      accountId: TONIC_ID,
      method: "get_orderbook",
      args: {
        market_id: this.id,
        depth: 128,
      },
      provider,
    });
    this.orderBook = orderBook;
  }

  resolveQuote(params) {
    const {
      amountOut,
      amountIn,
      fee,
      slippage,
      stepSize,
      outputMint,
      notEnoughLiquidity,
      swapMode,
      isSellBase,
    } = params;
    const feeAmount = amountOut.mul(fee);
    const outputWithoutFees = amountOut.sub(feeAmount).floor().toString();
    const outputWithoutFeesBI = JSBI.BigInt(outputWithoutFees);
    const amountInRounded = swapMode === SwapMode.ExactIn ? amountIn.floor() : amountIn.ceil();
    const inputResult = isSellBase
      ? roundForStep(amountInRounded, stepSize.toString(), swapMode === SwapMode.ExactOut)
      : amountInRounded;
    const outputResult = isSellBase
      ? new Decimal(outputWithoutFeesBI.toString())
      : roundForStep(new Decimal(outputWithoutFeesBI.toString()), stepSize.toString());
    const minOutputResult = isSellBase
      ? new Decimal(slippage.getFor(outputWithoutFeesBI).toString())
      : roundForStep(
          new Decimal(slippage.getFor(outputWithoutFeesBI).toString()),
          stepSize.toString(),
        );
    return {
      amountIn: JSBI.BigInt(inputResult.floor().toString()),
      amountOut: JSBI.BigInt(outputResult.floor().toString()),
      minAmountOut: JSBI.BigInt(minOutputResult.floor().toString()),
      feeAmount: JSBI.BigInt(feeAmount.floor().toString()),
      feeMint: outputMint,
      feePct: this.market.taker_fee_base_rate / TONIC_FEE_DIVISOR,
      notEnoughLiquidity,
      priceImpact: 0,
    };
  }

  getQuote(quoteParams) {
    if (!this.orderBook) {
      throw new Error(`Order book for market ${this.market.id} is not loaded`);
    }

    const { inputMint, outputMint, amount, swapMode } = quoteParams;
    const isSellBase =
      (this.market.base_token.token_type.type === "ft" &&
        inputMint === this.market.base_token.token_type.account_id) ||
      (inputMint === WRAPPED_NEAR_ID && this.market.base_token.token_type.type === "near");
    const side = isSellBase ? this.orderBook.bids : this.orderBook.asks;
    const amountInBase =
      (isSellBase && swapMode === SwapMode.ExactIn) ||
      (!isSellBase && swapMode === SwapMode.ExactOut);
    let restUserAmount = new Decimal(amount.toString());
    const fee = new Decimal(this.market.taker_fee_base_rate).div(TONIC_FEE_DIVISOR);

    if (quoteParams.swapMode === SwapMode.ExactOut) {
      restUserAmount = restUserAmount.mul(fee.add(1)); // add fee
    }

    let amountIn = new Decimal(0);
    let amountOut = new Decimal(0);
    const baseMultiplier = new Decimal(10).pow(this.market.base_token.decimals);
    const stepSize = new Decimal(this.market.base_token.lot_size);

    for (const order of side) {
      const price = new Decimal(order.limit_price);
      const restAmountInBase = amountInBase
        ? restUserAmount.div(stepSize).floor().mul(stepSize)
        : restUserAmount.mul(baseMultiplier).div(price);
      const orderAmount = new Decimal(order.open_quantity);
      const takeFromLevelInBase = Decimal.min(restAmountInBase, orderAmount);
      const takeFromLevelInQuote = takeFromLevelInBase.mul(price).div(baseMultiplier);
      amountIn = isSellBase
        ? amountIn.add(takeFromLevelInBase)
        : amountIn.add(takeFromLevelInQuote);
      amountOut = isSellBase
        ? amountOut.add(takeFromLevelInQuote)
        : amountOut.add(takeFromLevelInBase);
      restUserAmount = restUserAmount.sub(
        amountInBase ? takeFromLevelInBase : takeFromLevelInQuote,
      );
      const amountInInBase = isSellBase ? amountIn : amountOut;
      const amountInQuote = isSellBase ? amountOut : amountIn;

      if (takeFromLevelInBase.lessThanOrEqualTo(0)) {
        return this.resolveQuote({
          amountIn,
          amountOut,
          fee,
          stepSize,
          slippage: quoteParams.slippage,
          outputMint: outputMint,
          notEnoughLiquidity:
            !amountInInBase.greaterThanOrEqualTo(new Decimal(this.market.base_token.lot_size)) ||
            !amountInQuote.greaterThanOrEqualTo(new Decimal(this.market.quote_token.lot_size)),
          swapMode: quoteParams.swapMode,
          isSellBase,
        });
      }
    }

    return this.resolveQuote({
      amountIn,
      amountOut,
      fee,
      stepSize,
      slippage: quoteParams.slippage,
      outputMint: outputMint,
      notEnoughLiquidity: true,
      swapMode: quoteParams.swapMode,
      isSellBase,
    });
  }

  async createSwapInstructions(swapParams) {
    const transactions: any[] = [];
    const {
      base_token: {
        token_type: { type: baseType },
      },
      quote_token: {
        token_type: { type: quoteType },
      },
    } = this.market;
    const {
      user,
      swapStep: { amountIn, minAmountOut, inputMint, outputMint },
    } = swapParams;
    const isNativeMarket = baseType === "near" || quoteType === "near";
    const isInputInNative = isNativeMarket && inputMint === WRAPPED_NEAR_ID;
    const isOutputInNative = isNativeMarket && outputMint === WRAPPED_NEAR_ID;
    const side =
      (this.market.base_token.token_type.type === "ft" &&
        inputMint === this.market.base_token.token_type.account_id) ||
      (this.market.base_token.token_type.type === "near" && inputMint === WRAPPED_NEAR_ID)
        ? "Sell"
        : "Buy";
    const swapMessage = {
      action: "Swap",
      params: [
        {
          type: "Swap",
          market_id: this.market.id,
          side,
          min_output_token: minAmountOut.toString(),
        },
      ],
    };

    if (isInputInNative) {
      transactions.push(await buildWithdrawNearTransaction(user, amountIn));
    }

    if (isInputInNative) {
      transactions.push({
        receiverId: TONIC_ID,
        signerId: swapParams.user,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "swap_near",
              args: {
                swaps: swapMessage.params,
              },
              gas: DEFAULT_GAS,
              deposit: amountIn.toString(),
            },
          },
        ],
      });
    } else {
      transactions.push({
        receiverId: inputMint,
        signerId: swapParams.user,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "ft_transfer_call",
              args: {
                receiver_id: TONIC_ID,
                amount: amountIn.toString(),
                msg: JSON.stringify(swapMessage),
                memo: MEMO,
              },
              gas: DEFAULT_GAS,
              deposit: "1",
            },
          },
        ],
      });
    }

    if (isOutputInNative) {
      transactions.push({
        receiverId: WRAPPED_NEAR_ID,
        signerId: user,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "near_deposit",
              args: {},
              gas: DEFAULT_GAS,
              deposit: minAmountOut.toString(),
            },
          },
        ],
      });
    }

    return transactions;
  }

  async createSwapRouteInstructions(swapParams) {
    const { provider, user, swapRoute } = swapParams;
    const transactions: any[] = [];

    for (let routeStep of swapRoute.steps) {
      const stepTransactions = await routeStep.amm.createSwapInstructions({
        provider,
        user,
        swapStep: routeStep,
      });
      transactions.push(...stepTransactions);
    }

    return transactions;
  }

  static async loadMarkets(params) {
    const { provider } = params;
    const markets = await callFunction({
      accountId: TONIC_ID,
      method: "list_markets",
      args: {
        from_index: 0,
        limit: 9999,
      },
      provider,
    });
    return markets
      .filter((market) => market.state === "Active")
      .map((market) => new TonicFoundationMarket(market));
  }
}

const getAllAmms = async (provider) => {
  const refPools = await RefFinance.loadPools({
    provider,
  });
  // const jumboPools = await Jumbo.loadPools({
  //   provider,
  // });
  // const spinMarkets = await SpinFinanceMarket.loadMarkets({
  //   provider,
  // });
  // const tonicMarkets = await TonicFoundationMarket.loadMarkets({
  //   provider,
  // });
  // const amms = [...refPools, ...jumboPools, ...spinMarkets, ...tonicMarkets];
  const amms = refPools;
  return amms;
};

async function updateRoutesPools(provider, routes) {
  const promisesMap = new Map();
  routes.forEach((route) => {
    route.forEach(({ amm }) => {
      promisesMap.set(
        `${amm.label}-${amm.id}`,
        amm.getPromiseForUpdate({
          provider,
        }),
      );
    });
  });
  const promises = Array.from(promisesMap.values()); // console.log('promises number', promises.length);

  await Promise.all(promises);
}

const SUPPORT_MULTI_HOP_AMM_LABELS = ["Ref.Finance", "Jumbo"];

const checkIsMultiHopOnSameAMM = (amms) => {
  const isSameAmmMultiRoute = amms.length > 1 && amms[0].label === amms[1].label; // we have max 2 steps for now

  if (!isSameAmmMultiRoute) {
    return false;
  }

  const isSupported = amms.every((amm) =>
    SUPPORT_MULTI_HOP_AMM_LABELS.some((supportedAmmLabel) => amm.label === supportedAmmLabel),
  );

  return isSupported;
};

const EMPTY_ROUTE_RESPONSE = {
  steps: [],
  inputMint: "",
  outputMint: "",
  amountIn: ZERO,
  amountOut: ZERO,
  minAmountOut: ZERO,
  swapMode: SwapMode.ExactIn,
  notEnoughLiquidity: true,
  priceImpact: 0,
  depositAndNetworkFee: ZERO,
  platformFee: {
    amount: ZERO,
    token: "",
    pct: 0,
  },
};

const createRouteFromExactIn = ({
  route,
  feeBps,
  swapMode,
  amountIn,
  slippage,
  inputMint,
  outputMint,
  userTokensMap,
}) => {
  const swapSteps: SwapStep[] = [];
  const isMultiHopOnSameAMM = checkIsMultiHopOnSameAMM(route.map((step) => step.amm));
  let tempSwapAmountIn = amountIn;
  let index = 0;

  for (const { amm, inputToken, outputToken } of route) {
    if (!amm) {
      return EMPTY_ROUTE_RESPONSE;
    }

    const zeroSlippage = Percentage.fromSlippageNumber(0);
    const slippageToUse = index === 0 && isMultiHopOnSameAMM ? zeroSlippage : slippage;
    const {
      amountIn,
      amountOut,
      minAmountOut,
      feeAmount,
      feeMint,
      priceImpact,
      notEnoughLiquidity,
    } = amm.getQuote({
      inputMint: inputToken,
      outputMint: outputToken,
      amount: tempSwapAmountIn,
      swapMode,
      slippage: slippageToUse,
    });
    swapSteps.push({
      amm,
      inputMint: inputToken,
      outputMint: outputToken,
      amountIn,
      amountOut,
      minAmountOut,
      feeAmount,
      feeMint,
      priceImpact,
      notEnoughLiquidity,
    });
    tempSwapAmountIn = minAmountOut;
    index++;
  }

  const amountOut = swapSteps.length > 0 ? swapSteps[swapSteps.length - 1].amountOut : ZERO;
  const platformFeeAmount = feeBps.getFrom(amountOut); // update only ui value, so we don't reduce min value we want to receive and take part of it

  const amountOutLessPlatformFee = JSBI.subtract(amountOut as unknown as JSBI, platformFeeAmount);
  const minAmountOut = swapSteps.length > 0 ? swapSteps[swapSteps.length - 1].minAmountOut : ZERO;
  const notEnoughLiquidity = swapSteps.some((step) => step.notEnoughLiquidity);
  const commonPriceImpact =
    1 -
    swapSteps.reduce((priceFactor, step) => {
      return priceFactor * (1 - step.priceImpact);
    }, 1);
  const createTokenAccountsFee = swapSteps.reduce((acc, step) => {
    const { existing } = userTokensMap.get(step.outputMint) || {
      existing: false,
    };

    if (!existing) {
      return JSBI.add(acc, JSBI.BigInt(STORAGE_TO_REGISTER_WITH_MFT));
    }

    return acc;
  }, ZERO);
  const transactionsFee = JSBI.multiply(JSBI.BigInt(DEFAULT_GAS), JSBI.BigInt(swapSteps.length));
  const depositAndNetworkFee = JSBI.add(createTokenAccountsFee, transactionsFee);
  return {
    steps: swapSteps,
    amountIn,
    amountOut: amountOutLessPlatformFee,
    minAmountOut,
    inputMint,
    outputMint,
    swapMode,
    notEnoughLiquidity,
    priceImpact: commonPriceImpact,
    depositAndNetworkFee,
    platformFee: {
      amount: platformFeeAmount,
      token: outputMint,
      pct: +feeBps.numerator.toString() / 100,
    },
  };
};

const createRouteFromExactOut = ({
  route,
  feeBps,
  swapMode,
  amountOut,
  slippage,
  inputMint,
  outputMint,
  userTokensMap,
}) => {
  const swapSteps: SwapStep[] = [];
  const isMultiHopOnSameAMM = checkIsMultiHopOnSameAMM(route.map((step) => step.amm));
  let tempSwapAmountOut = amountOut;
  let index = 0;
  const reversedRoute = route.reverse();

  for (const { amm, inputToken, outputToken } of reversedRoute) {
    if (!amm) {
      return EMPTY_ROUTE_RESPONSE;
    }

    const zeroSlippage = Percentage.fromSlippageNumber(0);
    const slippageToUse = index === 0 && isMultiHopOnSameAMM ? zeroSlippage : slippage;
    const {
      amountIn,
      amountOut,
      minAmountOut,
      feeAmount,
      feeMint,
      notEnoughLiquidity,
      priceImpact,
    } = amm.getQuote({
      inputMint: inputToken,
      outputMint: outputToken,
      amount: tempSwapAmountOut,
      swapMode,
      slippage: slippageToUse,
    });
    swapSteps.push({
      amm,
      inputMint: inputToken,
      outputMint: outputToken,
      amountIn,
      amountOut,
      minAmountOut,
      feeAmount,
      feeMint,
      priceImpact,
      notEnoughLiquidity,
    });
    tempSwapAmountOut = amountIn;
    index++;
  } // updating amount in to amount out with slippage
  // TODO: need to be discussed

  const reversedSteps = swapSteps.reverse().reduce((acc, step, index) => {
    if (index === 0) {
      acc.push(step);
      return acc;
    }

    const updatedStep = { ...step, amountIn: acc[acc.length - 1].minAmountOut };
    acc.push(updatedStep);
    return acc;
  }, [] as SwapStep[]);
  const amountIn = reversedSteps.length > 0 ? reversedSteps[0].amountIn : ZERO; // can be different from one in params due to stable pools
  // const totalAmountOut =
  //   reversedSteps.length > 0
  //     ? reversedSteps[reversedSteps.length - 1].amountOut
  //     : ZERO;

  const minAmountOut =
    reversedSteps.length > 0 ? reversedSteps[reversedSteps.length - 1].minAmountOut : ZERO;
  const platformFeeAmount = feeBps.getFrom(amountIn); // update only ui value, so we don't reduce min value we want to receive and take part of it

  const amountInAddPlatformFee = JSBI.add(amountIn as unknown as JSBI, platformFeeAmount); // update in steps too

  reversedSteps[0].amountIn = amountInAddPlatformFee as any;
  const notEnoughLiquidity = swapSteps.some((step) => step.notEnoughLiquidity);
  const commonPriceImpact =
    1 -
    swapSteps.reduce((priceFactor, step) => {
      return priceFactor * (1 - step.priceImpact);
    }, 1);
  const createTokenAccountsFee = reversedSteps.reduce((acc, step) => {
    const { existing } = userTokensMap.get(step.outputMint) || {
      existing: false,
    };

    if (!existing) {
      return JSBI.add(acc, JSBI.BigInt(STORAGE_TO_REGISTER_WITH_MFT));
    }

    return acc;
  }, ZERO);
  const transactionsFee = JSBI.multiply(
    JSBI.BigInt(DEFAULT_GAS),
    JSBI.BigInt(reversedSteps.length),
  );
  const depositAndNetworkFee = JSBI.add(createTokenAccountsFee, transactionsFee);
  return {
    steps: reversedSteps,
    amountIn: amountInAddPlatformFee,
    amountOut,
    minAmountOut,
    inputMint,
    outputMint,
    swapMode,
    notEnoughLiquidity,
    priceImpact: commonPriceImpact,
    depositAndNetworkFee,
    platformFee: {
      amount: platformFeeAmount,
      token: inputMint,
      pct: +feeBps.numerator.toString() / 100,
    },
  };
};

const getSwapRoutes = ({
  routes,
  amount,
  swapMode = SwapMode.ExactIn,
  inputMint,
  outputMint,
  feeBps,
  slippage,
  userTokensMap,
}) => {
  if (routes.length === 0) {
    return [EMPTY_ROUTE_RESPONSE];
  }

  const filterRoute = (route) =>
    JSBI.greaterThan(route.amountIn, ZERO) &&
    JSBI.greaterThan(route.amountOut, ZERO) && // stable pools
    JSBI.greaterThan(route.steps[route.steps.length - 1].amountOut, ZERO) &&
    Math.abs(route.priceImpact) < 0.9 && // TODO: remove that when stable calculation will be fixed
    !route.notEnoughLiquidity;

  if (swapMode === SwapMode.ExactIn) {
    // console.time('calculate route exact in');
    const computedRoutes = routes.map((route) => {
      return createRouteFromExactIn({
        route,
        amountIn: amount,
        slippage,
        inputMint,
        outputMint,
        swapMode,
        feeBps,
        userTokensMap,
      });
    }); // console.timeEnd('calculate route exact in');

    return computedRoutes
      .filter(filterRoute)
      .sort((routeA, routeB) =>
        JSBI.greaterThanOrEqual(routeB.amountOut, routeA.amountOut) ? 1 : -1,
      );
  } else if (swapMode === SwapMode.ExactOut) {
    // console.time('calculate route exact out');
    const computedRoutes = routes.map((route) => {
      return createRouteFromExactOut({
        route,
        amountOut: amount,
        slippage,
        inputMint,
        outputMint,
        swapMode,
        feeBps,
        userTokensMap,
      });
    }); // console.timeEnd('calculate route exact out');

    return computedRoutes
      .filter(filterRoute)
      .sort((routeA, routeB) => (JSBI.lessThanOrEqual(routeB.amountIn, routeA.amountIn) ? 1 : -1));
  }

  return [EMPTY_ROUTE_RESPONSE];
};

function addSegment(inMint, outMint, amm, tokenRouteSegments) {
  let segments = tokenRouteSegments.get(inMint);

  if (!segments) {
    segments = new Map([[outMint, []]]);
    tokenRouteSegments.set(inMint, segments);
  }

  let marketMetas = segments.get(outMint);

  if (!marketMetas) {
    marketMetas = [];
    segments.set(outMint, marketMetas);
  }

  marketMetas.push({
    inputToken: inMint,
    outputToken: outMint,
    amm,
  });
}

function getTwoPermutations(array) {
  return array.reduce((acc, item) => {
    array.forEach((otherItem) => {
      if (item !== otherItem) {
        acc.push([item, otherItem]);
      }
    });
    return acc;
  }, []);
}

function getTokenRouteSegments(amms) {
  const tokenRouteSegments = new Map();
  amms.forEach((amm) => {
    const reserveTokenMints = amm.reserveTokenMints;
    const reserveTokenMintPermutations = getTwoPermutations(reserveTokenMints);
    reserveTokenMintPermutations.forEach(([firstReserveMint, secondReserveMint]) => {
      addSegment(firstReserveMint, secondReserveMint, amm, tokenRouteSegments);
    });
  });
  return tokenRouteSegments;
}

function computeRoutes({ inputMint, outputMint, tokenRouteSegments, intermediateTokens }) {
  const routes: Route[] = [];
  const firstSegment = tokenRouteSegments.get(inputMint) || new Map();
  const simpleRoutes = firstSegment.get(outputMint) || []; // Direct trade

  simpleRoutes.forEach((simpleRoute) => {
    // dont do direct decimal saber
    routes.push([simpleRoute]);
  });
  const secondSegment = tokenRouteSegments.get(outputMint) || new Map();

  for (const [mint, marketMetas] of firstSegment.entries()) {
    if (intermediateTokens) {
      // if it doesnt include in the intermediateTokens, skip it
      if (!intermediateTokens.includes(mint)) {
        // eslint-disable-next-line no-continue
        continue;
      }
    }

    const intersectionMarketMetas = secondSegment.get(mint) || [];

    for (const marketMeta of marketMetas) {
      for (const intersectionMarketMeta of intersectionMarketMetas) {
        // we need to reverse here, because found intersectionMarketMetas using mint as inputToken
        const secondStepWithReversedTokens = {
          amm: intersectionMarketMeta.amm,
          inputToken: intersectionMarketMeta.outputToken,
          outputToken: intersectionMarketMeta.inputToken,
        };
        routes.push([marketMeta, secondStepWithReversedTokens]);
      }
    }
  }

  return routes;
}

interface IFee {
  feeBps: number;
  feeAccountId: string;
  feeAccountTokens: Map<string, string>;
}

const NO_PLATFORM_FEE: IFee = {
  feeBps: 0,
  feeAccountId: "",
  feeAccountTokens: /*#__PURE__*/ new Map(),
};

Decimal.config({
  precision: 36,
  rounding: 8,
  toExpNeg: -40,
  toExpPos: 40,
});

// https://github.com/near/workspaces-js

const OPTIMISTIC: TBlockQuery = {
  finality: "optimistic",
};
const providers = /*#__PURE__*/ new Map();

type TBlockQuery = {
  finality: string;
};

interface IViewAccountResponse {
  amount: string;
  locked: string;
  code_hash: string;
  storage_usage: number;
  storage_paid_at: number;
  block_height: number;
  block_hash: string;
}

// class JsonRpcProvider extends JsonRpcProvider$1 {
//   /**
//    * Create a JsonRpcProvider from config or rpcAddr
//    * @param config rpc endpoint URL or a configuration that includes one.
//    * @returns JsonRpcProvider
//    */
//   static from(config) {
//     const url = typeof config === "string" ? config : config.rpcAddr;
//
//     if (!providers.has(url)) {
//       providers.set(
//         url,
//         new JsonRpcProvider({
//           url,
//         }),
//       );
//     }
//
//     return providers.get(url);
//   }
//
//   /**
//    * Download the binary of a given contract.
//    * @param accountId contract account
//    * @param blockQuery
//    * @returns Buffer of Wasm binary
//    */
//
//   async viewCode(accountId: string, blockQuery?: TBlockQuery) {
//     return Buffer.from(await this.viewCodeRaw(accountId, blockQuery), "base64");
//   }
//
//   /**
//    * Download the binary of a given contract.
//    * @param accountId contract account
//    * @param blockQuery
//    * @returns Base64 string of Wasm binary
//    */
//
//   async viewCodeRaw(accountId: string, blockQuery: TBlockQuery = OPTIMISTIC) {
//     const { code_base64 } = await this.query<any>({
//       request_type: "view_code",
//       account_id: accountId,
//       ...blockQuery,
//     });
//     return code_base64;
//   }
//
//   async viewAccount(
//     accountId: string,
//     blockQuery: TBlockQuery = OPTIMISTIC,
//   ): Promise<IViewAccountResponse> {
//     return this.query({
//       request_type: "view_account",
//       account_id: accountId,
//       ...blockQuery,
//     });
//   }
//
//   async accountExists(accountId: string, blockQuery?: TBlockQuery) {
//     try {
//       await this.viewAccount(accountId, blockQuery);
//       return true;
//     } catch {
//       return false;
//     }
//   }
//
//   async viewAccessKey(
//     accountId: string,
//     publicKey: string | PublicKey,
//     blockQuery: TBlockQuery = OPTIMISTIC,
//   ) {
//     return this.query({
//       request_type: "view_access_key",
//       account_id: accountId,
//       public_key: typeof publicKey === "string" ? publicKey : publicKey.toString(),
//       ...blockQuery,
//     });
//   }
//
//   async protocolConfig(blockQuery: TBlockQuery = OPTIMISTIC) {
//     // @ts-expect-error Bad type
//     return this.experimental_protocolConfig(blockQuery);
//   }
//
//   async accountBalance(accountId: string, blockQuery: TBlockQuery) {
//     const config = await this.protocolConfig(blockQuery);
//     const state = await this.viewAccount(accountId, blockQuery);
//     const cost = config.runtime_config.storage_amount_per_byte;
//     const costPerByte = NEAR.from(cost);
//     const stateStaked = NEAR.from(state.storage_usage).mul(costPerByte);
//     const staked = NEAR.from(state.locked);
//     const total = NEAR.from(state.amount).add(staked);
//     const available = total.sub(staked.max(stateStaked));
//     return {
//       total,
//       stateStaked,
//       staked,
//       available,
//     };
//   }
//
//   async viewCall(accountId: string, methodName: string, args: any, blockQuery) {
//     const args_buffer = stringifyJsonOrBytes(args);
//     return this.viewCallRaw(accountId, methodName, args_buffer.toString("base64"), blockQuery);
//   }
//
//   /**
//    * Get full response from RPC about result of view method
//    * @param accountId
//    * @param methodName
//    * @param args Base64 encoded string
//    * @param blockQuery
//    * @returns
//    */
//
//   async viewCallRaw(accountId, methodName, args, blockQuery = OPTIMISTIC) {
//     return this.query({
//       request_type: "call_function",
//       account_id: accountId,
//       method_name: methodName,
//       args_base64: args,
//       ...blockQuery,
//     });
//   }
//
//   /**
//    * Download the state of a contract given a prefix of a key.
//    *
//    * @param accountId contract account to lookup
//    * @param prefix string or byte prefix of keys to loodup
//    * @param blockQuery state at what block, defaults to most recent final block
//    * @returns raw RPC response
//    */
//
//   async viewState(accountId, prefix, blockQuery) {
//     const values = await this.viewStateRaw(accountId, prefix, blockQuery);
//     return values.map(({ key, value }) => ({
//       key: Buffer.from(key, "base64"),
//       value: Buffer.from(value, "base64"),
//     }));
//   }
//
//   /**
//    * Download the state of a contract given a prefix of a key without decoding from base64.
//    *
//    * @param accountId contract account to lookup
//    * @param prefix string or byte prefix of keys to loodup
//    * @param blockQuery state at what block, defaults to most recent final block
//    * @returns raw RPC response
//    */
//
//   async viewStateRaw(accountId: string, prefix: string | Buffer, blockQuery?: TBlockQuery) {
//     const { values } = await this.query<any>({
//       request_type: "view_state",
//       ...(blockQuery != null
//         ? blockQuery
//         : {
//             finality: "optimistic",
//           }),
//       account_id: accountId,
//       prefix_base64: Buffer.from(prefix).toString("base64"),
//     });
//     return values;
//   }
// }

const transferToken = ({ tokenId, accountFrom, accountTo, amount }): Transaction => {
  const action: Action = {
    type: "FunctionCall",
    params: {
      methodName: "ft_transfer",
      args: {
        receiver_id: accountTo,
        amount: amount.toString(),
        memo: MEMO,
      },
      gas: DEFAULT_GAS,
      deposit: "1",
    },
  };

  return {
    receiverId: tokenId,
    signerId: accountFrom,
    actions: [action],
  };
};

class Perk {
  provider: JsonRpcProvider;
  near: Near;
  tokenMap: Map<string, TokenInfo>;
  availableTokens: string[];
  tokenRouteSegments: Map<string, Map<string, any>>;
  platformFeeAndAccounts: IFee;
  routeCacheDuration: number;
  routeCache: any;
  intermediateTokens: string[];
  user: string | null;
  userTokensMapCache: Map<string, any>;
  wrapNear: boolean;

  constructor(
    near: Near,
    provider: JsonRpcProvider,
    tokenMap: Map<string, TokenInfo>,
    availableTokens: string[],
    tokenRouteSegments: Map<string, Map<string, any>>,
    platformFeeAndAccounts: IFee,
    routeCacheDuration: number,
    intermediateTokens: string[],
    wrapNear: boolean,
  ) {
    this.wrapNear = wrapNear;
    this.provider = provider;
    this.near = near;
    this.tokenMap = tokenMap;
    this.availableTokens = availableTokens;
    this.tokenRouteSegments = tokenRouteSegments;
    this.platformFeeAndAccounts = platformFeeAndAccounts;
    this.routeCacheDuration = routeCacheDuration;
    this.intermediateTokens = intermediateTokens;
    this.user = null;
    this.routeCache = new Map();
    this.userTokensMapCache = new Map();
  }

  static async load({
    provider,
    user,
    privateKey,
    platformFeeAndAccounts = NO_PLATFORM_FEE,
    // figure out how to fetch all accounts for address
    routeCacheDuration = 0,
    wrapNear = true,
  }: {
    provider: JsonRpcProvider;
    user: string;
    routeCacheDuration?: number;
    privateKey?: string;
    wrapNear?: boolean;
    platformFeeAndAccounts?: IFee;
  }) {
    const keyStore = new keyStores.InMemoryKeyStore();

    if (user && privateKey) {
      const keyPair = KeyPair.fromString(privateKey as KeyPairString);
      await keyStore.setKey("mainnet", user, keyPair);
    }

    const near = await connect({
      networkId: "mainnet",
      nodeUrl: NEAR_BASE_CONFIG_FOR_NETWORK.mainnet.nodeUrl,
      keyStore,
      headers: {},
    });
    const [tokenRouteSegments, availableTokens] = await Perk.fetchTokenRouteSegments(provider);
    const tokenMap = await new TokenListProvider().resolve().then((tokens) => {
      const tokenList = tokens.filterByNearEnv("mainnet").getList();
      const tokenMap = tokenList.reduce((map, item) => {
        map.set(item.address, item);
        return map;
      }, new Map<string, TokenInfo>());
      return tokenMap;
    });
    const intermediateTokens = Perk.getIntermediateTokens();
    const perk = new Perk(
      near,
      provider,
      tokenMap,
      availableTokens,
      tokenRouteSegments,
      platformFeeAndAccounts,
      routeCacheDuration,
      intermediateTokens,
      wrapNear,
    );
    if (user) perk.setUserPublicKey(user);
    return perk;
  }

  static async fetchTokenRouteSegments(provider) {
    const amms = await getAllAmms(provider);
    const tokenRouteSegments = getTokenRouteSegments(amms);
    const availableTokens = Array.from(new Set(amms.flatMap((amm) => amm.reserveTokenMints)));
    return [tokenRouteSegments, availableTokens] as const;
  }

  static getIntermediateTokens() {
    return [
      "wrap.near",
      "usn",
      "dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near",
      "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near",
      "token.pembrock.near",
    ];
  }

  setUserPublicKey(user) {
    this.user = user;
  }

  async loadAndSavePlatformFeeTokenData(tokenId) {
    try {
      const { storageBalance } = await loadAccountStorageBalance({
        provider: this.provider,
        tokenId,
        tokenOwnerId: this.platformFeeAndAccounts.feeAccountId,
      });
      this.platformFeeAndAccounts.feeAccountTokens.set(tokenId, storageBalance);
      return storageBalance;
    } catch (e) {
      console.warn("Unable to load token data for platform fee account", e);
      return null;
    }
  }

  async getPlatformFeeBpsForToken(outputMint) {
    const platformFeeAccountHasToken = this.platformFeeAndAccounts.feeAccountTokens.has(outputMint);
    const platformFeeAccountTokenInfo = platformFeeAccountHasToken
      ? this.platformFeeAndAccounts.feeAccountTokens.get(outputMint)
      : await this.loadAndSavePlatformFeeTokenData(outputMint);
    const platformFeeBps = platformFeeAccountTokenInfo ? this.platformFeeAndAccounts.feeBps : 0;
    return platformFeeBps;
  }

  async computeRoutes({
    inputMint,
    outputMint,
    amount,
    slippage = 0,
    forceFetch = false,
    swapMode = SwapMode.ExactIn,
    simpleRoutesOnly = false,
  }) {
    const feeBps = await this.getPlatformFeeBpsForToken(outputMint);
    const feeBpsPercentage = Percentage.fromFeeBpsNumber(feeBps);
    const now = new Date().getTime(); // do sort so that it's always the same order for the same inputMint and outputMint and vice versa

    const swapType = simpleRoutesOnly ? "simple" : "complex";
    const inputMintAndOutputMint = [inputMint, outputMint, swapType]
      .sort((a, b) => a.localeCompare(b))
      .join("");
    const routeCache = this.routeCache.get(inputMintAndOutputMint);
    const allRoutes = computeRoutes({
      inputMint,
      outputMint,
      tokenRouteSegments: this.tokenRouteSegments,
      intermediateTokens: this.intermediateTokens,
    });
    const routes = allRoutes.filter((route) => {
      // we're sure that user's funds won't stuck in intermediate tokens
      // for direct routes or swap route with same AMMs in steps
      if (simpleRoutesOnly) {
        const isDirectRoute = route.length === 1;
        const isMultiHopOnSameAMM = checkIsMultiHopOnSameAMM(route.map((step) => step.amm)); // for spin it's still not safe, if there will be more not implemented safe logic
        // for multi hop it would be better to keep list somewhere or determine it in either way

        if (route.some((step) => step.amm instanceof SpinFinanceMarket)) {
          return false;
        }

        return isDirectRoute || isMultiHopOnSameAMM;
      }

      return true;
    });
    let shouldBustCache = false; // special -1 condition to not fetch

    if (this.routeCacheDuration === -1) {
      shouldBustCache = false;
    } else if (this.routeCacheDuration === 0) {
      shouldBustCache = true;
    } else {
      if (routeCache) {
        const { fetchTimestamp } = routeCache;

        if (now - fetchTimestamp > this.routeCacheDuration) {
          shouldBustCache = true;
        }
      } else {
        shouldBustCache = true;
      }
    }

    if (forceFetch || shouldBustCache) {
      // console.time('update pools');
      await updateRoutesPools(this.provider, routes); // console.timeEnd('update pools');

      this.routeCache.set(inputMintAndOutputMint, {
        fetchTimestamp: new Date().getTime(),
      });
    }

    try {
      // TODO: maybe add to cache and update on every biuld transactions
      const tokensMapInCache = this.userTokensMapCache.get(inputMintAndOutputMint);
      const userTokensMap = tokensMapInCache ? tokensMapInCache : new Map();

      if (this.user !== null && !tokensMapInCache) {
        const tokensToCheck: string[] = []; // Register for intermediate and output mints

        routes.forEach((route) =>
          route.forEach(({ amm }) =>
            amm.reserveTokenMints.forEach((token) => {
              return tokensToCheck.push(token);
            }),
          ),
        ); // console.time('loading user tokens for routes');

        const loadedUserTokens: any[] = await Promise.allSettled(
          tokensToCheck.map((token) =>
            loadAccountStorageBalance({
              provider: this.provider,
              tokenId: token,
              // @ts-ignore
              tokenOwnerId: this.user,
            })
              .then((data) => {
                return {
                  ...data,
                  status: "resolved",
                };
              })
              .catch(() => {
                return {
                  tokenId: token,
                  existing: false,
                  status: "rejected",
                };
              }),
          ),
        ); // console.timeEnd('loading user tokens for routes');

        loadedUserTokens.forEach(({ tokenId, existing, storageBalance, status }) => {
          if (status === "rejected") return;
          return userTokensMap.set(tokenId, {
            existing,
            data: storageBalance,
          });
        });
        this.userTokensMapCache.set(inputMintAndOutputMint, userTokensMap);
      }

      const slippagePercentage = Percentage.fromSlippageNumber(slippage);
      const routesInfos = getSwapRoutes({
        routes,
        inputMint,
        outputMint,
        amount,
        userTokensMap,
        slippage: slippagePercentage,
        feeBps: feeBpsPercentage,
        swapMode,
      });
      return {
        routesInfos,

        /* indicate if the result is fetched or get from cache */
        cached: !(forceFetch || shouldBustCache),
      };
    } finally {
      // clear cache if it is expired
      this.routeCache.forEach(({ fetchTimestamp }, key) => {
        if (fetchTimestamp - now > this.routeCacheDuration) {
          this.routeCache.delete(key);
        }
      });
    }
  }

  async buildTransactions({ route }) {
    const transactions: any[] = [];
    const isMultiHopOnSameAMM = checkIsMultiHopOnSameAMM(route.steps.map((step) => step.amm)); // for multi-hop there only one tx for double-step route

    const transactionsBySteps = isMultiHopOnSameAMM ? [[]] : route.steps.map(() => []);
    const feeBps = await this.getPlatformFeeBpsForToken(route.outputMint);
    const feeBpsPercentage = Percentage.fromFeeBpsNumber(feeBps);

    if (!this.user) {
      throw new Error("No user provided");
    }

    const user = this.user;
    const account = new Account(this.near.connection, this.user);
    const tokensToRegister = new Set(); // wrap native near if not enough wrapped

    if (this.wrapNear && route.inputMint === WRAPPED_NEAR_ID) {
      console.log("Wrap near: ", route.amountIn.toString());
      const depositTx = await buildDepositNearTransaction(account, route.amountIn);

      if (depositTx.actions.length > 0) {
        transactions.push(depositTx);
        transactionsBySteps[0].push(depositTx);
        tokensToRegister.add(WRAPPED_NEAR_ID);
      }
    } // Register for intermediate and output mints

    route.steps.forEach((_) => tokensToRegister.add(_.outputMint));
    const tokensToRegisterList = [...tokensToRegister.values()];
    const registerTokensTxs = (
      await Promise.all(
        tokensToRegisterList.map((token) => registerToken(this.provider, token, user)),
      )
    ).filter((_) => !!_);
    transactions.push(...registerTokensTxs);
    transactionsBySteps[0].push(...registerTokensTxs); // same amm for each step

    if (isMultiHopOnSameAMM) {
      const commonAMM = route.steps[0].amm;
      const swapTransactions = await commonAMM.createSwapRouteInstructions({
        provider: this.provider,
        user: this.user,
        swapRoute: route,
      });
      transactions.push(...swapTransactions);
      transactionsBySteps[transactionsBySteps.length - 1].push(...swapTransactions);
    } else {
      let index = 0;

      for (let routeStep of route.steps) {
        const stepTransactions = await routeStep.amm.createSwapInstructions({
          provider: this.provider,
          user: this.user,
          swapStep: routeStep,
        });
        transactions.push(...stepTransactions);
        transactionsBySteps[index].push(...stepTransactions);
        index++;
      }
    }

    let totalAmountOut = route.minAmountOut; // if feeBps zero - no fee set up or no token on fee account

    if (feeBps !== 0 && this.platformFeeAndAccounts.feeAccountId) {
      const tokenToUse = route.swapMode === SwapMode.ExactIn ? route.outputMint : route.inputMint;
      const amountToUse = route.swapMode === SwapMode.ExactIn ? route.amountOut : route.amountIn;
      const feeAmount = feeBpsPercentage.getFrom(JSBI.BigInt(amountToUse));
      transactions.push(
        transferToken({
          tokenId: tokenToUse,
          accountFrom: this.user,
          accountTo: this.platformFeeAndAccounts.feeAccountId,
          amount: feeAmount,
        }),
      );

      if (route.swapMode === SwapMode.ExactIn) {
        totalAmountOut = JSBI.subtract(totalAmountOut, feeAmount);
      }
    } // send to native near what we receive from swap

    if (this.wrapNear && route.outputMint === WRAPPED_NEAR_ID) {
      const unwrapTx = await buildWithdrawNearTransaction(user, totalAmountOut);
      transactions.push(unwrapTx);
      transactionsBySteps[transactionsBySteps.length - 1].push(unwrapTx);
    } // reset cache because new tokens can be created using this txs

    if (tokensToRegisterList.length > 0) {
      this.userTokensMapCache.clear();
    }

    return {
      transactions,
      transactionsBySteps,
    };
  }

  /*async exchange({ route }) {
    const { transactions } = await this.buildTransactions({
      route,
    });

    if (!this.user) {
      throw new Error("No user provided");
    }

    const userAccount = await this.near.account(this.user);
    const txResults: FinalExecutionOutcome[] = [];

    for (const transaction of transactions) {
      for (const action of transaction.actions) {
        if (action.type !== "FunctionCall") {
          throw new Error("Non function call in exchange");
        }

        const result = await userAccount.functionCall({
          contractId: transaction.receiverId,
          methodName: action.params.methodName,
          args: action.params.args,
          gas: BigInt(action.params.gas),
          attachedDeposit: BigInt(action.params.deposit),
        });
        txResults.push(result);
      }
    }

    return txResults;
  }*/
}

export {
  Jumbo,
  NO_PLATFORM_FEE,
  Perk,
  RefFinance,
  SPIN_CONTRACT_ADDRESS,
  SpinFinanceMarket,
  SwapMode,
  computeRoutes,
  getAllAmms,
  getSwapRoutes,
  getTokenRouteSegments,
  updateRoutesPools,
};
//# sourceMappingURL=perk-swap-core.esm.js.map
