import { Glob } from "bun";

/**
 * Keeps the published SDK off unstable and retired bridge surfaces
 * (REVIEW-consumer-implementation M-05).
 *
 * Two rules, both about what ends up in `dist/`:
 *
 *   1. **No `/internal` imports from shipped code.** `@meteorwallet/connect-shared/internal` is
 *      published only so the backend can resolve it, and it may change without a major bump. It is
 *      also a subpath that only exists in the `exports` map, so a stock Parcel consumer cannot
 *      resolve it at all — the published 3.2.0 could not be bundled by Parcel for exactly this
 *      reason. Test files are exempt: they are not bundled and not published.
 *
 *   2. **No deprecated bridge lifecycle calls.** `BridgeClientBase.apply()` is a documented no-op
 *      that `initializeClient()` performs itself. The reference SDK must not model a retired call
 *      for the integrations that copy it.
 *
 * If a genuinely required value is only on `/internal`, promote it to the curated
 * `@meteorwallet/connect-shared` barrel — do not add it to the allowlist here.
 *
 * Run via `bun run check-public-surface` (wired into `build` and `test`).
 */

const INTERNAL_IMPORT = /from\s+["'][^"']*\/internal["']|require\(\s*["'][^"']*\/internal["']\s*\)/;
const DEPRECATED_LIFECYCLE = /\bsessionClient\.apply\s*\(\s*\)|\bbridgeClient\.apply\s*\(\s*\)/;

/** Test files are neither bundled nor published, so they may reach for internals. */
function isTestFile(path: string): boolean {
  return path.endsWith(".test.ts") || path.includes("/test/") || path.includes("/test_utils/");
}

const problems: string[] = [];

for await (const file of new Glob("src/**/*.ts").scan(".")) {
  if (isTestFile(file)) continue;
  const source = await Bun.file(file).text();
  source.split("\n").forEach((line, index) => {
    if (line.trimStart().startsWith("*") || line.trimStart().startsWith("//")) return;
    if (INTERNAL_IMPORT.test(line)) {
      problems.push(
        `${file}:${index + 1} imports an /internal subpath — promote the value to the public ` +
          `@meteorwallet/connect-shared barrel instead\n      ${line.trim()}`,
      );
    }
    if (DEPRECATED_LIFECYCLE.test(line)) {
      problems.push(
        `${file}:${index + 1} calls the deprecated no-op apply(); initializeClient() does this\n      ${line.trim()}`,
      );
    }
  });
}

if (problems.length > 0) {
  console.error(`✖ published SDK code depends on unstable or retired bridge surface:\n`);
  for (const problem of problems) {
    console.error(`   - ${problem}`);
  }
  process.exit(1);
}

console.log("✔ published SDK code imports only the public bridge surface");
