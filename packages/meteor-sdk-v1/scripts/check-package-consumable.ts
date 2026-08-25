import { $ } from "bun";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

/**
 * Release gate for B-01 (REVIEW-consumer-implementation §3): prove that the **published tarball**
 * — not the workspace source, which resolves against hoisted monorepo packages a consumer will
 * never have — can actually be consumed.
 *
 * `bun run build` succeeding is not evidence of this. The 3.2.0 build was green while both
 * generated entry points threw `ERR_PACKAGE_PATH_NOT_EXPORTED`, because the bundler had inlined an
 * undeclared transitive `@noble/curves` v1 and left its `@noble/hashes/sha512` subpath imports
 * pointing at the declared `@noble/hashes` v2. Downstream (my-near-wallet) papered over it by
 * patching the generated files byte-for-byte. This fixture is what makes that class of failure
 * visible before publish rather than after.
 *
 * What it does:
 *   1. `npm pack` the package as it would be published.
 *   2. Install that tarball into an empty project, from the real registry.
 *   3. Load it through BOTH advertised entry points: `require()` (CJS) and `import()` (ESM).
 *   4. Type-check a consumer file against the shipped `.d.ts` with `tsc --strict`.
 *   5. Bundle it with Vite and with Parcel — the two bundlers our consumers actually use.
 *
 * Usage:
 *   bun run check-package-consumable            # full gate (installs Vite + Parcel; slow)
 *   bun run check-package-consumable --quick    # entry points + types only, no bundlers
 *   bun run check-package-consumable --keep     # leave the temp project for inspection
 */

const PACKAGE_DIR = resolve(import.meta.dir, "..");
const FIXTURE_DIR = join(PACKAGE_DIR, "scripts", "consumer-fixture");
const QUICK = process.argv.includes("--quick");
const KEEP = process.argv.includes("--keep");
/**
 * `--local <name>=<packageDir>` packs a workspace package and installs it in place of the registry
 * copy, via npm `overrides` so transitive dependents get it too. Use it to prove a coordinated
 * cross-repo release works BEFORE anything is published — e.g.
 *   --local @meteorwallet/connect-shared=../../../meteor-connect-bridge/packages/meteor-connect-shared
 * Without it the fixture resolves every dependency from the registry, which is what a real
 * consumer gets and what the release gate must ultimately be green against.
 */
const LOCAL_OVERRIDES: Array<{ name: string; dir: string }> = [];
for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i] !== "--local") continue;
  const spec = process.argv[i + 1] ?? "";
  const at = spec.lastIndexOf("=");
  if (at <= 0) throw new Error(`--local expects <name>=<packageDir>, got "${spec}"`);
  LOCAL_OVERRIDES.push({ name: spec.slice(0, at), dir: resolve(PACKAGE_DIR, spec.slice(at + 1)) });
}

function packTarball(dir: string, label: string): string {
  const result = Bun.spawnSync(["npm", "pack", "--json", "--pack-destination", tmpdir()], {
    cwd: dir,
    stdout: "pipe",
    stderr: "pipe",
  });
  if (result.exitCode !== 0) {
    console.error(result.stderr.toString());
    throw new Error(`npm pack failed for ${label}`);
  }
  // npm <=11 emits an array; npm 12's `pack --json` emits an object keyed by package name.
  const parsed = JSON.parse(result.stdout.toString());
  const info = (Array.isArray(parsed) ? parsed[0] : Object.values(parsed)[0]) as {
    filename: string;
    size: number;
    entryCount: number;
  };
  console.log(`   ✔ ${info.filename} (${(info.size / 1024 / 1024).toFixed(2)} MB, ${info.entryCount} entries)`);
  return join(tmpdir(), info.filename);
}

const pkg = JSON.parse(readFileSync(join(PACKAGE_DIR, "package.json"), "utf8"));
const PKG_NAME: string = pkg.name;

const failures: string[] = [];

function step(name: string) {
  console.log(`\n── ${name}`);
}

async function run(name: string, cwd: string, cmd: string[]): Promise<boolean> {
  step(name);
  const proc = Bun.spawnSync(cmd, { cwd, stdout: "pipe", stderr: "pipe" });
  const out = `${proc.stdout.toString()}${proc.stderr.toString()}`.trim();
  if (proc.exitCode === 0) {
    console.log("   ✔ ok");
    return true;
  }
  console.log(out.split("\n").slice(-40).map((l) => `   ${l}`).join("\n"));
  console.log(`   ✖ FAILED (exit ${proc.exitCode})`);
  failures.push(name);
  return false;
}

// ── 1. build, then pack ───────────────────────────────────────────────────────
// Building here is not a convenience: packing a stale `dist/` would let the gate pass against an
// artifact that no longer matches `src/`, which is precisely the false-positive it exists to stop.
step("build the package from source");
const buildOut = Bun.spawnSync(["bun", "run", "build"], { cwd: PACKAGE_DIR, stdout: "pipe", stderr: "pipe" });
if (buildOut.exitCode !== 0) {
  console.error(`${buildOut.stdout.toString()}${buildOut.stderr.toString()}`);
  throw new Error("build failed — nothing to check");
}
console.log("   ✔ ok");

step("pack the publishable tarball");
const tarball = packTarball(PACKAGE_DIR, PKG_NAME);

const overrides: Record<string, string> = {};
if (LOCAL_OVERRIDES.length > 0) {
  step("pack unpublished local packages requested with --local");
  for (const { name, dir } of LOCAL_OVERRIDES) {
    overrides[name] = `file:${packTarball(dir, name)}`;
  }
}

// ── 2. empty consumer project ─────────────────────────────────────────────────
const projectDir = mkdtempSync(join(tmpdir(), "meteor-sdk-consumer-"));
console.log(`   consumer project: ${projectDir}`);

try {
  mkdirSync(join(projectDir, "src"), { recursive: true });

  // `@types/node`: the SDK uses `Buffer` in two public type positions, so the shipped `.d.ts`
  // carries `/// <reference types="node" />`. A NEAR consumer has this; the fixture must too.
  const devDeps: Record<string, string> = { typescript: "5.9.3", "@types/node": "24.2.1" };
  if (!QUICK) {
    devDeps.vite = "7.1.5";
    devDeps.parcel = "2.16.0";
    // `buffer` is the Node polyfill Parcel reaches for because the SDK (like near-api-js) uses
    // `Buffer`. Providing it is what a real NEAR Parcel consumer does; letting Parcel auto-install
    // it mid-build is not reproducible. Note the fixture deliberately does NOT set
    // `@parcel/resolver-default.packageExports` — the package must resolve under stock Parcel.
    devDeps.buffer = "6.0.3";
    devDeps.process = "0.11.10";
  }

  writeFileSync(
    join(projectDir, "package.json"),
    `${JSON.stringify(
      {
        name: "meteor-sdk-consumer-fixture",
        version: "0.0.0",
        private: true,
        type: "module",
        dependencies: { [PKG_NAME]: `file:${tarball}` },
        devDependencies: devDeps,
        ...(Object.keys(overrides).length > 0 ? { overrides } : {}),
      },
      null,
      2,
    )}\n`,
  );

  const fixtureFiles = [
    "cjs-entry.cjs",
    "esm-entry.mjs",
    "resolve-artifacts.mjs",
    "tsconfig.json",
    "src/consumer.ts",
    "src/vite-entry.ts",
    "index.html",
  ];
  for (const file of fixtureFiles) {
    writeFileSync(join(projectDir, file), readFileSync(join(FIXTURE_DIR, file.replace("/", "__")), "utf8"));
  }

  if (!(await run("install the tarball into the empty project", projectDir, ["npm", "install", "--no-audit", "--no-fund"]))) {
    throw new Error("install failed — later steps cannot be trusted");
  }

  // ── 3. every shipped reference resolves ─────────────────────────────────────
  await run("resolve every module specifier in the shipped artifacts", projectDir, [
    "node",
    "resolve-artifacts.mjs",
  ]);

  // ── 4. both advertised entry points ─────────────────────────────────────────
  await run(`load through require() — ${PKG_NAME} "require" export`, projectDir, ["node", "cjs-entry.cjs"]);
  await run(`load through import() — ${PKG_NAME} "import" export`, projectDir, ["node", "esm-entry.mjs"]);

  // ── 5. shipped types ────────────────────────────────────────────────────────
  await run("type-check a consumer against the shipped .d.ts", projectDir, [
    join(projectDir, "node_modules", ".bin", "tsc"),
    "--noEmit",
    "-p",
    "tsconfig.json",
  ]);

  // ── 6. real bundlers ────────────────────────────────────────────────────────
  if (QUICK) {
    console.log("\n── bundlers skipped (--quick)");
  } else {
    await run("bundle with Vite", projectDir, [join(projectDir, "node_modules", ".bin", "vite"), "build", "--logLevel", "warn"]);
    await run("bundle with Parcel", projectDir, [
      join(projectDir, "node_modules", ".bin", "parcel"),
      "build",
      "index.html",
      "--no-cache",
      "--dist-dir",
      "parcel-dist",
      "--log-level",
      "warn",
    ]);
  }
} finally {
  if (KEEP) {
    console.log(`\nkept consumer project at ${projectDir}`);
  } else {
    rmSync(projectDir, { recursive: true, force: true });
    rmSync(tarball, { force: true });
    for (const spec of Object.values(overrides)) {
      rmSync(spec.replace(/^file:/, ""), { force: true });
    }
  }
}

console.log("");
if (failures.length > 0) {
  console.error(`✖ ${PKG_NAME} is NOT consumable as published:\n${failures.map((f) => `   - ${f}`).join("\n")}`);
  process.exit(1);
}
const caveats = [
  QUICK ? "bundlers skipped" : null,
  LOCAL_OVERRIDES.length > 0
    ? `against LOCAL ${LOCAL_OVERRIDES.map((o) => o.name).join(", ")} — re-run with no --local once published`
    : null,
].filter(Boolean);
console.log(`✔ ${PKG_NAME} is consumable as published${caveats.length > 0 ? ` (${caveats.join("; ")})` : ""}`);
