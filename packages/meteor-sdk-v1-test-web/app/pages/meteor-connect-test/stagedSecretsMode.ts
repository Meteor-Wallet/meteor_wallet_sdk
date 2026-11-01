/**
 * Where staged account secrets live, read once at init like `?backend=`: the SDK fixes
 * `persistStagedAccounts` per instance, so switching is a full navigation.
 *
 *   (default)              plaintext in this origin's localStorage, so testnet runs are repeatable
 *   ?stagedSecrets=memory  this tab's memory only; a reload forgets them
 *
 * A mainnet secret is a real account's key, so it is only staged in memory (see
 * `StagedAccountsPanel`). Secrets saved before switching stay in storage, unread, and come back
 * when the parameter is dropped.
 */
export const STAGED_SECRETS_IN_MEMORY =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("stagedSecrets") === "memory";

/** Reloads the harness with staged secrets kept in memory, or saved again for `false`. */
export const switchStagedSecretsMode = (inMemory: boolean) => {
  const url = new URL(window.location.href);
  if (inMemory) {
    url.searchParams.set("stagedSecrets", "memory");
  } else {
    url.searchParams.delete("stagedSecrets");
  }
  window.location.assign(url.toString());
};
