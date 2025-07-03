import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/**/*.ts",
  outDir: "dist",
  noExternal: [/^@meteorwallet/, "@meteorwallet/common"],
});
