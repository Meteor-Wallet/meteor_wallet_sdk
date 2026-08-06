import { defineCommanderConfig } from "@nice-code/commander/config";

/**
 * Dev-environment declaration for the Meteor Wallet SDK repo (`bunx nice-commander up`).
 *
 * Daily flow:
 *   bunx nice-commander up            # default selection: the `dev` group (test web app + test backend)
 *   bunx nice-commander up full       # everything, incl. near-connect, the popup preview, and build watch
 *   bunx nice-commander run checks    # one-shot CI panel: types / key confinement / sdk tests
 *   bunx nice-commander ui            # live grid + merged logs in the browser
 *   bunx nice-commander down --all
 */
export default defineCommanderConfig({
  name: "meteor-wallet-sdk",
  defaults: {
    tags: { project: "meteor-sdk" },
  },
  processes: [
    {
      id: "sdk-test-web",
      run: ["bun", "run", "dev"],
      cwd: "./packages/meteor-sdk-v1-test-web",
      endpoints: [{ name: "http", protocol: "http", port: 5173, ownership: "exclusive" }],
      ready: { kind: "endpoint", endpoint: "http" },
      tags: { role: "frontend" },
      envVars: [
        {
          name: "LOCAL_IP",
          description:
            "LAN IP used in the near-connect dev manifest / HMR host (defaults to auto-detected)",
        },
      ],
    },
    {
      id: "backend-test",
      run: ["bun", "run", "dev"], // wrangler dev
      cwd: "./packages/meteor-sdk-backend-test",
      endpoints: [
        {
          name: "http",
          protocol: "http",
          port: 8787,
          ownership: "exclusive",
          // The worker has no "/" route — probe the one cheap GET it does serve.
          health: { path: "/message" },
        },
      ],
      ready: { kind: "endpoint", endpoint: "http" },
      tags: { role: "backend" },
    },
    {
      id: "near-connect",
      run: ["bun", "run", "dev"], // vite dev on 3001 (referenced by sdk-test-web's dev manifest)
      cwd: "./packages/meteor-near-connect",
      endpoints: [{ name: "http", protocol: "http", port: 3001, ownership: "exclusive" }],
      ready: { kind: "endpoint", endpoint: "http" },
      tags: { role: "frontend" },
    },
    {
      id: "sdk-preview",
      // preview:action-ui minus --open, so a restart never pops a new browser tab.
      run: ["node", "./preview/action-ui/preview.mjs"],
      cwd: "./packages/meteor-sdk-v1",
      endpoints: [{ name: "http", protocol: "http", port: 8722, ownership: "exclusive" }],
      ready: { kind: "endpoint", endpoint: "http" },
      tags: { role: "tooling" },
    },
    {
      // The Meteor Connect bridge backend from the sibling repo — required for account-transfer
      // testing (open the demo with ?backend=local). ⚠ Binds :8787 like backend-test; the two
      // are mutually exclusive, which commander reports as an endpoint conflict.
      id: "mc-backend",
      run: ["bun", "run", "dev"], // wrangler dev --env development
      cwd: "../meteor-connect-bridge/packages/meteor-connect-backend",
      endpoints: [{ name: "http", protocol: "tcp", port: 8787, ownership: "exclusive" }],
      ready: { kind: "endpoint", endpoint: "http" },
      tags: { role: "backend" },
    },
    {
      // Rebuilds dist/ for consumers that resolve the built SDK (sdk-test-web aliases src
      // directly and does not need this — hence `full`, not `dev`).
      id: "sdk-build-watch",
      run: ["bun", "run", "build:watch"],
      cwd: "./packages/meteor-sdk-v1",
      tags: { role: "build" },
    },

    // ── One-shot checks (the `checks` group renders as a CI panel) ──
    {
      id: "types-sdk",
      kind: "task",
      run: ["bun", "run", "type-check"],
      cwd: "./packages/meteor-sdk-v1",
      timeoutMs: 300_000,
      tags: { role: "check" },
    },
    {
      id: "confinement",
      kind: "task",
      run: ["bun", "run", "check-key-confinement"],
      cwd: "./packages/meteor-sdk-v1",
      timeoutMs: 60_000,
      tags: { role: "check" },
    },
    {
      id: "test-sdk",
      kind: "task",
      run: ["bun", "test"],
      cwd: "./packages/meteor-sdk-v1",
      timeoutMs: 180_000,
      tags: { role: "check" },
    },
  ],
  groups: {
    /** Daily dev: the demo web app plus the worker its test pages call. */
    dev: { include: ["sdk-test-web", "backend-test"] },
    /** Everything that runs, for cross-package sessions. */
    full: {
      include: ["dev", "near-connect", "sdk-preview", "sdk-build-watch"],
      staggerMs: 400,
    },
    /** Popup-UI iteration loop on its own. */
    preview: { include: ["sdk-preview"] },
    /** Account-transfer testing: demo app + the sibling repo's mc backend (NOT backend-test — same port). */
    transfer: { include: ["sdk-test-web", "mc-backend"] },
    /** CI-style panel: ✓/✗ per check. */
    checks: { where: { role: "check" } },
  },
  defaultSelection: "dev",
});
