import * as path from "node:path";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

console.log(`Running Vite with NODE_ENV=${process.env.NODE_ENV}`);

export default defineConfig(({ mode }) => ({
  plugins: [nodePolyfills()],
  root: "./",
  resolve: {
    alias: {
      // This maps the package name directly to the TS source files
      "@meteorwallet/sdk": path.resolve(__dirname, "../meteor-sdk-v1/src"),
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? mode),
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
      watch: {
        include: ["src/**", "../meteor-sdk-v1/src/**"],
      },
    },
  },
}));
