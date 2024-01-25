module.exports = {
  testEnvironment: "miniflare",
  testMatch: ["**/*.unit.test.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  globalSetup: "./jest/jest.setup.js",
  globals: {
    TextEncoder: require("util").TextEncoder,
    TextDecoder: require("util").TextDecoder,
  },
};
