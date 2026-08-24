// CommonJS consumer: exercises the "require" condition of the package exports map.
const sdk = require("@meteorwallet/sdk");

const required = [
  "MeteorConnect",
  "MeteorWallet",
  "METEOR_CONNECT_BACKENDS",
  "deriveLocalBackendUrl",
  "TRANSFER_ACCOUNTS_MAX_ACCOUNTS",
  "parseTransferSecretInput",
  "setEnvConfig",
];

const missing = required.filter((name) => sdk[name] == null);
if (missing.length > 0) {
  throw new Error(`require("@meteorwallet/sdk") is missing exports: ${missing.join(", ")}`);
}

// Exercise the code path that used to depend on the inlined @noble/curves v1 copy, so a regression
// to an unresolvable @noble/hashes subpath fails loudly rather than only at a consumer's runtime.
const addKey = sdk.convertSelectorActionToNearAction({
  type: "AddKey",
  params: {
    publicKey: "ed25519:6E8sCci9badyRkXb3JoRpBj5p8C6Tw41ELDZoiihKEtp",
    accessKey: { permission: "FullAccess" },
  },
});
if (addKey == null) {
  throw new Error("convertSelectorActionToNearAction returned nothing for a FullAccess AddKey");
}

console.log("require() loaded @meteorwallet/sdk and resolved every checked export");
