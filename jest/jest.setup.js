module.exports = async function (globalConfig, projectConfig) {
  const crypto = require("crypto");
  const util = require("util");

  Object.assign(global, { TextDecoder: util.TextDecoder, TextEncoder: util.TextEncoder });

  // Set reference to mongod in order to close the server during teardown.
  globalThis.crypto = crypto;
};
