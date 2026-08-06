import type { MobileBridgeSession } from "../target_clients/mobile_bridge/MobileBridgeSession";

export interface ITransferKeyRevealPayload {
  /** The raw mck1 key string — QR content, verbatim. */
  raw: string;
  /** Display form: grouped in 4s for human transcription. */
  grouped: string;
}

function groupKeyForDisplay(key: string): string {
  return key.match(/.{1,4}/g)?.join(" ") ?? key;
}

const TERMINAL_PHASES = ["completed", "failed", "cancelled"];

/**
 * The only holder of a transfer decrypt key (§ transfer key lifecycle). Bound to exactly one
 * MobileBridgeSession — the one whose create_bridge carried this key's ciphertext. Instance
 * binding is the structural guarantee that a key generated for one bridge can never meet another
 * bridge's wallet_action. The key string lives in a true ECMAScript private field: invisible to
 * JSON.stringify, spread, Object.keys, and property enumeration.
 */
export class TransferKeyHandle {
  #transferKeyString: string | undefined;
  #boundSession: MobileBridgeSession | undefined;

  constructor(transferKeyString: string) {
    this.#transferKeyString = transferKeyString;
  }

  /** One-shot: called by the transfer attachment immediately after session construction. */
  bindToSession(session: MobileBridgeSession): void {
    if (this.#boundSession != null) throw new Error("transfer_key_handle_already_bound");
    this.#boundSession = session;
    // The handle's lifetime never outlives its bridge: wipe on every terminal phase.
    const unsubscribe = session.subscribe((snapshot) => {
      if (TERMINAL_PHASES.includes(snapshot.phase)) {
        this.wipe();
        unsubscribe();
      }
    });
  }

  /**
   * Non-null ONLY while `session` is the bound instance AND its authoritative phase is
   * "wallet_action" AND the handle is unwiped. The reveal card calls this on every render — if
   * the gate lapses (phase regression, reconnect, wipe), the render returns to hidden.
   */
  getRevealPayload(session: MobileBridgeSession): ITransferKeyRevealPayload | null {
    const key = this.#transferKeyString;
    if (key == null) return null;
    if (this.#boundSession == null || session !== this.#boundSession) return null;
    if (session.getSnapshot().phase !== "wallet_action") return null;
    return { raw: key, grouped: groupKeyForDisplay(key) };
  }

  /** Idempotent. */
  wipe(): void {
    this.#transferKeyString = undefined;
  }

  isWiped(): boolean {
    return this.#transferKeyString == null;
  }

  toJSON(): string {
    return "[REDACTED]";
  }

  toString(): string {
    return "[REDACTED]";
  }
}
