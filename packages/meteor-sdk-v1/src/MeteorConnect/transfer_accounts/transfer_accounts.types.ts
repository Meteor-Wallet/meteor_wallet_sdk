import type {
  TAccountBasicData,
  TBlockchainId,
  TCryptoGenericNetworkId,
} from "@meteorwallet/connect-shared";

/**
 * Raw partner input for staging one secret against one account. The SDK owns parsing + encoding
 * into the shared TAccountSecretData shape (via connect-shared's buildAccountSecretData).
 */
export interface IStageTransferAccountInput {
  /** Optional — defaults to "near", the only blockchainId in transfer v1. */
  blockchainId?: TBlockchainId;
  networkId: TCryptoGenericNetworkId;
  /** Trimmed + lowercased, then validated by vAccountBasicData (2..64, NEAR account grammar). */
  accountId: string;
  /** Mnemonic phrase (12/24 words) OR "ed25519:<base58>" private key. */
  secretInput: string;
  /** Mnemonic secrets only. Passed through to buildAccountSecretData; defaults to the shared NEAR_DEFAULT_DERIVATION_PATH. */
  derivationPath?: string;
}

/** Secret-free summary for partner UI listings — identity tuple + what kinds of secrets are staged. */
export type TStagedTransferAccountSummary = TAccountBasicData & {
  secretTypes: Array<"mnemonic" | "private_key">;
};

/**
 * Typed staging failure reasons. The secret-level reasons are passed through verbatim from
 * connect-shared's buildAccountSecretData (TBuildAccountSecretDataResult); the account/set-level
 * reasons are SDK-added.
 */
export type TStageTransferAccountFailureReason =
  | "invalid_account_id"
  | "empty_secret_input"
  | "invalid_private_key"
  | "invalid_mnemonic_word_count"
  | "invalid_secret_data"
  | "duplicate_secret"
  | "too_many_secrets"
  | "too_many_accounts";

export type TStageTransferAccountResult =
  | { ok: true; account: TStagedTransferAccountSummary }
  | {
      ok: false;
      reason: TStageTransferAccountFailureReason;
      message: string;
      /** Present for invalid_mnemonic_word_count — from the shared encoder. */
      wordCount?: number;
    };

/** Live "detected: mnemonic" feedback for partner UIs, without staging anything. */
export type TParseTransferSecretInputResult =
  | { type: "mnemonic" | "private_key" }
  | { type: "invalid"; reason: string };

export type TTransferAccountsOutcome =
  | { status: "imported" } // wallet returned signed { success: true }
  | { status: "declined" } // wallet returned signed { success: false } (explicit decline/give-up)
  | { status: "cancelled" } // user closed/cancelled locally before commitment
  | { status: "expired" } // bridge expired with no signed result (user abandoned the wallet-side flow)
  | {
      status: "failed";
      reason: "pin_attempts_exhausted" | "wallet_update_required" | "bridge_failed";
    };

export interface ITransferAccountsPromptOptions {
  /** Override the staged set for this transfer (bypasses staging storage entirely). */
  accounts?: import("@meteorwallet/connect-shared").TAccountTransferDataDecrypted[];
}
