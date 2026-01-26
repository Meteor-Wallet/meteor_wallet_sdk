import * as path from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { watchNodeModules } from "vite-plugin-watch-node-modules";
import tsconfigPaths from "vite-tsconfig-paths";

console.log(`Running Vite with NODE_ENV=${process.env.NODE_ENV}`);

export default defineConfig({
  server: {
    warmup: {
      clientFiles: ["./app/**/*.{js,ts,jsx,tsx}"],
    },
  },
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    devtoolsJson(),
    watchNodeModules(["@meteorwallet/sdk"], {
      cwd: path.join(process.cwd(), "../../"),
    }) as any,
    nodePolyfills({
      exclude: ["http", "stream"],
      protocolImports: true,
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  define: {
    // By default, Vite doesn't include shims for NodeJS/
    // necessary for segment analytics lib to work
    // global: {},
    // "window.global": {},
    "process.env": {},
  },
  // resolve: {
  //   preserveSymlinks: true,
  //   alias: {
  //     process: "process/browser",
  //     buffer: "buffer",
  //     stream: "stream-browserify",
  //     assert: "assert",
  //     http: "stream-http",
  //     https: "https-browserify",
  //     os: "os-browserify",
  //     url: "url",
  //     util: "util",
  //   },
  // },
});
