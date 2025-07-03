import { EAppPlatformType } from "../../modules_app_core/app_plaftorms/app_platform_types";
import { AppStore } from "../../modules_app_core/state/app_store/AppStore";
import { TRpcItem } from "../../modules_app_core/state/app_store/AppStore_types";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { RPC_ABNORMAL_PING_THRESHOLD, pingLimitGreen } from "./rpc_constants";
import { ERPC_Providers_Mainnet, ERPC_Providers_Testnet } from "./rpc_enums";
import { FailoverRpcProvider, JsonRpcProvider } from "@near-js/providers";
import { NEAR_BASE_CONFIG_FOR_NETWORK } from "../../modules_external/near/near_static_data";
import { EMeteorAnalytics_AppReleaseEnvironment } from "../../modules_utility/analytics/meteor_analytics_enums";
import { IJsonRpcConnectionInfo, TFailoverRpcConfig } from "./rpc.types";

const static_rpc_data: {
  rpcItems?: TRpcItem[];
  rpcProviderForNetwork: Partial<Record<ENearNetwork, JsonRpcProvider>>;
  failoverRpcProviderForNetwork: Partial<Record<ENearNetwork, FailoverRpcProvider>>;
  failoverConfigForNetwork: Partial<Record<ENearNetwork, TFailoverRpcConfig>>;
} = {
  rpcProviderForNetwork: {},
  failoverRpcProviderForNetwork: {},
  failoverConfigForNetwork: {},
};

export function getPingColor(ping: number) {
  let color: string;

  if (ping < pingLimitGreen) {
    color = "#22C46D";
  } else if (ping >= pingLimitGreen && ping < RPC_ABNORMAL_PING_THRESHOLD) {
    color = "#F2AA3D";
  } else {
    color = "#CE2A49";
  }

  return color;
}

export function getPresetRpcList(): TRpcItem[] {
  if (static_rpc_data.rpcItems) {
    return static_rpc_data.rpcItems;
  }

  const appDriver = AppStore.getRawState().appDriver;
  const appRelease = AppStore.getRawState().appRelease;

  console.trace(`[getPresetRpcList] appDriver: ${appDriver}, appRelease: ${appRelease}`);

  let presetRpcList_mainnet: TRpcItem[] = [
    {
      name: ERPC_Providers_Mainnet.official,
      nodeUrl: "https://rpc.mainnet.near.org",
      network: ENearNetwork.mainnet,
    },
    {
      name: ERPC_Providers_Mainnet.fastnear,
      nodeUrl: "https://free.rpc.fastnear.com",
      network: ENearNetwork.mainnet,
    },
    {
      name: ERPC_Providers_Mainnet.pagoda,
      nodeUrl: "https://rpc.mainnet.pagoda.co",
      network: ENearNetwork.mainnet,
    },
    {
      name: ERPC_Providers_Mainnet.lava,
      nodeUrl: "https://near.lava.build",
      network: ENearNetwork.mainnet,
    },
    {
      name: ERPC_Providers_Mainnet.shitzu,
      nodeUrl: "https://rpc.shitzuapes.xyz",
      network: ENearNetwork.mainnet,
    },
  ];

  if (
    appDriver !== EAppPlatformType.EXTENSION &&
    appRelease === EMeteorAnalytics_AppReleaseEnvironment.production
  ) {
    presetRpcList_mainnet.splice(0, 0, {
      name: ERPC_Providers_Mainnet.meteor,
      nodeUrl: "https://mw.rpc.fastnear.com",
      network: ENearNetwork.mainnet,
    });
  }

  let presetRpcList_testnet = [
    {
      name: ERPC_Providers_Testnet.fastnear,
      nodeUrl: "https://test.rpc.fastnear.com",
      network: ENearNetwork.testnet,
    },
    {
      name: ERPC_Providers_Testnet.official,
      nodeUrl: "https://rpc.testnet.near.org",
      network: ENearNetwork.testnet,
    },
    {
      name: ERPC_Providers_Testnet.pagoda,
      nodeUrl: "https://rpc.testnet.pagoda.co",
      network: ENearNetwork.testnet,
    },
  ];

  if (appRelease === EMeteorAnalytics_AppReleaseEnvironment.production) {
    presetRpcList_testnet.push({
      name: ERPC_Providers_Testnet.lava,
      nodeUrl: "https://near-testnet.lava.build",
      network: ENearNetwork.testnet,
    });
  }

  let presetRpcList_full = [...presetRpcList_mainnet, ...presetRpcList_testnet];

  static_rpc_data.rpcItems = presetRpcList_full;
  return presetRpcList_full;
}

function getOrderedRpcListForNetwork(networkId: ENearNetwork): TRpcItem[] {
  const rpcList = getPresetRpcList();
  const currentRpcConfig = NEAR_BASE_CONFIG_FOR_NETWORK[networkId];

  const filteredRpcList: TRpcItem[] = [
    {
      name: currentRpcConfig.name,
      nodeUrl: currentRpcConfig.nodeUrl,
      network: currentRpcConfig.networkId,
    },
    ...rpcList
      .filter((rpc) => rpc.network === networkId)
      .filter((rpc) => rpc.nodeUrl !== currentRpcConfig.nodeUrl),
  ];

  console.log(`[${networkId}] Filtered RPC List:`, filteredRpcList);

  // rpcList.filter((rpc) => rpc.network === networkId);
  return filteredRpcList;
}

export function getNearFailoverRpcProvider(networkId: ENearNetwork): FailoverRpcProvider {
  if (static_rpc_data.failoverRpcProviderForNetwork[networkId] != null) {
    return static_rpc_data.failoverRpcProviderForNetwork[networkId];
  }

  /*const currentRpcConfig = NEAR_BASE_CONFIG_FOR_NETWORK[networkId];

  const rpcList = [
    currentRpcConfig,
    ...getOrderedRpcListForNetwork(networkId).filter((rpc) => rpc.nodeUrl !== currentRpcConfig.nodeUrl),
  ];*/

  const rpcProviders: JsonRpcProvider[] = getOrderedRpcListForNetwork(networkId).map((rpc) => {
    return new JsonRpcProvider({
      url: rpc.nodeUrl,
      headers: {},
    });
  });

  const failoverRpcProvider = new FailoverRpcProvider(rpcProviders);

  static_rpc_data.failoverRpcProviderForNetwork[networkId] = failoverRpcProvider;
  return static_rpc_data.failoverRpcProviderForNetwork[networkId];
}

export function getRpcListForNetwork(networkId: ENearNetwork): TRpcItem[] {
  const rpcList = getPresetRpcList();
  const filteredRpcList = rpcList.filter((rpc) => rpc.network === networkId);
  return filteredRpcList;
}

export function getNearRpcProvider(networkId: ENearNetwork): JsonRpcProvider {
  if (static_rpc_data.rpcProviderForNetwork[networkId] != null) {
    return static_rpc_data.rpcProviderForNetwork[networkId];
  }

  const currentRpcConfig = NEAR_BASE_CONFIG_FOR_NETWORK[networkId];

  static_rpc_data.rpcProviderForNetwork[networkId] = new JsonRpcProvider({
    url: currentRpcConfig.nodeUrl,
  });

  return static_rpc_data.rpcProviderForNetwork[networkId];
}

export function getNearFailoverRpcProviderConfig(networkId: ENearNetwork): TFailoverRpcConfig {
  if (static_rpc_data.failoverConfigForNetwork[networkId] != null) {
    return static_rpc_data.failoverConfigForNetwork[networkId];
  }

  const failoverConfig: TFailoverRpcConfig = {
    type: "FailoverRpcProvider",
    args: getOrderedRpcListForNetwork(networkId).map(
      (rpc): IJsonRpcConnectionInfo => ({
        url: rpc.nodeUrl,
      }),
    ),
  };

  static_rpc_data.failoverConfigForNetwork[networkId] = failoverConfig;
  return static_rpc_data.failoverConfigForNetwork[networkId];
}
