import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [nodePolyfills()],
  resolve: { preserveSymlinks: true },
  root: "./src/dev",
  server: {
    port: 3001,
  },
});
