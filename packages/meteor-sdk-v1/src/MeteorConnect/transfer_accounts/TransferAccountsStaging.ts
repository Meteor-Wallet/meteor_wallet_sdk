import {
  buildAccountSecretData,
  type TAccountBasicData,
  type TAccountSecretData,
  type TAccountTransferDataDecrypted,
  TRANSFER_ACCOUNTS_ACCOUNT_ID_PATTERN,
  vAccountTransferDataDecrypted,
} from "@meteorwallet/connect-shared";
import {
  TRANSFER_ACCOUNTS_MAX_SECRETS_PER_ACCOUNT,
  vAccountBasicData,
} from "@meteorwallet/connect-shared/internal";
import { stringifyCanonicalJson } from "@nice-code/util";
import * as v from "valibot";
import type { ITypedStorageHelper } from "../../ported_common/utils/storage/TypedStorageHelper";
import type { IMeteorConnectTypedStorage } from "../MeteorConnect.types";
import { TRANSFER_ACCOUNTS_MAX_ACCOUNTS } from "./transfer_accounts.limits";
import type {
  IStageTransferAccountInput,
  TParseTransferSecretInputResult,
  TStagedTransferAccountSummary,
  TStageTransferAccountResult,
} from "./transfer_accounts.types";

/**
 * Live secret-kind detection for partner UIs ("detected: mnemonic"), without staging anything.
 * A thin wrapper over the shared encoder — the SDK contains zero detection rules of its own.
 */
export function parseTransferSecretInput(secretInput: string): TParseTransferSecretInputResult {
  const result = buildAccountSecretData({ secretInput });
  // `=== true` rather than a bare truthiness check: this file is compiled by sibling packages
  // whose tsconfigs leave `strictNullChecks` off, and only an explicit literal comparison narrows
  // a boolean-discriminated union there.
  if (result.ok === true) return { type: result.secret.type };
  return { type: "invalid", reason: result.reason };
}

function identityKey(identity: TAccountBasicData): string {
  return `${identity.blockchainId}::${identity.networkId}::${identity.accountId}`;
}

function toSummary(account: TAccountTransferDataDecrypted): TStagedTransferAccountSummary {
  return {
    blockchainId: account.blockchainId,
    networkId: account.networkId,
    accountId: account.accountId,
    secretTypes: account.secret.map((secret) => secret.type),
  };
}

/**
 * Staged transfer accounts: plaintext secrets held in memory by default, with opt-in
 * plaintext-at-rest persistence under the `met_data_` typed-storage namespace (§ staged-account
 * storage). All encoding/validation delegates to the shared connect-shared schemas — the SDK
 * only adds typed reason codes and friendly copy.
 */
export class TransferAccountsStaging {
  private accounts: TAccountTransferDataDecrypted[] = [];
  private loadPromise?: Promise<void>;

  constructor(
    private readonly options: {
      persist: boolean;
      getStorage: () => ITypedStorageHelper<IMeteorConnectTypedStorage>;
      /** Testing escape hatch (IMeteorConnectTransferAccountsConfig.maxStagedAccounts). */
      maxAccounts?: number;
    },
  ) {}

  /** Lazily (re)hydrates the persisted set; schema-invalid stored data is dropped, not thrown. */
  private ensureLoaded(): Promise<void> {
    if (!this.options.persist) return Promise.resolve();
    this.loadPromise ??= (async () => {
      const stored = await this.options.getStorage().getJson("stagedTransferAccounts");
      if (stored == null) return;
      const parsed = v.safeParse(v.array(vAccountTransferDataDecrypted), stored);
      this.accounts = parsed.success ? parsed.output : [];
    })();
    return this.loadPromise;
  }

  private async persistIfEnabled(): Promise<void> {
    if (!this.options.persist) return;
    await this.options.getStorage().setJson("stagedTransferAccounts", this.accounts);
  }

  async stage(input: IStageTransferAccountInput): Promise<TStageTransferAccountResult> {
    await this.ensureLoaded();

    const identityCandidate = {
      blockchainId: input.blockchainId ?? "near",
      networkId: input.networkId,
      accountId: input.accountId.trim().toLowerCase(),
    };
    if (!TRANSFER_ACCOUNTS_ACCOUNT_ID_PATTERN.test(identityCandidate.accountId)) {
      return {
        ok: false,
        reason: "invalid_account_id",
        message: "Account ID may only contain lowercase letters, digits, and . _ - characters.",
      };
    }
    const identityParsed = v.safeParse(vAccountBasicData, identityCandidate);
    if (!identityParsed.success) {
      return {
        ok: false,
        reason: "invalid_account_id",
        message: identityParsed.issues[0]?.message ?? "Invalid account ID.",
      };
    }
    const identity = identityParsed.output;

    const secretResult = buildAccountSecretData({
      secretInput: input.secretInput,
      derivationPath: input.derivationPath,
    });
    if (secretResult.ok === false) {
      switch (secretResult.reason) {
        case "empty_secret_input":
          return {
            ok: false,
            reason: secretResult.reason,
            message: "Provide a mnemonic phrase or an ed25519 private key.",
          };
        case "invalid_private_key":
          return {
            ok: false,
            reason: secretResult.reason,
            message: "That doesn't look like a valid ed25519 private key.",
          };
        case "invalid_mnemonic_word_count":
          return {
            ok: false,
            reason: secretResult.reason,
            wordCount: secretResult.wordCount,
            message: `A mnemonic should be 12 or 24 words (got ${secretResult.wordCount}). Private keys must start with "ed25519:".`,
          };
        case "invalid_secret_data":
          return {
            ok: false,
            reason: secretResult.reason,
            message: `Secret rejected: ${secretResult.issueMessage}`,
          };
      }
    }
    const secret: TAccountSecretData = secretResult.secret;

    const existing = this.accounts.find(
      (account) => identityKey(account) === identityKey(identity),
    );
    const maxAccounts = this.options.maxAccounts ?? TRANSFER_ACCOUNTS_MAX_ACCOUNTS;
    if (existing == null && this.accounts.length >= maxAccounts) {
      return {
        ok: false,
        reason: "too_many_accounts",
        message:
          maxAccounts === TRANSFER_ACCOUNTS_MAX_ACCOUNTS
            ? `A transfer supports at most ${TRANSFER_ACCOUNTS_MAX_ACCOUNTS} accounts.`
            : `At most ${maxAccounts} accounts can be staged (a single transfer still supports at most ${TRANSFER_ACCOUNTS_MAX_ACCOUNTS}).`,
      };
    }
    if (existing != null) {
      const secretJson = stringifyCanonicalJson(secret);
      if (existing.secret.some((entry) => stringifyCanonicalJson(entry) === secretJson)) {
        return {
          ok: false,
          reason: "duplicate_secret",
          message: "That secret is already staged for this account.",
        };
      }
      if (existing.secret.length >= TRANSFER_ACCOUNTS_MAX_SECRETS_PER_ACCOUNT) {
        return {
          ok: false,
          reason: "too_many_secrets",
          message: `An account supports at most ${TRANSFER_ACCOUNTS_MAX_SECRETS_PER_ACCOUNT} secrets.`,
        };
      }
    }

    // Schema backstop: the merged entry must satisfy the exact wire schema, so any failure the
    // typed checks above missed still surfaces here instead of at create_bridge.
    const candidateAccount: TAccountTransferDataDecrypted = {
      ...identity,
      secret: existing == null ? [secret] : [...existing.secret, secret],
    };
    const accountParsed = v.safeParse(vAccountTransferDataDecrypted, candidateAccount);
    if (!accountParsed.success) {
      return {
        ok: false,
        reason: "invalid_secret_data",
        message: accountParsed.issues[0]?.message ?? "Staged account failed validation.",
      };
    }

    this.accounts =
      existing == null
        ? [...this.accounts, accountParsed.output]
        : this.accounts.map((account) =>
            identityKey(account) === identityKey(identity) ? accountParsed.output : account,
          );
    await this.persistIfEnabled();
    return { ok: true, account: toSummary(accountParsed.output) };
  }

  async getStagedSummaries(): Promise<TStagedTransferAccountSummary[]> {
    await this.ensureLoaded();
    return this.accounts.map(toSummary);
  }

  /** Hazard is in the name — the full staged shape including plaintext secrets. */
  async getStagedWithSecrets(): Promise<TAccountTransferDataDecrypted[]> {
    await this.ensureLoaded();
    return this.accounts.map((account) => ({ ...account, secret: [...account.secret] }));
  }

  async removeStaged(identifier: TAccountBasicData): Promise<void> {
    await this.ensureLoaded();
    this.accounts = this.accounts.filter(
      (account) => identityKey(account) !== identityKey(identifier),
    );
    await this.persistIfEnabled();
  }

  async clearStaged(): Promise<void> {
    await this.ensureLoaded();
    this.accounts = [];
    if (this.options.persist) {
      await this.options.getStorage().removeItem("stagedTransferAccounts");
    }
  }

  /** Drops the in-memory set without touching persisted data (MeteorConnect.dispose()). */
  dropInMemory(): void {
    this.accounts = [];
    this.loadPromise = undefined;
  }
}
