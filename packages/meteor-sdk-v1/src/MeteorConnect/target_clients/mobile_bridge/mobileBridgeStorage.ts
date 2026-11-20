import {
  EStorageAdapterType,
  type IActionPayload_Request_JsonObject,
  type IPartnerResumeTokenV1,
  StorageAdapter,
  type TPartnerPairedWallet,
} from "@meteorwallet/connect";
import {
  EBridgeLinkType,
  EMeteorAppId,
  EPartnerOrigin,
  type TMeteorBridgeWalletLink,
  type TPartnerMetadata,
} from "@meteorwallet/connect-shared";
import type { KeyPairString } from "@near-js/crypto";
import { sha256 } from "@noble/hashes/sha2.js";
import { base64url } from "@scure/base";
import * as v from "valibot";
import type { ILocalStorageInterface } from "../../../ported_common/utils/storage/storage.types";
import type { IMeteorConnectMobileBridgeConfig } from "../../MeteorConnect.types";
import type { TMobileNearActionId } from "./MeteorConnectMobileBridgeClient.types";

const BRIDGE_STORAGE_PREFIX = "met_bridge_partner::";

export interface IMobileBridgeStorageContext {
  backendUrl: string;
  environmentId: string;
  rootPrefix: string;
  storageAdapter: StorageAdapter;
  clearIdentityStorage(): Promise<void>;
  getFencingGeneration(): Promise<number>;
  setFencingGeneration(generation: number): Promise<void>;
  registerLiveSession(token: string): Promise<{ stop(): Promise<void> }>;
  hasOtherLiveSessions(token?: string): Promise<boolean>;
  /**
   * Wallets (by verify key) this browser opened Meteor Mobile for and then saw claim the request —
   * the only evidence the app is installed on THIS device, which gates automatic opening. Lives
   * under the identity namespace, so an identity reset forgets it along with the pairings.
   */
  hasSameDeviceWallet(walletVerifyPublicKey: string): Promise<boolean>;
  rememberSameDeviceWallet(walletVerifyPublicKey: string): Promise<void>;
  forgetSameDeviceWallet(walletVerifyPublicKey: string): Promise<void>;
}

/** Newest-first bound for the same-device wallet record; a phone rarely holds more than one. */
const MAX_SAME_DEVICE_WALLETS = 8;

export function normalizeBridgeBackendUrl(input: string): string {
  const url = new URL(input);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Meteor mobile bridge backend must use HTTP or HTTPS");
  }
  url.hash = "";
  url.search = "";
  url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString().replace(/\/$/, "");
}

/**
 * Per-backend identity namespace for the SDK's own coordination records (fencing generation,
 * live-session heartbeats, the lease register). `PartnerSessionClient` derives an equivalent
 * scope of its own from `backendUrl` (`deriveBackendStorageScope`), but this one also owns the
 * on-disk `met_bridge_partner::<env>::` layout already shipped to installs, and the lease names
 * the client never sees — so it stays.
 */
export function createBridgeEnvironmentId(backendUrl: string): string {
  return base64url.encode(sha256(new TextEncoder().encode(normalizeBridgeBackendUrl(backendUrl))));
}

export function createMobileBridgeStorage(
  storage: ILocalStorageInterface,
  backendUrl: string,
): IMobileBridgeStorageContext {
  const normalizedBackendUrl = normalizeBridgeBackendUrl(backendUrl);
  const environmentId = createBridgeEnvironmentId(normalizedBackendUrl);
  const rootPrefix = `${BRIDGE_STORAGE_PREFIX}${environmentId}::`;
  const generationKey = `${rootPrefix}coordination::generation`;
  const sessionPrefix = `${rootPrefix}coordination::live_session::`;
  const sameDeviceWalletsKey = `${rootPrefix}device::same_device_wallets`;
  const sessionTtlMs = 15_000;
  const storageAdapter = new StorageAdapter({
    keyPrefix: rootPrefix,
    methods: {
      type: EStorageAdapterType.string,
      durable: true,
      getItem: (key) => storage.getItem(key),
      setItem: (key, value) => storage.setItem(key, value),
      removeItem: (key) => storage.removeItem(key),
    },
  });

  const readLiveSessions = async (ignoreToken?: string): Promise<string[]> => {
    if (storage.getKeys == null) throw new Error("mobile_bridge_coordination_unsupported");
    const now = Date.now();
    const keys = await storage.getKeys(sessionPrefix);
    const live: string[] = [];
    await Promise.all(
      keys.map(async (key) => {
        const value = await storage.getItem(key);
        const expiresAt = value == null ? 0 : Number(value);
        if (!Number.isFinite(expiresAt) || expiresAt <= now) {
          await storage.removeItem(key);
          return;
        }
        const token = key.slice(sessionPrefix.length);
        if (token !== ignoreToken) live.push(token);
      }),
    );
    return live;
  };

  const readSameDeviceWallets = async (): Promise<string[]> => {
    try {
      const parsed: unknown = JSON.parse((await storage.getItem(sameDeviceWalletsKey)) ?? "[]");
      return Array.isArray(parsed) ? parsed.filter((key) => typeof key === "string") : [];
    } catch {
      return [];
    }
  };
  const writeSameDeviceWallets = async (keys: string[]): Promise<void> => {
    if (keys.length === 0) await storage.removeItem(sameDeviceWalletsKey);
    else await storage.setItem(sameDeviceWalletsKey, JSON.stringify(keys));
  };

  return {
    backendUrl: normalizedBackendUrl,
    environmentId,
    rootPrefix,
    storageAdapter,
    clearIdentityStorage: async () => {
      if (storage.getKeys == null) {
        throw new Error("mobile_bridge_coordination_unsupported");
      }
      const keys = await storage.getKeys(rootPrefix);
      await Promise.all(
        keys.filter((key) => key.startsWith(rootPrefix)).map((key) => storage.removeItem(key)),
      );
    },
    getFencingGeneration: async () => {
      const stored = await storage.getItem(generationKey);
      const generation = stored == null ? 0 : Number(stored);
      return Number.isSafeInteger(generation) && generation >= 0 ? generation : 0;
    },
    setFencingGeneration: async (generation) => {
      await storage.setItem(generationKey, String(generation));
    },
    registerLiveSession: async (token) => {
      const key = `${sessionPrefix}${token}`;
      let stopped = false;
      const heartbeat = async () => {
        if (!stopped) await storage.setItem(key, String(Date.now() + sessionTtlMs));
      };
      await heartbeat();
      const timer = setInterval(() => void heartbeat(), sessionTtlMs / 3);
      return {
        stop: async () => {
          if (stopped) return;
          stopped = true;
          clearInterval(timer);
          await storage.removeItem(key);
        },
      };
    },
    hasOtherLiveSessions: async (token) => (await readLiveSessions(token)).length > 0,
    hasSameDeviceWallet: async (walletVerifyPublicKey) =>
      (await readSameDeviceWallets()).includes(walletVerifyPublicKey),
    rememberSameDeviceWallet: async (walletVerifyPublicKey) => {
      const others = (await readSameDeviceWallets()).filter((key) => key !== walletVerifyPublicKey);
      await writeSameDeviceWallets(
        [walletVerifyPublicKey, ...others].slice(0, MAX_SAME_DEVICE_WALLETS),
      );
    },
    forgetSameDeviceWallet: async (walletVerifyPublicKey) => {
      const keys = await readSameDeviceWallets();
      if (!keys.includes(walletVerifyPublicKey)) return;
      await writeSameDeviceWallets(keys.filter((key) => key !== walletVerifyPublicKey));
    },
  };
}

//
// Reload recovery: the pending-request record
//

/** The SDK action ids whose mobile-bridge request a reloaded tab can collect (`single_turn_v1`). */
export type TRecoverableSdkActionId =
  | "near::sign_in"
  | "near::sign_in_and_sign_message"
  | "near::sign_out"
  | "near::sign_message"
  | "near::sign_transactions"
  | "near::sign_delegate_actions"
  | "near::verify_owner";

/**
 * The part of a NEAR request a reloaded tab needs to map the wallet's answer exactly as the
 * original page would have: the staged input (to bind the result to the turn), and the few fields
 * of the SDK request the result mapping reads (`target`, the function-call key definition and the
 * targeted account's identifier). Never the whole SDK request: it holds bytes, keys and callbacks.
 */
export interface IMobileBridgePendingAction {
  sdkActionId: TRecoverableSdkActionId;
  sharedActionId: TMobileNearActionId;
  /** The staged request, as the original page sent it. */
  actionRequest: IActionPayload_Request_JsonObject;
  actionInput: unknown;
  retainedMessageState?: string;
  expandedInput: Record<string, unknown>;
}

/**
 * The wallet's verified answer to a recorded request, written into the record BEFORE the session is
 * acknowledged. The acknowledgement closes the session, and a closed session no longer hands the
 * answer out — so a page torn down after the backend applied it, but before the record was removed
 * (iOS Safari reloading a tab it just woke, mid-verb), would otherwise leave the reloaded page a
 * record whose session can only read back as a cancel. Only the wallet's raw output and the wallet
 * that gave it are kept: the SDK-shaped result is mapped again from them, exactly as the first time.
 */
export type TMobileBridgeRecordedAnswer =
  | {
      status: "ok";
      output: unknown;
      wallet: Pick<TPartnerPairedWallet, "meteorAppId" | "walletVerifyPublicKey">;
    }
  | { status: "declined"; errorIds: string[]; errorMessage: string }
  | { status: "mismatch" };

/**
 * One in-flight mobile-bridge request, kept per tab so a page the browser reloaded while the user
 * was in the wallet can still collect the answer.
 *
 * It holds the session's resume token — partner secret and bridge lease included — and, for a
 * sign-in that adds a function-call key, that key's private half. Both are accepted D15 exposures:
 * the record lives only in this tab's `sessionStorage`, never in `localStorage`, and only until the
 * session settles or its absolute deadline passes. Script running in the page can read it, but such
 * script can already drive the live session. Without the key a recovered sign-in would leave a key
 * on-chain that no device holds. Once the wallet has answered, the record also holds that verified
 * answer for the short window until it is delivered — what the page is about to hand the DApp
 * anyway, kept under the same rules.
 */
export interface IMobileBridgePendingRequestRecord {
  v: 1;
  /** `ExecutableAction.requestId` of the action that started the request. */
  requestId: string;
  createdAt: number;
  /** The session's absolute deadline; a record past it can only be reported as expired. */
  expiresAt: number;
  /** The app ids the original session targeted, in preference order. */
  meteorAppIds: EMeteorAppId[];
  /**
   * The verify key of the one wallet the original session accepted a claim from (an account
   * action on a paired mobile account), so the recovered session refuses any other claimant too.
   */
  expectedWalletVerifyPublicKey?: string;
  token: IPartnerResumeTokenV1;
  /**
   * The backend-issued wallet link the original session presented (without its fragment secret),
   * so a reloaded page can reopen the wallet on the same request. Absent in a record written
   * before it was kept; such a request can still be collected, only not reopened.
   */
  walletLink?: TMeteorBridgeWalletLink;
  action: IMobileBridgePendingAction;
  /** Sign-in with a new function-call key only: that key, as `KeyPair.toString()` writes it. */
  functionCallKey?: KeyPairString;
  /** Set once the wallet's answer is verified, before it is acknowledged (see the type). */
  answer?: TMobileBridgeRecordedAnswer;
}

const isKeyPairString = (value: string): value is KeyPairString =>
  value.startsWith("ed25519:") || value.startsWith("secp256k1:");

const isPlainObject = (value: unknown): boolean =>
  typeof value === "object" && value != null && !Array.isArray(value);

/**
 * The shape check on read. The token is only checked for being an object here: it is opaque to the
 * SDK, and `PartnerSessionClient.resumeSession` validates it strictly before using any of it. The
 * staged request is never sent again — a resumed session only collects the answer to it.
 */
const vPendingRequestRecord = v.object({
  v: v.literal(1),
  requestId: v.pipe(v.string(), v.minLength(1)),
  createdAt: v.number(),
  expiresAt: v.number(),
  meteorAppIds: v.pipe(v.array(v.enum(EMeteorAppId)), v.minLength(1)),
  expectedWalletVerifyPublicKey: v.optional(v.pipe(v.string(), v.minLength(1))),
  token: v.custom<IPartnerResumeTokenV1>(isPlainObject),
  walletLink: v.optional(
    v.object({
      linkString: v.pipe(v.string(), v.minLength(1)),
      linkType: v.enum(EBridgeLinkType),
    }),
  ),
  action: v.object({
    sdkActionId: v.picklist([
      "near::sign_in",
      "near::sign_in_and_sign_message",
      "near::sign_out",
      "near::sign_message",
      "near::sign_transactions",
      "near::sign_delegate_actions",
      "near::verify_owner",
    ]),
    sharedActionId: v.picklist([
      "sign_in",
      "sign_in_and_sign_message",
      "sign_out",
      "sign_message",
      "sign_and_send_transaction",
      "sign_and_send_transactions",
      "sign_delegate_actions",
      "verify_owner",
    ]),
    actionRequest: v.custom<IActionPayload_Request_JsonObject>(isPlainObject),
    actionInput: v.unknown(),
    retainedMessageState: v.optional(v.string()),
    expandedInput: v.record(v.string(), v.unknown()),
  }),
  functionCallKey: v.optional(
    v.custom<KeyPairString>((value) => typeof value === "string" && isKeyPairString(value)),
  ),
  answer: v.optional(
    v.variant("status", [
      v.object({
        status: v.literal("ok"),
        output: v.unknown(),
        wallet: v.object({
          meteorAppId: v.enum(EMeteorAppId),
          walletVerifyPublicKey: v.custom<TPartnerPairedWallet["walletVerifyPublicKey"]>(
            (value) => typeof value === "string" && value.startsWith("ed25519::raw_base64::"),
          ),
        }),
      }),
      v.object({
        status: v.literal("declined"),
        errorIds: v.array(v.string()),
        errorMessage: v.string(),
      }),
      v.object({ status: v.literal("mismatch") }),
    ]),
  ),
});

/** Per-tab home of the {@link IMobileBridgePendingRequestRecord}; every method is best-effort. */
export interface IMobileBridgePendingRequestStore {
  /** The stored record, or `undefined` when there is none or it is unreadable (then removed). */
  read(): IMobileBridgePendingRequestRecord | undefined;
  /** Returns whether the record was stored. */
  write(record: IMobileBridgePendingRequestRecord): boolean;
  /** Remove the record — only if it is `requestId`'s, when one is given. */
  clear(requestId?: string): void;
}

const PENDING_REQUEST_KEY_SUFFIX = "::pending_request";

/** Where the record for one bridge environment lives, beside that environment's other records. */
export function pendingRequestStorageKey(environmentId: string): string {
  return `${BRIDGE_STORAGE_PREFIX}${environmentId}${PENDING_REQUEST_KEY_SUFFIX}`;
}

/**
 * The store over this tab's `sessionStorage`. Every access is guarded: reading the property itself
 * throws on an opaque origin or with site data blocked, and React Native has none at all. Without
 * it the store holds nothing and recovery simply never happens.
 */
export function createPendingRequestStore(
  environmentId: string,
  getStorage: () => Storage | undefined = () => globalThis.sessionStorage,
): IMobileBridgePendingRequestStore {
  const key = pendingRequestStorageKey(environmentId);
  const storage = (): Storage | undefined => {
    try {
      return getStorage() ?? undefined;
    } catch {
      return undefined;
    }
  };
  const remove = () => {
    try {
      storage()?.removeItem(key);
    } catch {
      // Nothing more can be done; the record expires with its session.
    }
  };
  const read = (): IMobileBridgePendingRequestRecord | undefined => {
    let stored: string | null | undefined;
    try {
      stored = storage()?.getItem(key);
    } catch {
      return undefined;
    }
    if (stored == null) return undefined;
    try {
      const parsed = v.safeParse(vPendingRequestRecord, JSON.parse(stored));
      if (parsed.success) return parsed.output;
    } catch {
      // Unparseable JSON falls through to removal.
    }
    remove();
    return undefined;
  };
  return {
    read,
    write: (record) => {
      try {
        const target = storage();
        if (target == null) return false;
        target.setItem(key, JSON.stringify(record));
        return true;
      } catch {
        return false;
      }
    },
    clear: (requestId) => {
      if (requestId != null) {
        const current = read();
        if (current != null && current.requestId !== requestId) return;
      }
      remove();
    },
  };
}

/**
 * The bridge backend (connect-shared >= 0.7.0) hard-rejects partner metadata that breaks its
 * schema: `iconUrl` must be `https://` (blocks `javascript:`/`data:` reaching icon renderers),
 * `name` is 1-64 chars and `description` <= 280 chars, both without Unicode control/format
 * characters (the name is interpolated into OS push notifications). Sanitize here so a partner
 * on plain HTTP, or with an oversized name, degrades gracefully instead of failing create_bridge.
 */
const CONTROL_OR_FORMAT_CHARACTERS = /[\p{Cc}\p{Cf}]/gu;

function sanitizeMetadataText(value: string | undefined, maxLength: number): string | undefined {
  const cleaned = value?.replace(CONTROL_OR_FORMAT_CHARACTERS, "").trim();
  if (!cleaned) return undefined;
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength).trimEnd() : cleaned;
}

function normalizeIconUrl(iconUrl: string | undefined, origin: string): string | undefined {
  const trimmed = iconUrl?.trim();
  if (!trimmed) return undefined;
  try {
    // Resolve relative paths (e.g. "/icon.png") against the partner origin.
    const resolved = new URL(trimmed, origin);
    if (resolved.protocol !== "https:") return undefined;
    const href = resolved.toString();
    return href.length <= 2048 ? href : undefined;
  } catch {
    return undefined;
  }
}

export function normalizePartnerMetadata(
  config: IMeteorConnectMobileBridgeConfig["partnerMetadata"],
): TPartnerMetadata {
  const fallbackOrigin = typeof window !== "undefined" ? window.location.origin : undefined;
  const originUrl = config?.originUrl ?? fallbackOrigin;
  if (originUrl == null) throw new Error("Meteor mobile bridge requires a partner origin URL");
  const origin = new URL(originUrl).origin;
  const name =
    sanitizeMetadataText(config?.name, 64) ?? (new URL(origin).hostname.slice(0, 64) || "partner");
  return {
    name,
    origin: `${EPartnerOrigin.web_url}::${origin}`,
    description: sanitizeMetadataText(config?.description, 280),
    iconUrl: normalizeIconUrl(config?.iconUrl, origin),
  };
}
