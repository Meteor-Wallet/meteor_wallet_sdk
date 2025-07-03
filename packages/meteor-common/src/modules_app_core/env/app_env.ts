import { z } from "zod";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";

// @ts-ignore
const VITE_META_ENV = import.meta.env;
/*export const ENV_BACKEND_API_BASE_URL_PROD =
  VITE_META_ENV?.VITE_BACKEND_API_URL_PROD ?? "http://localhost:4000";
export const ENV_BACKEND_API_BASE_URL_DEV =
  VITE_META_ENV?.VITE_BACKEND_API_URL_DEV ?? "http://localhost:4000";
export const ENV_API_ACTION_BASE_URL_PROD =
  VITE_META_ENV?.VITE_API_ACTION_BASE_URL_PROD ?? "http://localhost:8080/api_action";
export const ENV_API_ACTION_BASE_URL_DEV =
  VITE_META_ENV?.VITE_API_ACTION_BASE_URL_DEV ?? "http://localhost:8080/api_action";
export const ENV_IPFS_CACHE_URL = VITE_META_ENV?.VITE_IPFS_CACHE_URL ?? "";
export const ENV_IS_DEV: boolean = VITE_META_ENV?.MODE !== "production";
export const NEAR_DEFAULT_NETWORK: ENearNetwork =
  (VITE_META_ENV?.VITE_NEAR_DEFAULT_NETWORK as ENearNetwork) ?? ENearNetwork.mainnet;
export const ENV_BACKEND_API_METADATA_URL_DEV: string | undefined =
  VITE_META_ENV?.VITE_BACKEND_API_METADATA_URL_DEV;
export const ENV_BACKEND_API_METADATA_URL_PROD: string | undefined =
  VITE_META_ENV?.VITE_BACKEND_API_METADATA_URL_PROD;*/

const zAppEnv = z.object({
  ENV_BACKEND_API_BASE_URL_PROD: z.string(),
  ENV_BACKEND_API_BASE_URL_DEV: z.string(),
  ENV_API_ACTION_BASE_URL_PROD: z.string(),
  ENV_API_ACTION_BASE_URL_DEV: z.string(),
  ENV_IPFS_CACHE_URL: z.string(),
  ENV_IS_DEV: z.boolean(),
  NEAR_DEFAULT_NETWORK: z.nativeEnum(ENearNetwork),
  ENV_BACKEND_API_METADATA_URL_DEV: z.string(),
  ENV_BACKEND_API_METADATA_URL_PROD: z.string(),
});

export const app_env = zAppEnv.parse({
  ENV_BACKEND_API_BASE_URL_PROD:
    VITE_META_ENV?.VITE_BACKEND_API_URL_PROD ?? "http://localhost:4000",
  ENV_BACKEND_API_BASE_URL_DEV: VITE_META_ENV?.VITE_BACKEND_API_URL_DEV ?? "http://localhost:4000",
  ENV_API_ACTION_BASE_URL_PROD:
    VITE_META_ENV?.VITE_API_ACTION_BASE_URL_PROD ?? "http://localhost:8080/api_action",
  ENV_API_ACTION_BASE_URL_DEV:
    VITE_META_ENV?.VITE_API_ACTION_BASE_URL_DEV ?? "http://localhost:8080/api_action",
  ENV_IPFS_CACHE_URL: VITE_META_ENV?.VITE_IPFS_CACHE_URL ?? "",
  ENV_IS_DEV: VITE_META_ENV?.MODE !== "production",
  NEAR_DEFAULT_NETWORK:
    (VITE_META_ENV?.VITE_NEAR_DEFAULT_NETWORK as ENearNetwork) ?? ENearNetwork.mainnet,
  ENV_BACKEND_API_METADATA_URL_DEV: VITE_META_ENV?.VITE_BACKEND_API_METADATA_URL_DEV,
  ENV_BACKEND_API_METADATA_URL_PROD: VITE_META_ENV?.VITE_BACKEND_API_METADATA_URL_PROD,
});
