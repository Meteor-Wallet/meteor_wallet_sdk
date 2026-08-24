import { describe, expect, it } from "bun:test";
import { TRANSFER_ACCOUNTS_MAX_ACCOUNTS as SHARED_TRANSFER_ACCOUNTS_MAX_ACCOUNTS } from "@meteorwallet/connect-shared";
import { TRANSFER_ACCOUNTS_MAX_ACCOUNTS } from "./transfer_accounts.limits";

/**
 * Drift tripwire. The SDK re-exports this bound as public API and pins it locally so the value
 * survives a connect-shared bump without a silent change. This test is the only thing keeping
 * the two honest — if it fails, update transfer_accounts.limits.ts, do not weaken the test.
 */
describe("transfer_accounts limits", () => {
  it("TRANSFER_ACCOUNTS_MAX_ACCOUNTS matches connect-shared's bound", () => {
    expect(TRANSFER_ACCOUNTS_MAX_ACCOUNTS).toBe(SHARED_TRANSFER_ACCOUNTS_MAX_ACCOUNTS);
  });
});
