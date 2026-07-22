/**
 * Shared helpers for the action-UI preview tooling (build + browser discovery).
 */
import esbuild from "esbuild";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PREVIEW_DIR = path.dirname(fileURLToPath(import.meta.url));

/** esbuild context bundling the preview entry (with the real production components). */
export function createBuildContext() {
  return esbuild.context({
    entryPoints: [path.join(PREVIEW_DIR, "action-ui-preview.entry.ts")],
    bundle: true,
    format: "esm",
    outfile: path.join(PREVIEW_DIR, "bundle.js"),
    logLevel: "warning",
  });
}

/**
 * Locate a Chromium/Chrome executable for playwright-core, trying in order:
 * 1. `CHROME_PATH` env override.
 * 2. The browser playwright-core expects (if installed for this version).
 * 3. Any chromium / chromium-headless-shell already in the Playwright browser caches.
 * 4. Common system Chrome / Chromium locations.
 */
export async function findChromiumExecutable() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  try {
    const { chromium } = await import("playwright-core");
    const expected = chromium.executablePath();
    if (fs.existsSync(expected)) return expected;
  } catch {
    // fall through to cache scanning
  }

  const cacheRoots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    path.join(os.homedir(), "AppData", "Local", "ms-playwright"),
    path.join(os.homedir(), "Library", "Caches", "ms-playwright"),
    path.join(os.homedir(), ".cache", "ms-playwright"),
  ].filter(Boolean);

  const candidates = [];
  for (const root of cacheRoots) {
    if (!fs.existsSync(root)) continue;
    for (const entry of fs.readdirSync(root)) {
      const match = /^(chromium|chromium_headless_shell)-(\d+)$/.exec(entry);
      if (!match) continue;
      const relatives = [
        "chrome-win64/chrome.exe",
        "chrome-linux/chrome",
        "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
      ];
      for (const relative of relatives) {
        const executable = path.join(root, entry, relative);
        if (fs.existsSync(executable)) {
          candidates.push({
            revision: Number(match[2]),
            headlessShell: match[1].includes("headless") ? 1 : 0,
            executable,
          });
        }
      }
    }
  }
  // Newest revision first; prefer full Chromium over the headless shell on ties.
  candidates.sort((a, b) => b.revision - a.revision || a.headlessShell - b.headlessShell);
  if (candidates.length > 0) return candidates[0].executable;

  const systemCandidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  for (const executable of systemCandidates) {
    if (fs.existsSync(executable)) return executable;
  }

  throw new Error(
    "No Chromium/Chrome executable found. Either set CHROME_PATH, install system Chrome, " +
      "or run `npx playwright-core install chromium`.",
  );
}
