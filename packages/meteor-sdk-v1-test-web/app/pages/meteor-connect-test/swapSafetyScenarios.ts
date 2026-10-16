import { type Action, actionCreators } from "@near-js/transactions";
import { base64 } from "@scure/base";

/**
 * The RHEA swap requests the wallets' Developer settings › Swap testing opens — the BATMAN sale of
 * 2026-10-15 and the states its approval checks handle (token-data's
 * `docs/issues/batman-swap-oct-2026/`) — sent here as a real dApp request over Meteor Connect, so
 * the approval screen is the one users get. Keep them in step with the wallets' copies
 * (meteor_wallet's `new_swap/swap_testing/swap_testing_scenarios.ts`, meteor-v2-apps'
 * `token_swap_v2/swap_testing/swap_testing_scenarios.ts`).
 *
 * One difference, because these go out signed by the tester's own account: every route goes
 * through a pool that doesn't exist (`NO_SUCH_CLASSIC_POOL`, `NO_SUCH_DCL_POOL`, checked on mainnet
 * on 2026-10-16). Approved by mistake, RHEA's contract refuses the swap and the token refunds the
 * deposit: only gas is spent. The wallets' value checks read a request's tokens, amounts and
 * minimum, never its pools, so what they show is the same. The amounts are also more than a test
 * account holds.
 */

const USDC = "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1"; // 6 decimals
const USDT = "usdt.tether-token.near"; // 6 decimals
const WNEAR = "wrap.near";
const BATMAN = "batman-4.nearlytrade.near"; // 18 decimals
const CLASSIC = "v2.ref-finance.near";
const DCL = "dclv2.ref-labs.near";
const AGGREGATOR = "aggregatedex.near";

/** A token no contract answers for: no metadata, no price. */
const NO_SUCH_TOKEN = "swap-testing-token.near";
/** RHEA's classic exchange answers "E85: invalid pool id" (8,959 pools in October 2026). */
const NO_SUCH_CLASSIC_POOL = 999_999_999;
/** RHEA's DCL contract has no USDC/USDt pool at a 0.0001% fee tier. */
const NO_SUCH_DCL_POOL = `${USDC}|${USDT}|1`;

const GAS = 300_000_000_000_000n;
const ONE_YOCTO = 1n;

export interface ISwapSafetyTransaction {
  receiverId: string;
  actions: Action[];
}

export interface ISwapSafetyScenario {
  id: string;
  title: string;
  /** What the wallet's approval screen should show. */
  expect: string;
  /** One request each. */
  transactions: ISwapSafetyTransaction[];
}

const usdc = (amount: number): string => (BigInt(amount) * 1_000_000n).toString();
const SENT = usdc(50_000);

const transferCall = (
  token: string,
  receiver: string,
  amount: string,
  msg: object | string,
): ISwapSafetyTransaction => ({
  receiverId: token,
  actions: [
    actionCreators.functionCall(
      "ft_transfer_call",
      {
        receiver_id: receiver,
        amount,
        msg: typeof msg === "string" ? msg : JSON.stringify(msg),
      },
      GAS,
      ONE_YOCTO,
    ),
  ],
});

const classicUsdcToUsdt = (minimumOut: string, extra: object = {}) =>
  transferCall(USDC, CLASSIC, SENT, {
    force: 0,
    actions: [
      {
        pool_id: NO_SUCH_CLASSIC_POOL,
        token_in: USDC,
        token_out: USDT,
        amount_in: SENT,
        min_amount_out: minimumOut,
      },
    ],
    ...extra,
  });

/** RHEA's aggregator message: JSON, base64-encoded with every byte shifted by 7. */
const signedRoute = (route: object): string =>
  base64.encode(new TextEncoder().encode(JSON.stringify(route)).map((byte) => (byte + 7) % 256));

// EkHgnZ7cMW2ZgHbnswwSpWh3PYckz9S1j4c7YMzz8924 as RHEA's app built it, but through no pool: the
// real one was #8866
const BATMAN_SALE = transferCall(BATMAN, CLASSIC, "526385900446717095082899", {
  force: 0,
  actions: [
    {
      pool_id: NO_SUCH_CLASSIC_POOL,
      token_in: BATMAN,
      token_out: WNEAR,
      amount_in: "526385900446717095082899",
      min_amount_out: "11945331206688488000000000",
    },
  ],
});

export const SWAP_SAFETY_SCENARIOS: readonly ISwapSafetyScenario[] = [
  {
    id: "batman-sale",
    title: "The BATMAN sale of 2026-10-15",
    expect:
      "A classic-pools card: 526,385.9 BATMAN for at least 11.95 wNEAR, about 94% lost (it moves with BATMAN's price). The danger notice, and approving waits for its checkbox.",
    transactions: [BATMAN_SALE],
  },
  {
    id: "fair-aggregator",
    title: "A fair swap through RHEA's aggregator",
    expect:
      'An aggregator card: 50,000 USDC for at least ~49,650 USDT, V2\'s minimum less its fees. Only "Up to 0.7% below market"; nothing to tick.',
    transactions: [
      transferCall(USDC, AGGREGATOR, SENT, {
        msg: signedRoute({
          user: null,
          receive_user: null,
          contracts: [USDC],
          methods: ["ft_transfer_call"],
          msgs: [
            JSON.stringify({
              amount: SENT,
              receiver_id: DCL,
              msg: JSON.stringify({
                Swap: {
                  pool_ids: [NO_SUCH_DCL_POOL],
                  output_token: USDT,
                  min_output_amount: usdc(49_850),
                  skip_unwrap_near: true,
                },
              }),
            }),
          ],
          app_fee_rate: 3000,
          app_fee_recipient: "meteor-fees.near",
        }),
        // Not RHEA's: the aggregator refuses the route even before its pool fails
        signature: "swap-testing",
      }),
    ],
  },
  {
    id: "warning",
    title: "15% below market (classic pools)",
    expect: "50,000 USDC for at least 42,500 USDT: a warning, and approving stays enabled.",
    transactions: [classicUsdcToUsdt(usdc(42_500))],
  },
  {
    id: "confirm",
    title: "40% below market (a DCL pool)",
    expect:
      "50,000 USDC for at least 30,000 USDT: the danger notice, and approving waits for its checkbox.",
    transactions: [
      transferCall(USDC, DCL, SENT, {
        Swap: {
          pool_ids: [NO_SUCH_DCL_POOL],
          output_token: USDT,
          min_output_amount: usdc(30_000),
        },
      }),
    ],
  },
  {
    id: "recipient",
    title: "Output sent to another account",
    expect:
      "A fair swap whose USDT goes to someone-else.near: counted as all lost to you, the recipient named on the card, and approving waits for its checkbox.",
    transactions: [classicUsdcToUsdt(usdc(49_850), { swap_out_recipient: "someone-else.near" })],
  },
  {
    id: "unreadable",
    title: "A RHEA call Meteor can't read",
    expect:
      'A DCL limit order: "Meteor can\'t check what this gives you", with the USDC sent, and approving waits for its checkbox.',
    transactions: [
      transferCall(USDC, DCL, SENT, {
        LimitOrder: { pool_id: NO_SUCH_DCL_POOL, buy_token: USDT, point: 0 },
      }),
    ],
  },
  {
    id: "unpriced",
    title: "A token with no metadata or price",
    expect:
      "The swap can't be valued: Meteor says it can't check it, and approving waits for its checkbox.",
    transactions: [
      transferCall(NO_SUCH_TOKEN, CLASSIC, "1000000000000000000000", {
        force: 0,
        actions: [
          {
            pool_id: NO_SUCH_CLASSIC_POOL,
            token_in: NO_SUCH_TOKEN,
            token_out: WNEAR,
            amount_in: "1000000000000000000000",
            min_amount_out: "1000000000000000000000000",
          },
        ],
      }),
    ],
  },
  {
    id: "two-swaps",
    title: "Two transactions: the BATMAN sale and the 15% one",
    expect: "A card for each in one request, and one checkbox.",
    transactions: [BATMAN_SALE, classicUsdcToUsdt(usdc(42_500))],
  },
];
