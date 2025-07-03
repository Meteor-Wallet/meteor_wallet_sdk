import _ from "lodash";
import { MeteorBackendV2Client } from "../../modules_external/meteor_v2_api/MeteorBackendV2Client";
import { IMarkBridgeDeposited_Input } from "../../modules_external/meteor_v2_api/meteor_v2_api.types";
import { IWithAccountIdAndNetwork } from "../../modules_external/near/types/near_input_helper_types";
import { RocketXClient } from "../../modules_external/rocketx/RocketXClient";
import { IRocketX_Token } from "../../modules_external/rocketx/rocketx.types";
import { AsyncUtils } from "../../modules_utility/javascript_helpers/AsyncUtils";
import { EBridgeTokenSymbol } from "../bridge/bridge.types";

async function getConfigs() {
  const rocketXClient = RocketXClient.getInstance();
  return rocketXClient.getConfigs();
}

async function getQuotation({
  amount,
  toNetwork,
  fromNetwork,
  fromToken,
  toToken,
  accountId,
  network,
}: IWithAccountIdAndNetwork & {
  amount: string;
  toNetwork: string;
  fromNetwork: string;
  fromToken: string;
  toToken: string;
}) {
  const backendV2Client = MeteorBackendV2Client.getInstance();
  return backendV2Client.getRocketXQuotation({
    amount,
    toNetwork,
    fromNetwork,
    fromToken,
    toToken,
    walletSignedPayload: {
      networkId: network,
      walletId: accountId,
    },
  });
}

async function createSwap({
  fromTokenId,
  toTokenId,
  userAddress,
  destinationAddress,
  disableEstimate,
  amount,
  slippage,
  accountId,
  network,
  swapWorthInUsd,
  meteorSymbolFrom,
  meteorSymbolTo,
}: IWithAccountIdAndNetwork & {
  fromTokenId: number;
  toTokenId: number;
  userAddress: string;
  destinationAddress: string;
  disableEstimate?: boolean;
  amount: number;
  slippage: number;
  swapWorthInUsd: string;
  meteorSymbolFrom: EBridgeTokenSymbol;
  meteorSymbolTo: EBridgeTokenSymbol;
}) {
  const backendV2Client = MeteorBackendV2Client.getInstance();
  return backendV2Client.createRocketXSwap({
    fromTokenId,
    toTokenId,
    userAddress,
    destinationAddress,
    disableEstimate,
    amount,
    slippage,
    walletSignedPayload: {
      networkId: network,
      walletId: accountId,
    },
    swapWorthInUsd,
    meteorSymbolFrom,
    meteorSymbolTo,
  });
}

async function getAllTokensByChainId(chainId: string) {
  const perPage = 500;
  let page = 1;

  const rocketXClient = RocketXClient.getInstance();

  let mightHaveNextPage = true;

  let allTokens: IRocketX_Token[] = [];

  do {
    const tokens = await rocketXClient.getTokensByChainId({
      chainId,
      perPage,
      page,
      keyword: "All",
    });
    const filteredTokens = tokens.filter((e) => {
      if (e.buy_enabled === 1 && e.sell_enabled === 1 && e.enabled === 1) {
        return true;
      }
      return false;
    });
    allTokens = [...allTokens, ..._.uniqBy(filteredTokens, "id")];
    page++;

    if (tokens.length < perPage) {
      mightHaveNextPage = false;
    } else {
      // wait a bit before calling next batch
      await AsyncUtils.waitMillis(100);
    }
  } while (mightHaveNextPage);

  return allTokens;
}

async function getBridgeHistory({
  accountId,
  network,
  page,
  perPage,
}: IWithAccountIdAndNetwork & {
  page: number;
  perPage: number;
}) {
  const backendV2Client = MeteorBackendV2Client.getInstance();
  return backendV2Client.getBridgeHistory({
    page,
    perPage,
    walletSignedPayload: {
      networkId: network,
      walletId: accountId,
    },
  });
}

async function markAsDeposited({ id, depositStatus, depositTx }: IMarkBridgeDeposited_Input) {
  const backendV2Client = MeteorBackendV2Client.getInstance();
  return backendV2Client.markBridgeTransactionAsDeposited({
    id,
    depositStatus,
    depositTx,
  });
}

async function refetchBridgeStatusById({ id }: { id: string }) {
  const backendV2Client = MeteorBackendV2Client.getInstance();
  return backendV2Client.refetchBridgeStatusById({
    id,
  });
}

export const rocketx_async_functions = {
  getConfigs,
  getAllTokensByChainId,
  getQuotation,
  createSwap,
  getBridgeHistory,
  markAsDeposited,
  refetchBridgeStatusById,
};
