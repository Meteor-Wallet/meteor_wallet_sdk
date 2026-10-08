import { MOBILE_BRIDGE_ENDING } from "@meteorwallet/sdk";
import { base64 } from "@scure/base";

/**
 * The record of every request this harness makes — to the wallet, the chain or the local relayer.
 *
 * It exists for phones: a tester holding Meteor Mobile has no console, so each request has to say
 * on the page itself whether it worked, what came back, and how long it took.
 */

export type TNearNetwork = "testnet" | "mainnet";

export type TActionResultStatus =
  | "pending"
  /** The request completed and its output checks out. */
  | "success"
  /** The request completed, but something in the output deserves a second look. */
  | "warning"
  /** The user (or the wallet) declined or closed it — not a bug in itself. */
  | "cancelled"
  | "failed"
  /** The page reloaded while this was still waiting, so its answer was never received. */
  | "interrupted";

export interface IActionResultField {
  label: string;
  value: string;
  href?: string;
  tone?: "good" | "bad" | "warn";
  /** Defaults to true: anything worth showing in a test harness is usually worth pasting. */
  copyable?: boolean;
}

/** What a summarizer makes of a successful output. */
export interface IActionResultSummary {
  /** Overrides plain "success" — e.g. a signed transaction that failed on-chain. */
  status?: "success" | "warning" | "failed";
  headline: string;
  fields?: IActionResultField[];
}

export interface IActionResult {
  id: string;
  /** Groups runs of the same control, so it can show its own latest outcome inline. */
  key: string;
  label: string;
  actionId?: string;
  accountId?: string;
  network?: TNearNetwork;
  status: TActionResultStatus;
  startedAt: number;
  endedAt?: number;
  headline?: string;
  fields: IActionResultField[];
  errorMessage?: string;
  errorCode?: string;
  /** Pretty JSON of the raw output (or error), for the details view. */
  raw?: string;
}

//
// ERRORS
//

export const errorMessageOf = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return toDisplayJson(error);
};

/** V1 web / extension popup endings (`EDappActionErrorTag` copy) that mean "the user stopped it". */
const USER_ENDED_V1 =
  /user (closed the window|cancelled the action|didn't complete the action)|new action was started/i;

export const describeActionError = (
  error: unknown,
): {
  status: "cancelled" | "failed";
  headline: string;
  message: string;
  code?: string;
} => {
  const message = errorMessageOf(error);
  const rawCode = (error as { code?: unknown } | null)?.code;
  const code = typeof rawCode === "string" ? rawCode : undefined;

  if (message === "Action was cancelled" || message.startsWith(MOBILE_BRIDGE_ENDING.cancelled)) {
    return { status: "cancelled", headline: "Cancelled before the wallet answered", message, code };
  }
  if (message.startsWith(MOBILE_BRIDGE_ENDING.walletDeclined)) {
    return { status: "cancelled", headline: "Declined by the wallet", message, code };
  }
  if (USER_ENDED_V1.test(message)) {
    return { status: "cancelled", headline: "Closed or cancelled by the user", message, code };
  }
  if (message.startsWith(MOBILE_BRIDGE_ENDING.expired)) {
    return {
      status: "failed",
      headline: "Expired without an answer from the wallet",
      message,
      code,
    };
  }
  if (/refused to allow the popup|popup window failed to open/i.test(message)) {
    return { status: "failed", headline: "The wallet popup was blocked", message, code };
  }
  return { status: "failed", headline: "Request failed", message, code };
};

//
// SERIALIZATION
//

const looksLikePublicKey = (value: any): boolean =>
  value != null &&
  typeof value === "object" &&
  typeof value.toString === "function" &&
  "keyType" in value &&
  value.data instanceof Uint8Array;

/**
 * JSON for humans: bigints as strings, bytes as base64, keys in their `ed25519:` form, errors with
 * their message — instead of `{"0":12,"1":201,…}` or a throw.
 */
export const toDisplayJson = (value: unknown): string => {
  try {
    return (
      JSON.stringify(
        value,
        function (this: any, key: string, current: unknown) {
          // `this[key]` is the value BEFORE its own `toJSON` ran (Buffer has one).
          const original = key === "" ? value : this[key];
          if (typeof original === "bigint") return original.toString();
          if (original instanceof Uint8Array) return `base64:${base64.encode(original)}`;
          if (looksLikePublicKey(original)) {
            const asString = String(original);
            if (asString.includes(":")) return asString;
          }
          if (original instanceof Error) {
            return {
              name: original.name,
              message: original.message,
              ...(original as any),
              ...(original.cause != null ? { cause: original.cause } : {}),
            };
          }
          return current;
        },
        2,
      ) ?? String(value)
    );
  } catch {
    return String(value);
  }
};

//
// FORMATTING
//

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${Math.max(0, Math.round(ms))} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
};

export const formatClock = (timestamp: number): string =>
  new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

/** Keeps both ends of a hash or key visible on a narrow screen. */
export const truncateMiddle = (value: string, keep = 10): string =>
  value.length <= keep * 2 + 3 ? value : `${value.slice(0, keep)}…${value.slice(-keep)}`;

const explorerBase = (network: TNearNetwork): string =>
  network === "mainnet" ? "https://nearblocks.io" : "https://testnet.nearblocks.io";

export const explorerTxUrl = (network: TNearNetwork, hash: string): string =>
  `${explorerBase(network)}/txns/${hash}`;

export const explorerAccountUrl = (network: TNearNetwork, accountId: string): string =>
  `${explorerBase(network)}/address/${accountId}`;

//
// PERSISTENCE
//

const STORAGE_KEY = "meteor_connect_test.action_results.v1";
export const MAX_STORED_RESULTS = 50;

/**
 * Mobile browsers freely discard a backgrounded tab — exactly what happens while the tester is
 * off approving in Meteor Mobile — so the log outlives a reload. Anything still pending when the
 * page died can never be answered now; it comes back as `interrupted`, not as a fake success.
 */
export const loadStoredResults = (): IActionResult[] => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored == null) return [];
    const parsed = JSON.parse(stored) as IActionResult[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((result) =>
      result.status === "pending"
        ? {
            ...result,
            status: "interrupted",
            headline: "The page reloaded before the wallet answered",
          }
        : result,
    );
  } catch {
    return [];
  }
};

export const storeResults = (results: readonly IActionResult[]): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(results.slice(0, MAX_STORED_RESULTS)));
  } catch {
    // Quota or blocked storage: the in-memory log still works for this page load.
  }
};
