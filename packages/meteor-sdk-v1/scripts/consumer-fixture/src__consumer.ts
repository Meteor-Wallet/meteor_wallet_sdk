// Type-level consumer. `skipLibCheck` is off in the fixture tsconfig on purpose: the shipped
// `.d.ts` must be self-contained, resolving only against packages the consumer actually installs.
// The 3.2.0 types referenced `near-api-js/lib/providers/index.js`, which is what forced a
// downstream `.d.ts` patch.
import {
  METEOR_CONNECT_BACKENDS,
  MeteorConnect,
  MeteorWallet,
  TRANSFER_ACCOUNTS_MAX_ACCOUNTS,
  deriveLocalBackendUrl,
  type IMeteorWallet_Init_Inputs,
  type TMeteorConnectBackendEnvironment,
} from "@meteorwallet/sdk";

const backend: TMeteorConnectBackendEnvironment = "production";
export const backendUrl: string = METEOR_CONNECT_BACKENDS[backend];
export const localBackendUrl: string | null = deriveLocalBackendUrl("localhost");
export const maxAccounts: number = TRANSFER_ACCOUNTS_MAX_ACCOUNTS;

// `IMeteorWallet_Init_Inputs` used to extend `near-api-js`'s `ConnectConfig`. It now extends a
// locally declared structural equivalent, so a plain object literal must still satisfy it.
export const initInputs: IMeteorWallet_Init_Inputs = {
  networkId: "testnet",
  nodeUrl: "https://rpc.testnet.near.org",
  appKeyPrefix: "consumer-fixture",
};

export type Ctors = [typeof MeteorConnect, typeof MeteorWallet];
