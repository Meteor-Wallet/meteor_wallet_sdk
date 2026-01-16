import * as path from "node:path";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [nodePolyfills()],
  root: "./",
  resolve: {
    alias: {
      // This maps the package name directly to the TS source files
      "@meteorwallet/sdk": path.resolve(__dirname, "../meteor-sdk-v1/src"),
    },
  },
  build: {
    emptyOutDir: false,
    outDir: "../../near-connect",
    rollupOptions: {
      input: {
        main: `./src/meteor-near-connect/nearConnectExecutor.ts`,
      },
      output: {
        entryFileNames: `meteor-near-connect.js`,
        assetFileNames: `meteor-near-connect.js`,
        format: "iife",
      },
    },
  },
});
