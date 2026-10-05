import * as fs from "node:fs";
import * as path from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import os from "os";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { hmrPlugin } from "vite-plugin-web-components-hmr";
// import { watchNodeModules } from "vite-plugin-watch-node-modules";
import tsconfigPaths from "vite-tsconfig-paths";

console.log(`Running Vite with NODE_ENV=${process.env.NODE_ENV}`);

// Helper to get local IPv4
const networkInterfaces = os.networkInterfaces();
const localIp = Object.values(networkInterfaces)
  .flat()
  .find((i) => i?.family === "IPv4" && !i.internal)?.address;

// Optional local @hot-labs/near-connect checkout (relative to the repo root, e.g. ../near-connect).
// Its src/ is plain TS with type-only imports, so Vite serves it directly — edits hot-reload,
// no build step. Unset = the npm package. Set via `nice-commander env sdk-test-web`.
const nearConnectLocalSrc = (() => {
  const configured = process.env.NEAR_CONNECT_LOCAL_PATH?.trim();
  if (!configured) return undefined;

  const src = path.resolve(__dirname, "../..", configured, "src");
  if (!fs.existsSync(path.join(src, "index.ts"))) {
    throw new Error(
      `NEAR_CONNECT_LOCAL_PATH="${configured}" has no src/index.ts at ${src} — expected a checkout of https://github.com/hot-dao/near-selector`,
    );
  }

  console.log(`Using LOCAL @hot-labs/near-connect source: ${src}`);
  return src;
})();

export default defineConfig(({ isSsrBuild }) => ({
  server: {
    host: true,
    hmr: {
      overlay: true, // Shows errors in the browser,
      host: localIp || "localhost",
    },
    warmup: {
      clientFiles: ["./app/**/*.{js,ts,jsx,tsx}", "../meteor-sdk-v1/src/**/*.ts"],
    },
    fs: {
      // Allow Vite to serve files from the monorepo root
      allow: [".."].concat(nearConnectLocalSrc ?? []),
    },
    watch: {
      // Ensure the watcher is actually looking at the physical files
      // ignored: ["!**/node_modules/@meteorwallet/sdk/**"],
    },
  },
  plugins: [
    {
      name: "hmr-debug",
      handleHotUpdate({ file, server }) {
        console.log(`[HMR Debug] File changed: ${file}`);
        // This will print in your terminal so you can see if
        // Vite is watching the correct physical file.
      },
    },
    tailwindcss(),
    // HMR for custom elements authored in the SDK (lit components)
    hmrPlugin({
      include: [
        path.resolve(__dirname, "../meteor-sdk-v1/src/**/*.ts"),
        path.resolve(__dirname, "../meteor-sdk-v1/src/**/*.tsx"),
      ],
      // quiet: false,
      // force: true,
    }),
    reactRouter(),
    tsconfigPaths(),
    devtoolsJson(),
    // watchNodeModules(["@meteorwallet/sdk"], {
    //   cwd: path.join(process.cwd(), "../../"),
    // }) as any,
    nodePolyfills({
      exclude: ["http", "stream"],
      protocolImports: true,
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: [
      { find: "@meteorwallet/sdk", replacement: path.resolve(__dirname, "../meteor-sdk-v1/src") },
      ...(nearConnectLocalSrc
        ? [
            // Deep imports of the published layout (`/build/types`) map onto the same src tree.
            { find: /^@hot-labs\/near-connect\/build\//, replacement: `${nearConnectLocalSrc}/` },
            { find: /^@hot-labs\/near-connect$/, replacement: `${nearConnectLocalSrc}/index.ts` },
          ]
        : []),
    ],
    // Keep module identity stable when linked from workspace
    preserveSymlinks: true,
  },
  optimizeDeps: {
    // Prevent Vite from pre-bundling your SDK
    exclude: ["@meteorwallet/sdk"],
  },
  define: {
    "process.env": {
      NODE_ENV: process.env.NODE_ENV,
      LOCAL_IP: localIp || "localhost",
    },
  },
}));
