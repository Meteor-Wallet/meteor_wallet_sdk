import { EPartnerOrigin, type TPartnerMetadata } from "@meteorwallet/connect-shared";
import { EStorageAdapterType, StorageAdapter } from "@nice-code/util";
import { sha256 } from "@noble/hashes/sha2.js";
import { base64url } from "@scure/base";
import type { ILocalStorageInterface } from "../../../ported_common/utils/storage/storage.types";
import type { IMeteorConnectMobileBridgeConfig } from "../../MeteorConnect.types";

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
}

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
