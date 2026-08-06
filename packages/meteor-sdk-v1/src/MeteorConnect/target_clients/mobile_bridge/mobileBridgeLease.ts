import type { IEnumerableLocalStorageInterface } from "../../../ported_common/utils/storage/storage.types";
import type {
  IMeteorConnectBridgeLeaseHandle,
  IMeteorConnectBridgeLeaseProvider,
} from "../../MeteorConnect.types";

export class WebLockBridgeLeaseProvider implements IMeteorConnectBridgeLeaseProvider {
  async acquire(
    name: string,
    options?: { timeoutMs?: number },
  ): Promise<IMeteorConnectBridgeLeaseHandle> {
    if (typeof navigator === "undefined" || navigator.locks == null) {
      throw new Error("mobile_bridge_coordination_unsupported");
    }

    const ownerToken = crypto.randomUUID();
    const abortController = new AbortController();
    let releaseLock!: () => void;
    let acquired!: () => void;
    const acquiredPromise = new Promise<void>((resolve) => (acquired = resolve));
    const releasePromise = new Promise<void>((resolve) => (releaseLock = resolve));
    let owned = true;

    const lockTask = navigator.locks.request(
      `meteor-connect:${name}`,
      { signal: abortController.signal },
      async () => {
        acquired();
        await releasePromise;
      },
    );

    const timeoutMs = options?.timeoutMs ?? 15_000;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        acquiredPromise,
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => {
            abortController.abort();
            reject(new Error("mobile_bridge_lease_timeout"));
          }, timeoutMs);
        }),
      ]);
    } catch (error) {
      owned = false;
      await lockTask.catch(() => {});
      throw error;
    } finally {
      if (timeout != null) clearTimeout(timeout);
    }

    return {
      ownerToken,
      assertOwned: async () => {
        if (!owned) throw new Error("mobile_bridge_lease_lost");
      },
      release: async () => {
        if (!owned) return;
        owned = false;
        releaseLock();
        await lockTask;
      },
    };
  }
}

interface IBakeryTicket {
  choosing: boolean;
  number: number;
  expiresAt: number;
}

/** Lamport bakery lock over unique enumerable storage registers (no unsafe shared RMW record). */
export class StorageBakeryBridgeLeaseProvider implements IMeteorConnectBridgeLeaseProvider {
  constructor(
    private readonly storage: IEnumerableLocalStorageInterface,
    private readonly prefix = "met_bridge_lease::",
  ) {}

  async acquire(
    name: string,
    options?: { timeoutMs?: number },
  ): Promise<IMeteorConnectBridgeLeaseHandle> {
    const ownerToken = crypto.randomUUID();
    const keyPrefix = `${this.prefix}${encodeURIComponent(name)}::`;
    const ownKey = `${keyPrefix}${ownerToken}`;
    const timeoutMs = options?.timeoutMs ?? 15_000;
    const deadline = Date.now() + timeoutMs;
    const ttlMs = Math.max(30_000, timeoutMs * 2);
    let owned = true;
    const write = async (ticket: IBakeryTicket) =>
      this.storage.setItem(ownKey, JSON.stringify(ticket));
    const readTickets = async () => {
      const keys = await this.storage.getKeys(keyPrefix);
      const entries = await Promise.all(
        keys.map(async (key) => {
          try {
            const value = await this.storage.getItem(key);
            return value == null ? undefined : { key, ticket: JSON.parse(value) as IBakeryTicket };
          } catch {
            return undefined;
          }
        }),
      );
      const now = Date.now();
      await Promise.all(
        entries
          .filter((entry) => entry != null && entry.ticket.expiresAt <= now)
          .map((entry) => this.storage.removeItem(entry!.key)),
      );
      return entries.filter(
        (entry): entry is { key: string; ticket: IBakeryTicket } =>
          entry != null && entry.ticket.expiresAt > now,
      );
    };

    await write({ choosing: true, number: 0, expiresAt: Date.now() + ttlMs });
    const firstRead = await readTickets();
    const number = Math.max(0, ...firstRead.map((entry) => entry.ticket.number)) + 1;
    await write({ choosing: false, number, expiresAt: Date.now() + ttlMs });

    while (true) {
      if (Date.now() > deadline) {
        owned = false;
        await this.storage.removeItem(ownKey);
        throw new Error("mobile_bridge_lease_timeout");
      }
      const tickets = await readTickets();
      const blocked = tickets.some((entry) => {
        if (entry.key === ownKey) return false;
        if (entry.ticket.choosing) return true;
        const otherToken = entry.key.slice(keyPrefix.length);
        return (
          entry.ticket.number > 0 &&
          (entry.ticket.number < number ||
            (entry.ticket.number === number && otherToken.localeCompare(ownerToken) < 0))
        );
      });
      if (!blocked) break;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }

    const heartbeat = setInterval(() => {
      if (!owned) return;
      void write({ choosing: false, number, expiresAt: Date.now() + ttlMs }).catch(() => {
        owned = false;
      });
    }, ttlMs / 3);

    return {
      ownerToken,
      assertOwned: async () => {
        if (!owned || (await this.storage.getItem(ownKey)) == null) {
          throw new Error("mobile_bridge_lease_lost");
        }
        await write({ choosing: false, number, expiresAt: Date.now() + ttlMs });
      },
      release: async () => {
        clearInterval(heartbeat);
        if (!owned) return;
        owned = false;
        await this.storage.removeItem(ownKey);
      },
    };
  }
}

export const directBrowserNativeAppOpener = {
  open(fullLink: string): void {
    const anchor = document.createElement("a");
    anchor.href = fullLink;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  },
};
