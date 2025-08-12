import { defineConfig } from "tsdown";

export default defineConfig({
  // Only build the SDK entry point
  entry: ["./src/index.ts"],

  // Generate d.ts alongside JS
  dts: true,

  // Do not try to bundle/react to these externals
  // Keep UI libs external and ignore binary assets; monorepo packages should be bundled
  external: [
    /^react($|\/)/,
    /^react-dom($|\/)/,
    /^react-icons($|\/)/,
    /^@chakra-ui\//,
    // Treat image and svg imports as external (they are only used in frontend packages)
    /\.(png|svg|jpg|jpeg|gif)$/,
  ],

  // Keep ESM neutral output for broad compatibility
  platform: "neutral",
  target: "chrome100",
  nodeProtocol: false,
});
