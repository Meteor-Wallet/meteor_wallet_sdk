/**
 * The typed error surface of the new-key transfer SDK (stabilization SD11/XR-4).
 *
 * Every failure the SDK raises on this surface is a {@link NewKeyTransferError} whose `code` is
 * one of {@link NEW_KEY_TRANSFER_ERROR_CODES}. `message` always equals `code`, so hosts that
 * still string-match keep working — but hosts MUST migrate to `instanceof NewKeyTransferError`
 * + `error.code`, which is the only contract: raw message prose is never shown to users.
 *
 * Two shared error surfaces pass through this SDK unchanged and are re-exported from the package
 * index so hosts can `instanceof` them: `AddKeyJournalError` (the crash-safe AddKey runner's 20
 * stable codes) and the `MOBILE_BRIDGE_ENDING` sentinel table for bridge-flow endings.
 */
export const NEW_KEY_TRANSFER_ERROR_CODES = [
  "new_key_transfer_unavailable",
  "new_key_transfer_client_id_conflict",
  "new_key_transfer_orphaned_add_key_recovery",
  "new_key_transfer_wallet_binding_missing",
  /** The session exists but carries no wallet connection to route verification to. */
  "new_key_transfer_wallet_connection_missing",
  "new_key_transfer_session_not_found",
  "new_key_transfer_start_result_journal_missing",
  "new_key_transfer_start_result_conflict",
  /** The journaled start result belongs to a live session and may not be discarded. */
  "new_key_transfer_start_result_referenced",
  "new_key_transfer_start_result_discard_failed",
  "new_key_transfer_no_accounts_ready",
  "new_key_transfer_add_key_account_mismatch",
  "new_key_transfer_add_key_chain_required",
  "new_key_transfer_journal_corrupt",
  /** The session journal is at capacity; archive or clear resolved transfers first (SD10). */
  "new_key_transfer_journal_retention_required",
  "new_key_transfer_verify_before_add_key_intent",
  /** An activation hash disagrees with this transfer's own finalized AddKey journal row. */
  "new_key_transfer_verify_hash_mismatch",
  /**
   * The wallet answered the verification, but persisting the session update failed afterwards.
   * The transfer is NOT failed: re-running `verifyActive` with the same activations converges
   * (wallet verification is idempotent and the terminal result is cached).
   */
  "new_key_transfer_verify_session_update_failed",
  "new_key_transfer_recovery_required",
  "new_key_transfer_revoke_chain_required",
  "new_key_transfer_revoke_destination_key_present",
  "new_key_transfer_revoked_accounts_required",
  "new_key_transfer_revoke_account_mismatch",
  /** Only fully secured (or fully resolved) transfers may be archived (SD10). */
  "new_key_transfer_session_not_terminal",
] as const;

export type TNewKeyTransferErrorCode = (typeof NEW_KEY_TRANSFER_ERROR_CODES)[number];

/** Which fence produced a `new_key_transfer_recovery_required` refusal. */
export type TNewKeyTransferRecoveryFence = "session_intent" | "protected_journal";

export class NewKeyTransferError extends Error {
  readonly code: TNewKeyTransferErrorCode;
  /** Present only on `new_key_transfer_recovery_required` — which fence refused. */
  readonly fence?: TNewKeyTransferRecoveryFence;

  constructor(
    code: TNewKeyTransferErrorCode,
    options?: { fence?: TNewKeyTransferRecoveryFence; cause?: unknown },
  ) {
    super(code, options?.cause != null ? { cause: options.cause } : undefined);
    this.name = "NewKeyTransferError";
    this.code = code;
    this.fence = options?.fence;
  }
}

export const isNewKeyTransferError = (
  error: unknown,
  code?: TNewKeyTransferErrorCode,
): error is NewKeyTransferError =>
  error instanceof NewKeyTransferError && (code == null || error.code === code);
