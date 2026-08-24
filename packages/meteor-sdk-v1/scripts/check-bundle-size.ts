import { gzipSync } from "node:zlib";

/**
 * A published bundle-size budget (REVIEW-consumer-implementation M-07).
 *
 * The SDK ships into browser wallets and dApps, where its size is someone else's page-load budget.
 * Without a stated bound, growth is only ever noticed by a consumer — and by then it is in a
 * release. This turns "the bundle got bigger" into a build failure with a number attached.
 *
 * Raising a budget is a deliberate act: change the number here, in the same commit as the change
 * that needs it, and say why in the commit message. Do not raise it to make a red build green.
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
    maxBytes: 520_000,
    maxGzipBytes: 170_000,
    why: "the ESM entry every bundler consumes",
  },
  {
    file: "dist/index.cjs",
    maxBytes: 530_000,
    maxGzipBytes: 175_000,
    why: "the CommonJS entry, same code through a different emit",
  },
  {
    file: "dist/index.d.ts",
    maxBytes: 140_000,
    maxGzipBytes: 40_000,
    why: "the public type surface; growth here usually means an internal type leaked out",
  },
];

const format = (bytes: number): string => `${(bytes / 1024).toFixed(1)} KB`;

const problems: string[] = [];
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
  }
  if (gzip > budget.maxGzipBytes) {
    problems.push(
      `${budget.file} is ${format(gzip)} gzipped, over its ${format(budget.maxGzipBytes)} budget (${budget.why})`,
    );
  }
}

console.log(rows.join("\n"));

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
