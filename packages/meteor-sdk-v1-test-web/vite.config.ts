import * as path from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { watchNodeModules } from "vite-plugin-watch-node-modules";
import tsconfigPaths from "vite-tsconfig-paths";

console.log(`Running Vite with NODE_ENV=${process.env.NODE_ENV}`);

export default defineConfig(({ isSsrBuild }) => ({
  server: {
    hmr: {
      overlay: true, // Shows errors in the browser
    },
    warmup: {
      clientFiles: ["./app/**/*.{js,ts,jsx,tsx}", "../meteor-sdk-v1/src/**/*.ts"],
    },
    fs: {
      // Allow Vite to serve files from the monorepo root
      allow: [".."],
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
    alias: {
      "@meteorwallet/sdk": path.resolve(__dirname, "../meteor-sdk-v1/src"),
    },
  },
  optimizeDeps: {
    // Prevent Vite from pre-bundling your SDK
    exclude: ["@meteorwallet/sdk"],
  },
  define: {
    "process.env": {},
  },
}));
