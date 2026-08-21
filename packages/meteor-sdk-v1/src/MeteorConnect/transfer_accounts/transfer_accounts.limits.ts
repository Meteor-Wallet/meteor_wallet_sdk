/**
 * Mirror of connect-shared's account-count bound, pinned locally so the SDK's PUBLIC export of
 * `TRANSFER_ACCOUNTS_MAX_ACCOUNTS` (src/index.ts) never depends on the `/internal` subpath —
 * the shared package no longer carries this constant on its curated root barrel.
 *
 * `transfer_accounts.limits.test.ts` asserts it still equals the shared value; if that tripwire
 * fires, connect-shared moved the bound and this constant must follow it in the same commit.
 */
export const TRANSFER_ACCOUNTS_MAX_ACCOUNTS = 50;
