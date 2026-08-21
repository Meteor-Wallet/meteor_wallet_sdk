import { describe, expect, it } from "bun:test";
import { TRANSFER_ACCOUNTS_MAX_ACCOUNTS as SHARED_TRANSFER_ACCOUNTS_MAX_ACCOUNTS } from "@meteorwallet/connect-shared/internal";
import { TRANSFER_ACCOUNTS_MAX_ACCOUNTS } from "./transfer_accounts.limits";

/**
 * Drift tripwire. The SDK re-exports this bound as public API, so it is pinned locally rather
 * than sourced from connect-shared's `/internal` subpath. This test is the only thing keeping
 * the two honest — if it fails, update transfer_accounts.limits.ts, do not weaken the test.
 */
describe("transfer_accounts limits", () => {
  it("TRANSFER_ACCOUNTS_MAX_ACCOUNTS matches connect-shared's bound", () => {
    expect(TRANSFER_ACCOUNTS_MAX_ACCOUNTS).toBe(SHARED_TRANSFER_ACCOUNTS_MAX_ACCOUNTS);
  });
});
