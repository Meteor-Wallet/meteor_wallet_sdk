import { Glob } from "bun";

/**
 * Guards the transfer-key confinement rule (PLAN-sdk-transfer-accounts §7): the account-transfer
 * decryption key must exist only inside TransferKeyHandle and the code that mints it. Ported from
 * mc_backend/scripts/check-key-confinement.ts — a coarse textual guard, not taint analysis: it
 * cannot prove an allowed file handles the key correctly, but it does prove no NEW file started
 * handling it, and that the key never meets a logger or storage API.
 *
 * Run via `bun run check-key-confinement` (wired into the package `test` flow / CI).
 */

const KEY_SYMBOL = "transferKeyString";

/** Every file permitted to reference the key, with why. Keep the reasons. */
const ALLOWED_FILES: ReadonlyMap<string, string> = new Map([
  [
    "src/MeteorConnect/transfer_accounts/TransferKeyHandle.ts",
    "the single holder — private field, session-bound reveal gate, wipe()",
  ],
  [
    "src/MeteorConnect/transfer_accounts/TransferSensitiveAttachment.ts",
    "mints handles from buildAccountsTransferRequestData's transferKeyString per bridge",
  ],
  [
    "src/MeteorConnect/transfer_accounts/transfer_accounts.test.ts",
    "canary + lifecycle tests for the above",
  ],
]);

/** Places the key must never appear, regardless of file — checked inside allowed files too. */
const FORBIDDEN_PATTERNS: ReadonlyArray<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /console\.[a-z]+\([^)]*transferKeyString/,
    reason: "the key must never be logged",
  },
  {
    pattern: /(localStorage|sessionStorage|storageAdapter|setJson|setItem)[^\n]*transferKeyString/,
    reason: "the key must never be persisted",
  },
  {
    pattern: /transferKeyString[^\n]*(localStorage|sessionStorage|storageAdapter|setJson|setItem)/,
    reason: "the key must never be persisted",
  },
];

const SEARCH_GLOB = "{src,preview}/**/*.{ts,tsx,mjs}";

const toPosix = (path: string): string => path.replaceAll("\\", "/");

const run = async (): Promise<number> => {
  const violations: string[] = [];
  const seenAllowed = new Set<string>();

  for await (const file of new Glob(SEARCH_GLOB).scan({ cwd: process.cwd(), onlyFiles: true })) {
    const relativePath = toPosix(file);
    const contents = await Bun.file(relativePath).text();
    if (!contents.includes(KEY_SYMBOL)) continue;

    if (ALLOWED_FILES.has(relativePath)) {
      seenAllowed.add(relativePath);
    } else {
      violations.push(
        `  ${relativePath}\n` +
          `    references "${KEY_SYMBOL}" but is not on the allowlist.\n` +
          `    The transfer key must stay inside TransferKeyHandle (PLAN-sdk-transfer-accounts §7).\n` +
          `    If this is genuinely correct, add the file to ALLOWED_FILES in scripts/check-key-confinement.ts with a reason.`,
      );
      continue;
    }

    for (const { pattern, reason } of FORBIDDEN_PATTERNS) {
      const lines = contents.split("\n");
      lines.forEach((line, index) => {
        if (pattern.test(line)) {
          violations.push(`  ${relativePath}:${index + 1}\n    ${reason}:\n    ${line.trim()}`);
        }
      });
    }
  }

  // A stale allowlist entry means the rule documents a file that moved — the next real violation
  // there would slip through.
  const stale = [...ALLOWED_FILES.keys()].filter((path) => !seenAllowed.has(path));
  for (const path of stale) {
    violations.push(
      `  ${path}\n    is on the allowlist but no longer references "${KEY_SYMBOL}" (or no longer exists).\n    Remove the stale entry from scripts/check-key-confinement.ts.`,
    );
  }

  if (violations.length > 0) {
    console.error(`\n✖ Transfer-key confinement check failed:\n\n${violations.join("\n\n")}\n`);
    return 1;
  }

  console.log(
    `✔ Transfer-key confinement OK — "${KEY_SYMBOL}" appears only in the ${ALLOWED_FILES.size} allowed files.`,
  );
  return 0;
};

process.exit(await run());
