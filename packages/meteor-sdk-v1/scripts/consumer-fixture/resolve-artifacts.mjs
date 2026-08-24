// Static audit of the INSTALLED artifacts, run from inside the consumer project.
//
// This is the deterministic half of the B-01 gate. Loading the entry points proves the modules
// that actually execute resolve; this proves every module specifier in every shipped artifact
// resolves — including ones behind lazy branches, and including the `.d.ts`, whose broken imports
// would otherwise only appear in a consumer's `tsc` run.
//
// It catches exactly what shipped broken in 3.2.0:
//   - `@noble/hashes/sha512` — a subpath of a declared dependency that the dependency does not export
//   - `near-api-js` / `near-api-js/lib/providers/index.js` — a package the consumer never installed
//   - `/// <reference path="operators/index.d.ts" />` — an rxjs directive pointing at a missing file

import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const consumerRoot = dirname(fileURLToPath(import.meta.url));
const pkgJsonPath = require.resolve("@meteorwallet/sdk/package.json");
const pkgDir = dirname(pkgJsonPath);
const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8"));

const declared = new Set([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
  ...Object.keys(pkg.optionalDependencies ?? {}),
]);

const artifacts = [
  { file: "dist/index.js", kind: "esm" },
  { file: "dist/index.cjs", kind: "cjs" },
  { file: "dist/index.d.ts", kind: "types" },
  { file: "dist/index.d.cts", kind: "types" },
];

const SPECIFIER_PATTERNS = [
  /(?:^|[\s;])import\s+(?:[\s\S]*?\sfrom\s+)?["']([^"']+)["']/gm,
  /(?:^|[\s;=(])export\s+(?:[\s\S]*?\sfrom\s+)?["']([^"']+)["']/gm,
  /\brequire\(\s*["']([^"']+)["']\s*\)/gm,
  /\bimport\(\s*["']([^"']+)["']\s*\)/gm,
];

/**
 * Blank out comments and string bodies so a `@example` block that shows
 * `import { MeteorWallet } from "@meteorwallet/sdk"` is not mistaken for a real import.
 */
function stripComments(source) {
  let out = "";
  let i = 0;
  while (i < source.length) {
    const two = source.slice(i, i + 2);
    if (two === "//") {
      const end = source.indexOf("\n", i);
      i = end === -1 ? source.length : end;
    } else if (two === "/*") {
      const end = source.indexOf("*/", i + 2);
      i = end === -1 ? source.length : end + 2;
    } else {
      const ch = source[i];
      if (ch === '"' || ch === "'" || ch === "`") {
        // Keep quoted specifiers intact — they are exactly what we are looking for.
        let j = i + 1;
        while (j < source.length && source[j] !== ch) {
          j += source[j] === "\\" ? 2 : 1;
        }
        out += source.slice(i, Math.min(j + 1, source.length));
        i = j + 1;
      } else {
        out += ch;
        i += 1;
      }
    }
  }
  return out;
}

/** Package name for a specifier: `@scope/name/sub` -> `@scope/name`, `name/sub` -> `name`. */
function packageNameOf(specifier) {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

const problems = [];

for (const { file, kind } of artifacts) {
  const abs = resolvePath(pkgDir, file);
  if (!existsSync(abs)) {
    problems.push(`${file}: advertised artifact is missing from the tarball`);
    continue;
  }
  const source = readFileSync(abs, "utf8");

  // Triple-slash `path` references must point at files the tarball actually ships. Only a line
  // that *opens* with `///` is a directive — prose inside a doc comment is not.
  for (const line of source.split("\n")) {
    const directive = /^\s*\/\/\/\s*<reference\s+path\s*=\s*["']([^"']+)["']\s*\/>/.exec(line);
    if (directive == null) continue;
    const target = resolvePath(dirname(abs), directive[1]);
    if (!existsSync(target)) {
      problems.push(`${file}: /// <reference path="${directive[1]}" /> points at a file not in the package`);
    }
  }

  const code = stripComments(source);
  const specifiers = new Set();
  for (const pattern of SPECIFIER_PATTERNS) {
    for (const match of code.matchAll(pattern)) {
      specifiers.add(match[1]);
    }
  }

  for (const specifier of specifiers) {
    if (specifier.startsWith(".") || specifier.startsWith("/") || specifier.startsWith("node:") || specifier.startsWith("data:")) {
      continue;
    }
    const name = packageNameOf(specifier);
    if (!declared.has(name)) {
      problems.push(
        `${file} (${kind}): imports "${specifier}" but "${name}" is not a declared dependency or peer dependency`,
      );
      continue;
    }
    // Types are resolved by TypeScript, not Node — a `.d.ts` import of a package that ships no
    // runtime export condition is still fine, so only require the package root to exist.
    if (kind === "types") {
      // Many packages do not expose `./package.json` through their exports map, so resolve the
      // installed directory rather than a module path.
      if (!existsSync(resolvePath(consumerRoot, "node_modules", ...name.split("/")))) {
        problems.push(`${file} (types): "${name}" is not installed in the consumer project`);
      }
      continue;
    }
    try {
      if (kind === "cjs") {
        require.resolve(specifier);
      } else {
        import.meta.resolve(specifier, pathToFileURL(abs));
      }
    } catch (error) {
      problems.push(`${file} (${kind}): cannot resolve "${specifier}" — ${error.code ?? error.message}`);
    }
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} unresolvable reference(s) in the published artifacts:`);
  for (const problem of problems) {
    console.error(`  - ${problem}`);
  }
  process.exit(1);
}

console.log(`every module specifier and reference in ${artifacts.map((a) => a.file).join(", ")} resolves from a clean consumer`);
