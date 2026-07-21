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
      getItem: storage.getItem,
      setItem: storage.setItem,
      removeItem: storage.removeItem,
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
      await Promise.all(keys.filter((key) => key.startsWith(rootPrefix)).map(storage.removeItem));
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

export function normalizePartnerMetadata(
  config: IMeteorConnectMobileBridgeConfig["partnerMetadata"],
): TPartnerMetadata {
  const fallbackOrigin = typeof window !== "undefined" ? window.location.origin : undefined;
  const originUrl = config?.originUrl ?? fallbackOrigin;
  if (originUrl == null) throw new Error("Meteor mobile bridge requires a partner origin URL");
  const origin = new URL(originUrl).origin;
  const name = config?.name?.trim() || new URL(origin).hostname;
  return {
    name,
    origin: `${EPartnerOrigin.web_url}::${origin}`,
    description: config?.description,
    iconUrl: config?.iconUrl,
  };
}
