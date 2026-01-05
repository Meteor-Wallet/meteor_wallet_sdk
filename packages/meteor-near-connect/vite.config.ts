import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [nodePolyfills()],
  root: "./",
  build: {
    emptyOutDir: false,
    outDir: "../../near-connect",
    rollupOptions: {
      input: {
        main: `./src/meteor-connect/index.ts`,
      },
      output: {
        entryFileNames: `meteor-near-connect.js`,
        assetFileNames: `meteor-near-connect.js`,
        format: "iife",
      },
    },
  },
});
