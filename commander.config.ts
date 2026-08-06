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
      // Standalone near-connect dev harness (vite serve of src/dev). ⚠ Same port as
      // meteor-web-wallet — mutually exclusive; the `local` group uses the build watch instead.
      id: "near-connect",
      run: ["bun", "run", "dev"],
      cwd: "./packages/meteor-near-connect",
      endpoints: [{ name: "http", protocol: "http", port: 3001, ownership: "exclusive" }],
      ready: { kind: "endpoint", endpoint: "http" },
      tags: { role: "frontend" },
    },
    {
      // The near-connect script pipeline, as the old windows_dev_env_sdk scripts ran it:
      // build-dev-watch emits <root>/near-connect/meteor-near-connect.js on every change…
      id: "near-connect-build",
      run: ["bun", "run", "build-dev-watch"],
      cwd: "./packages/meteor-near-connect",
      tags: { role: "build" },
    },
    {
      // …and this chokidar watcher copies it into sdk-test-web/public for the demo to serve.
      id: "script-sync",
      run: ["bun", "run", "watch-meteor-script"],
      cwd: "./packages/meteor-sdk-v1-test-web",
      tags: { role: "build" },
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
      // The REAL Meteor Wallet web app (meteor-frontend) from the meteor_wallet repo, served
      // locally — the receiving side of a localhost account transfer. mkcert https on :3001.
      // ⚠ Same port as near-connect; the two are mutually exclusive.
      // ⚠ First boot on a machine: mkcert's CA install prompts for sudo, which a daemon child
      // cannot answer — run `bunx nice-commander run meteor-web-wallet` once in a real terminal
      // (single-id run inherits stdio), then daemon starts (`up transfer-full`) work.
      id: "meteor-web-wallet",
      run: ["bun", "run", "web:dev"],
      cwd: "../meteor_wallet/web/packages/meteor-frontend",
      endpoints: [{ name: "https", protocol: "tcp", port: 3001, ownership: "exclusive" }],
      ready: { kind: "endpoint", endpoint: "https" },
      tags: { role: "wallet" },
    },
    {
      // Rebuilds dist/ for consumers that resolve the built SDK (sdk-test-web aliases src
      // directly and does not need this — hence `full`, not `dev`).
      id: "sdk-build-watch",
      run: ["bun", "run", "build:watch"],
      cwd: "./packages/meteor-sdk-v1",
      tags: { role: "build" },
    },

    {
      // One-click "boot the whole SDK test environment" entry — for the web UI, where start
      // acts on a single process: dependsOn is transitive, so starting THIS starts every
      // service below (in order, each awaited until ready) and then succeeds as a ✓ chip.
      // CLI equivalent: `nice-commander up local` (or bare `up` — it's the default selection).
      id: "local-env",
      kind: "task",
      run: ["bun", "-e", "console.log('SDK local test environment is up: demo :5173, mc backend :8787, Meteor Web wallet :3001, near-connect script pipeline')"],
      dependsOn: ["sdk-test-web", "mc-backend", "meteor-web-wallet", "near-connect-build", "script-sync"],
      timeoutMs: 60_000,
      tags: { role: "env" },
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
    /**
     * The full local test environment (successor to the windows_dev_env_sdk terminal scripts):
     * demo app, local mc bridge backend, the REAL localhost Meteor Web wallet (:3001 — serves as
     * both the v1_web_localhost target and the transfer/bridge receiver), and the near-connect
     * script pipeline. Excludes backend-test (:8787) and the near-connect dev harness (:3001) —
     * both ports are owned by their `local` counterparts here.
     */
    local: {
      // Selecting just the env task pulls in every service via dependsOn (transitive, awaited).
      include: ["local-env"],
      staggerMs: 400,
    },
    /** CI-style panel: ✓/✗ per check. */
    checks: { where: { role: "check" } },
  },
  // Bare `up` boots the complete SDK test environment (group `local`); the lighter `dev`
  // group (demo + backend-test only) remains selectable explicitly.
  defaultSelection: "local",
});
