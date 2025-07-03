import { getNearApi } from "./clients/near_api_js/NearApiJsClient";
import { ENearNetwork } from "./types/near_basic_types";

async function initialize() {
  await Promise.all([
    getNearApi(ENearNetwork.testnet).initialize(),
    getNearApi(ENearNetwork.mainnet).initialize(),
  ]);
}

export const Near = {
  initialize,
};
