import { EErrorId_AccountSignerExecutor } from "@meteorwallet/core-sdk/errors/ids/by_feature/old_meteor_wallet.errors";
import { MeteorError } from "@meteorwallet/errors";
import { SCHEMA } from "@near-js/transactions";
import { FinalExecutionOutcome } from "@near-js/types";
import { serialize } from "borsh";
import { NEAR_BASE_CONFIG_FOR_NETWORK } from "../../modules_external/near/near_static_data";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { EMeteorAnalytics_AppReleaseEnvironment } from "../../modules_utility/analytics/meteor_analytics_enums";
import { appFrontendOnlyCodeCheck } from "../../modules_utility/env/env_guards";
import { EHttpStatusCode, IMeteorResponse, IRelayTransaction } from "./Relayer.interfaces";
import { IRequestObject_RelayTransaction } from "./relay_transaction.endpoint_types";

const relayEndpoints = {
  dev: "https://relay-dev.meteorwallet.app",
  // dev: "http://127.0.0.1:8787",
  prod: "https://relay.meteorwallet.app",
};

export class Relayer {
  static relayerForNetwork: {
    [networkId in ENearNetwork]?: Relayer;
  } = {};

  private readonly networkId: ENearNetwork;

  static get(networkId: ENearNetwork): Relayer {
    if (!Relayer.relayerForNetwork[networkId]) {
      Relayer.relayerForNetwork[networkId] = new Relayer(networkId);
    }

    return Relayer.relayerForNetwork[networkId]!;
  }

  constructor(networkId: ENearNetwork) {
    this.networkId = networkId;
  }

  async relayTransaction(relayTransaction: IRelayTransaction): Promise<FinalExecutionOutcome> {
    appFrontendOnlyCodeCheck();
    const { delegated, regular } = relayTransaction;

    const payload: IRequestObject_RelayTransaction = {
      signedDelegateBase64: Buffer.from(serialize(SCHEMA.SignedDelegate, delegated)).toString(
        "base64",
      ),
      networkId: this.networkId as "mainnet" | "testnet",
      rpcUrl: NEAR_BASE_CONFIG_FOR_NETWORK[this.networkId].nodeUrl,
    };

    const { appRelease } = (
      await import("../../modules_app_core/state/app_store/AppStore")
    ).AppStore.getRawState();

    const urlBase =
      appRelease === EMeteorAnalytics_AppReleaseEnvironment.dev_local
        ? relayEndpoints.dev
        : relayEndpoints.prod;
    const fullUrl = urlBase + "/relay_transaction";

    console.log("Relaying transaction to: ", fullUrl, payload);

    const response = await fetch(fullUrl, {
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(payload),
    });

    const meteorResponse: IMeteorResponse = await response.json();

    if (meteorResponse.status !== EHttpStatusCode.SUCCESS) {
      throw MeteorError.fromId(
        EErrorId_AccountSignerExecutor.publishing_delegated_transaction_failed,
      );
    }

    return meteorResponse.data;
  }
}
