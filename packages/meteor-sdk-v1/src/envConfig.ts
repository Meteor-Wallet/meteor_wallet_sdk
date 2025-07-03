import { WALLET_URL_PRODUCTION_BASE } from "./MeteorWalletConstants";

interface IEnvConfig {
  wallet_base_url: string;
}

const locallySetBaseUrl =
  typeof window !== "undefined"
    ? window.localStorage.getItem("DEV__METEOR_WALLET_BASE_URL")
    : undefined;

export const envConfig: IEnvConfig = {
  wallet_base_url: locallySetBaseUrl ?? WALLET_URL_PRODUCTION_BASE,
};

// console.log("Initialized environment", envConfig);

export function setEnvConfig(config: Partial<IEnvConfig>) {
  Object.assign(envConfig, config);
}
