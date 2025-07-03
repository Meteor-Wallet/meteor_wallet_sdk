import { ConfigStore } from "dynamic-config-store";

interface IServerConfig {
  port: string;
  api: {
    apiBasePath: string;
  };
  appKeys: string[];
  isProductionEnv: boolean;
  SENTRY_DSN?: string;
  INDEXER_DB: {
    MAINNET: string;
    TESTNET: string;
    BETANET?: string;
    LOCALNET?: string;
  };
}

export const ServerConfig = new ConfigStore<IServerConfig>({
  port: "8080",
  api: {
    apiBasePath: "/api_actions",
  },
  appKeys: ["meteor-secret-key-123asd"],
  isProductionEnv: false,
  SENTRY_DSN: process.env.APP_SENTRY_DSN,
  INDEXER_DB: {
    MAINNET:
      process.env.APP_INDEXER_DB_MAINNET ||
      "postgres://public_readonly:nearprotocol@mainnet.db.explorer.indexer.near.dev/mainnet_explorer",
    TESTNET:
      process.env.APP_INDEXER_DB_TESTNET ||
      "postgres://public_readonly:nearprotocol@testnet.db.explorer.indexer.near.dev/testnet_explorer",
    BETANET: process.env.APP_INDEXER_DB_BETANET,
    LOCALNET: process.env.APP_INDEXER_DB_LOCALNET,
  },
});
