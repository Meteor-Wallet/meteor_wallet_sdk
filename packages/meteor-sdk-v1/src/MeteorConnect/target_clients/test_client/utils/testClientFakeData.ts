import { KeyPairEd25519 } from "@near-js/crypto";
import type {
  IMeteorConnectAccount,
  IMeteorConnectNetworkTarget,
  TMeteorConnectionTarget,
  TMeteorConnectPublicKey,
} from "../../../MeteorConnect.types.ts";

export function createFakePublicKey(): TMeteorConnectPublicKey {
  return {
    type: "ed25519",
    publicKey: KeyPairEd25519.fromRandom().getPublicKey().toString(),
    meta: {
      isTestKey: true,
    },
  };
}

export function createFakeAccount(
  networkTarget: IMeteorConnectNetworkTarget,
  connection: TMeteorConnectionTarget,
): IMeteorConnectAccount {
  return {
    identifier: {
      ...networkTarget,
      accountId: `test-${Math.round(Math.random() * 100000 + 100000)}.${networkTarget.network === "mainnet" ? "near" : "testnet"}`,
    },
    connection,
    publicKeys: [createFakePublicKey()],
  };
}
