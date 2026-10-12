import { gzipSync } from "node:zlib";

/**
 * A published bundle-size budget (REVIEW-consumer-implementation M-07).
 *
 * The SDK ships into browser wallets and dApps, where its size is someone else's page-load budget.
 * Without a stated bound, growth is only ever noticed by a consumer — and by then it is in a
 * release. This turns "the bundle got bigger" into a build failure with a number attached.
 *
 * Budgets sit roughly 12% above the measured size when they were last set, so ordinary feature
 * work and patch releases fit without touching this file. The hard limit is there to catch step
 * changes, like an accidentally bundled dependency, a large embedded asset or leaked internal
 * types, and not the slow growth of normal development.
 *
 * Once a file passes WARN_AT of its budget, the build still passes but prints a warning. That is
 * the time to re-baseline: measure, set the budget about 12% above the new size, and give the
 * reason in the commit message. Doing it then means it never has to happen in the middle of a
 * release.
 *
 * History: the Connect/Transfer redesign embedded a continuation GIF plus header and warning
 * SVGs (79a9bf8, 89e627e), ~76 KB raw / ~52 KB gzip per JS entry. The full font set (e761951)
 * added more. Re-baselined for 3.23.0 at index.js 717,100 raw / ~306,500 gzip, index.cjs
 * 726,844 / ~307,400, index.d.ts 137,107 / ~37,700.
 */
const BUDGETS: ReadonlyArray<{
  file: string;
  /** Uncompressed bytes — what a bundler has to parse. */
  maxBytes: number;
  /** Gzipped bytes — what the user actually downloads. */
  maxGzipBytes: number;
  why: string;
}> = [
  {
    file: "dist/index.js",
    maxBytes: 800_000,
    maxGzipBytes: 345_000,
    why: "the ESM entry every bundler consumes",
  },
  {
    file: "dist/index.cjs",
    maxBytes: 810_000,
    maxGzipBytes: 350_000,
    why: "the CommonJS entry, same code through a different emit",
  },
  {
    file: "dist/index.d.ts",
    maxBytes: 155_000,
    maxGzipBytes: 42_000,
    why: "the public type surface; growth here usually means an internal type leaked out",
  },
];

/** Past this fraction of a budget the build warns, so re-baselining happens before it blocks. */
const WARN_AT = 0.95;

const format = (bytes: number): string => `${(bytes / 1024).toFixed(1)} KB`;

const problems: string[] = [];
const warnings: string[] = [];
let widest = 0;
const rows: string[] = [];

for (const budget of BUDGETS) {
  const file = Bun.file(budget.file);
  if (!(await file.exists())) {
    problems.push(`${budget.file} is missing — run \`bun run build\` first`);
    continue;
  }
  const bytes = await file.arrayBuffer();
  const raw = bytes.byteLength;
  const gzip = gzipSync(new Uint8Array(bytes)).byteLength;

  const rawPct = Math.round((raw / budget.maxBytes) * 100);
  const gzipPct = Math.round((gzip / budget.maxGzipBytes) * 100);
  const row = `  ${budget.file.padEnd(18)} ${format(raw).padStart(9)} / ${format(budget.maxBytes).padStart(9)} (${String(rawPct).padStart(3)}%)   gzip ${format(gzip).padStart(9)} / ${format(budget.maxGzipBytes).padStart(9)} (${String(gzipPct).padStart(3)}%)`;
  rows.push(row);
  widest = Math.max(widest, row.length);

  if (raw > budget.maxBytes) {
    problems.push(
      `${budget.file} is ${format(raw)}, over its ${format(budget.maxBytes)} budget (${budget.why})`,
    );
  } else if (raw > budget.maxBytes * WARN_AT) {
    warnings.push(`${budget.file} is at ${rawPct}% of its ${format(budget.maxBytes)} budget`);
  }
  if (gzip > budget.maxGzipBytes) {
    problems.push(
      `${budget.file} is ${format(gzip)} gzipped, over its ${format(budget.maxGzipBytes)} budget (${budget.why})`,
    );
  } else if (gzip > budget.maxGzipBytes * WARN_AT) {
    warnings.push(
      `${budget.file} is at ${gzipPct}% of its ${format(budget.maxGzipBytes)} gzip budget`,
    );
  }
}

console.log(rows.join("\n"));

if (warnings.length > 0) {
  console.warn("\n⚠ published bundle is close to budget:\n");
  for (const warning of warnings) console.warn(`   - ${warning}`);
  console.warn(
    "\nThis still passes. Re-baseline in scripts/check-bundle-size.ts (about 12% above the" +
      "\ncurrent size) in its own commit, so it never blocks a release.",
  );
}

if (problems.length > 0) {
  console.error("\n✖ published bundle is over budget:\n");
  for (const problem of problems) console.error(`   - ${problem}`);
  console.error(
    "\nEither bring the size back down, or raise the budget in scripts/check-bundle-size.ts" +
      "\nin the same commit — with the reason in the commit message.",
  );
  process.exit(1);
}

console.log("\n✔ published bundle is within budget");
