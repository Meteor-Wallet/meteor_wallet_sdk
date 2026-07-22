/**
 * Interactive preview server for the Meteor Connect action UI.
 *
 * Bundles the preview entry (real production components + mocked backends),
 * serves it with esbuild's dev server, and rebuilds automatically on change
 * so the UI can be iterated on live (just refresh the browser tab).
 *
 * Usage:
 *   bun run preview:action-ui            # from packages/meteor-sdk-v1
 *   node ./preview/action-ui/preview.mjs [--port 8722] [--open]
 */
import { exec } from "node:child_process";
import { SCENARIOS } from "./scenarios.mjs";
import { createBuildContext, PREVIEW_DIR } from "./shared.mjs";

const args = process.argv.slice(2);
const portFlagIndex = args.indexOf("--port");
const port = portFlagIndex >= 0 ? Number(args[portFlagIndex + 1]) : 8722;
const shouldOpen = args.includes("--open");

const context = await createBuildContext();
await context.watch();
const served = await context.serve({ servedir: PREVIEW_DIR, port });

const host = "localhost";
const baseUrl = `http://${host}:${served.port}`;

console.log("\nMeteor Connect action-UI preview (rebuilds on change):\n");
for (const scenario of SCENARIOS) {
  const label = scenario.name.padEnd(18);
  console.log(`  ${label} ${baseUrl}/?scenario=${scenario.name}`);
  if (scenario.description) console.log(`${"".padEnd(18)}  ${scenario.description}`);
}
console.log("\nPress Ctrl+C to stop.\n");

if (shouldOpen) {
  const url = `${baseUrl}/?scenario=${SCENARIOS[0].name}`;
  const command =
    process.platform === "win32"
      ? `start "" "${url}"`
      : process.platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  exec(command, (error) => {
    if (error) console.warn("Could not open a browser automatically:", error.message);
  });
}
