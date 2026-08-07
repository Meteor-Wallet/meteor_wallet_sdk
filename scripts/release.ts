#!/usr/bin/env bun

/**
 * Release script — bumps the published package version, builds, publishes, and tags.
 *
 * Only `@meteorwallet/sdk` (packages/meteor-sdk-v1) goes to npm; everything else in `packages/`
 * is a test surface or the near-connect build and never leaves the repo.
 *
 * Prerelease versions (e.g. `2.0.0-beta.1`) are published under their prerelease identifier as
 * the npm dist-tag (`--tag beta`), so `latest` keeps pointing at the last stable release.
 *
 * Usage:
 *   bun run release <version> [--dry-run]
 *
 * Examples:
 *   bun run release 2.0.0
 *   bun run release 2.0.0-beta.1 --dry-run
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dirname, "..");

/** Every package `bun run release` publishes, by directory name under `packages/`. */
const PUBLISHED_PACKAGES = ["meteor-sdk-v1"] as const;

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const version = args.find((a) => !a.startsWith("--"));

if (!version) {
  console.error("Usage: bun run release <version> [--dry-run]");
  console.error("       bun run release 2.0.0");
  console.error("       bun run release 2.0.0-beta.1 --dry-run");
  process.exit(1);
}

const semverMatch = version.match(/^\d+\.\d+\.\d+(?:-([a-zA-Z]+)[\w.-]*)?(?:\+[\w.-]+)?$/);

if (!semverMatch) {
  console.error(`Invalid semver: "${version}"`);
  process.exit(1);
}

/** `beta` for `2.0.0-beta.1`, undefined for a stable release. */
const prereleaseTag = semverMatch[1];

// ---------------------------------------------------------------------------
// Guard: no uncommitted changes
// ---------------------------------------------------------------------------

if (!dryRun) {
  const status = execSync("git status --porcelain", { encoding: "utf-8" });
  if (status.trim().length > 0) {
    console.error("Uncommitted changes detected. Commit or stash before releasing.");
    console.error(status);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface IPackageManifest {
  name: string;
  version?: string;
  main?: string;
  module?: string;
  types?: string;
  exports?: Record<string, unknown> | string;
  [field: string]: unknown;
}

function packageDir(pkg: string): string {
  return join(REPO_ROOT, "packages", pkg);
}

function readManifest(dir: string): IPackageManifest {
  return JSON.parse(readFileSync(join(dir, "package.json"), "utf-8"));
}

function writePkg(dir: string, pkg: IPackageManifest) {
  writeFileSync(join(dir, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);
}

function run(cmd: string, cwd = REPO_ROOT) {
  console.log(`  $ ${cmd}`);
  if (!dryRun) {
    execSync(cmd, { cwd, stdio: "inherit" });
  }
}

function step(label: string) {
  console.log(`\n── ${label}\n`);
}

/** Every relative path the manifest points at, across `main`/`module`/`types`/`exports`. */
function manifestTargets(pkg: IPackageManifest): string[] {
  const found: string[] = [];

  const push = (target: unknown) => {
    if (typeof target === "string" && target.startsWith(".")) found.push(target);
  };

  for (const field of ["main", "module", "types"]) push(pkg[field]);

  const walk = (entry: unknown) => {
    if (typeof entry === "string") {
      push(entry);
      return;
    }
    if (entry != null && typeof entry === "object") {
      for (const target of Object.values(entry)) walk(target);
    }
  };
  walk(pkg.exports);

  return found;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

if (dryRun) {
  console.log("\nDRY RUN — no files changed, no packages published\n");
}

const PACKAGES = PUBLISHED_PACKAGES.map((pkg) => packageDir(pkg));

// 1. Bump versions
step(`Version → ${version}`);

for (const pkgDir of PACKAGES) {
  const pkg = readManifest(pkgDir);
  const from = pkg.version ?? "(unset)";
  console.log(`  ${pkg.name}: ${from} → ${version}`);
  pkg.version = version;
  if (!dryRun) writePkg(pkgDir, pkg);
}

// 2. Build (each package's build script runs its own key-confinement check first)
step("Build");

for (const pkgDir of PACKAGES) {
  run("bun run build", pkgDir);
}

// Every path the manifest names must exist on disk, or the tarball ships broken entry points.
step("Verify bundles");

for (const pkgDir of PACKAGES) {
  const pkg = readManifest(pkgDir);
  for (const target of manifestTargets(pkg)) {
    if (!existsSync(join(pkgDir, target))) {
      console.error(`  ✗ ${pkg.name}: manifest names "${target}" but it does not exist on disk`);
      process.exit(1);
    }
    console.log(`  ✓ ${pkg.name}: ${target}`);
  }
}

// 3. Publish
step("Publish");

const publishFlags = prereleaseTag ? `--access public --tag ${prereleaseTag}` : "--access public";

for (const pkgDir of PACKAGES) {
  const pkg = readManifest(pkgDir);
  const tagNote = prereleaseTag ? ` (dist-tag: ${prereleaseTag})` : "";
  console.log(`  Publishing ${pkg.name}@${version}${tagNote}...`);
  run(`bun publish ${publishFlags}`, pkgDir);
}

// 4. Git tag
step("Git tag");
run(`git add ${PUBLISHED_PACKAGES.map((pkg) => `packages/${pkg}/package.json`).join(" ")}`);

// The version bump may already be committed (e.g. included in an earlier feature commit), in which
// case there is nothing to commit — but the tag must still be created either way.
const hasStagedChanges =
  dryRun ||
  execSync("git status --porcelain", { cwd: REPO_ROOT, encoding: "utf-8" }).trim().length > 0;

if (hasStagedChanges) {
  run(`git commit -m "chore: release v${version}"`);
} else {
  console.log("  Nothing to commit — version bump was already committed. Skipping commit.");
}

run(`git tag v${version}`);

console.log(`\nDone. Push the tag when ready:\n  git push && git push origin v${version}\n`);
