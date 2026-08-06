import {
  buildAccountsTransferRequestData,
  type TAllAccountsTransferDataDecrypted,
  type TAllAccountsTransferDataEncrypted,
} from "@meteorwallet/connect-shared";
import type { IMobileBridgeSensitiveTransferSource } from "../target_clients/mobile_bridge/MeteorConnectMobileBridgeClient.types";
import type { MobileBridgeSession } from "../target_clients/mobile_bridge/MobileBridgeSession";
import { TransferKeyHandle } from "./TransferKeyHandle";

/**
 * The sensitive transfer attachment (§ key lifecycle): retains the frozen decrypted account
 * snapshot for the action's lifetime (required for per-bridge payload regeneration) and owns the
 * per-bridge TransferKeyHandle. Attached to the ExecutableAction via a true private field — it
 * never enters request/expandedInput, snapshots, storage, or any serialization.
 */
export class TransferSensitiveAttachment implements IMobileBridgeSensitiveTransferSource {
  #decrypted: TAllAccountsTransferDataDecrypted | undefined;
  #pendingHandle: TransferKeyHandle | undefined;
  #activeHandle: TransferKeyHandle | undefined;

  constructor(decrypted: TAllAccountsTransferDataDecrypted) {
    this.#decrypted = decrypted;
  }

  /**
   * Called by the request adapter for EVERY bridge (initial and refreshed): wipes any previous
   * key, generates a fresh key + nonce + ciphertext from the retained snapshot, and stages the
   * new handle for binding. Never rebinds an old key to a new bridge, by construction.
   */
  async buildFreshBridgePayload(): Promise<TAllAccountsTransferDataEncrypted> {
    const decrypted = this.#decrypted;
    if (decrypted == null) throw new Error("transfer_accounts_attachment_disposed");
    this.#activeHandle?.wipe();
    this.#activeHandle = undefined;
    this.#pendingHandle?.wipe();
    const built = await buildAccountsTransferRequestData({ decrypted });
    this.#pendingHandle = new TransferKeyHandle(built.transferKeyString);
    return built.actionInput;
  }

  /** Called by the mobile-bridge client immediately after constructing the session. */
  bindPendingHandleToSession(session: MobileBridgeSession): void {
    const pending = this.#pendingHandle;
    if (pending == null) return;
    this.#pendingHandle = undefined;
    pending.bindToSession(session);
    this.#activeHandle = pending;
  }

  /** The handle for the current bridge — the reveal card's only key source. */
  getActiveHandle(): TransferKeyHandle | undefined {
    return this.#activeHandle;
  }

  /** Wipes all key material and drops the decrypted snapshot. Idempotent. */
  dispose(): void {
    this.#pendingHandle?.wipe();
    this.#pendingHandle = undefined;
    this.#activeHandle?.wipe();
    this.#activeHandle = undefined;
    this.#decrypted = undefined;
  }

  toJSON(): string {
    return "[REDACTED]";
  }

  toString(): string {
    return "[REDACTED]";
  }
}
