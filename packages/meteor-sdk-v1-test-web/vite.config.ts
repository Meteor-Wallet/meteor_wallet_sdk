import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths(), devtoolsJson()],
  define: {
    // By default, Vite doesn't include shims for NodeJS/
    // necessary for segment analytics lib to work
    // global: {},
    // "window.global": {},
    "process.env": {},
  },
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@meteorwallet/common": resolve(__dirname, "../meteor-common/src"),
      "@": resolve(__dirname, "src"),
      process: "process/browser",
      buffer: "buffer",
      stream: "stream-browserify",
      assert: "assert",
      http: "stream-http",
      https: "https-browserify",
      os: "os-browserify",
      url: "url",
      util: "util",
    },
  },
});
