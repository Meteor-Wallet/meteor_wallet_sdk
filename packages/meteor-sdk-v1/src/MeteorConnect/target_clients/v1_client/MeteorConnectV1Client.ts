import { PublicKey } from "@near-js/crypto";
import type { BrowserLocalStorageKeyStore } from "@near-js/keystores-browser";
import * as nearAPI from "near-api-js";
import { MeteorWallet } from "../../../MeteorWallet";
import { EMeteorWalletSignInType } from "../../../ported_common/dapp/dapp.enums";
import type { TMeteorSdkV1Transaction } from "../../../ported_common/dapp/dapp.types";
import type { TMCActionOutput, TMCActionRegistry } from "../../action/mc_action.combined";
import type { TMCActionRequestUnionExpandedInput } from "../../action/mc_action.types";
import { MeteorLogger } from "../../logging/MeteorLogger";
import type {
  TMeteorConnectAccountNetwork,
  TMeteorConnectionExecutionTarget,
  TMeteorExecutionTargetConfig,
} from "../../MeteorConnect.types.ts";
import { isV1ExtensionWithDirectAvailable } from "../../utils/isV1ExtensionAvailable";
import { MeteorConnectClientBase } from "../base/MeteorConnectClientBase";
import { nearActionToSdkV1Action } from "./utils/nearActionToSdkV1Action";

interface IMeteorWalletV1AndKeyStore {
  wallet: MeteorWallet;
  keyStore: BrowserLocalStorageKeyStore;
}

const sdkForNetworkAndTarget: Record<
  `${TMeteorConnectAccountNetwork}::${"v1_web" | "v1_ext"}`,
  IMeteorWalletV1AndKeyStore | undefined
> = {
  "mainnet::v1_web": undefined,
  "testnet::v1_web": undefined,
  "mainnet::v1_ext": undefined,
  "testnet::v1_ext": undefined,
};

function createKeyForNetworkAndTarget(
  network: TMeteorConnectAccountNetwork,
  target: "v1_web" | "v1_ext",
): `${TMeteorConnectAccountNetwork}::${"v1_web" | "v1_ext"}` {
  return `${network}::${target}`;
}

export class MeteorConnectV1Client extends MeteorConnectClientBase {
  clientName = "MeteorConnect V1 Client";
  executionTargets: TMeteorConnectionExecutionTarget[] = ["v1_web", "v1_ext"];
  protected logger = MeteorLogger.createLogger("MeteorConnect:V1Client");

  private getSdkForNetworkAndTarget(
    network: TMeteorConnectAccountNetwork,
    executionTarget: "v1_web" | "v1_ext",
  ): IMeteorWalletV1AndKeyStore {
    const key = createKeyForNetworkAndTarget(network, executionTarget);

    if (sdkForNetworkAndTarget[key] != null) {
      this.logger.log(`Using cached SDK for key ${key}`);
      return sdkForNetworkAndTarget[key];
    }

    const keyStore = new nearAPI.keyStores.BrowserLocalStorageKeyStore(
      window.localStorage,
      "_meteor_wallet",
    );

    const wallet = new MeteorWallet({
      networkId: network,
      keyStore,
      forceTargetPlatform: executionTarget,
    });

    sdkForNetworkAndTarget[key] = {
      wallet,
      keyStore,
    };

    return sdkForNetworkAndTarget[key];
  }

  async getExecutionTargetConfigs<R extends TMCActionRequestUnionExpandedInput<TMCActionRegistry>>(
    _request: R,
  ): Promise<TMeteorExecutionTargetConfig[]> {
    const supportedTargets: TMeteorExecutionTargetConfig[] = [
      {
        executionTarget: "v1_web",
      },
    ];

    if (isV1ExtensionWithDirectAvailable()) {
      supportedTargets.push({
        executionTarget: "v1_ext",
      });
    }

    return supportedTargets;
  }

  async makeRequest<R extends TMCActionRequestUnionExpandedInput<TMCActionRegistry>>(
    request: R,
    connection: TMeteorExecutionTargetConfig,
  ): Promise<TMCActionOutput<R>> {
    const executionTarget = connection.executionTarget;
    this.logger.log(
      `Making request for action [${request.id}] using execution target [${executionTarget}]`,
    );

    if (executionTarget !== "v1_web" && executionTarget !== "v1_ext") {
      throw new Error(
        this.logger.formatMsg(
          `Can't target environment [${executionTarget}] using [${this.clientName}] client`,
        ),
      );
    }

    if (request.id === "near::sign_in") {
      const { wallet } = this.getSdkForNetworkAndTarget(
        request.expandedInput.target.network,
        executionTarget,
      );

      if (request.expandedInput.contract != null) {
        // TODO need to generate a function call access key to be registered on the account
      }

      const response = await wallet.requestSignIn({
        type: EMeteorWalletSignInType.ALL_METHODS,
        contract_id: request.expandedInput.contract?.id ?? "",
        methods: request.expandedInput.contract?.methodNames,
      });

      if (response.success) {
        const signedInAccount = response.payload;

        return {
          connection,
          identifier: {
            accountId: signedInAccount.accountId,
            ...request.expandedInput.target,
          },
          publicKeys: [
            { type: "ed25519", publicKey: signedInAccount.accessKey.getPublicKey().toString() },
          ],
        };
      } else {
        throw new Error(`MeteorConnectV1Client: Sign in failed ${response.message}`);
      }
    }

    if (request.id === "near::sign_out") {
      const { wallet } = this.getSdkForNetworkAndTarget(
        request.expandedInput.account.identifier.network,
        executionTarget,
      );

      await wallet.signOut();
      return request.expandedInput.account.identifier;
    }

    if (request.id === "near::sign_message") {
      const { wallet } = this.getSdkForNetworkAndTarget(
        request.expandedInput.account.identifier.network,
        executionTarget,
      );
      const response = await wallet.signMessage({
        ...request.expandedInput.messageParams,
        accountId: request.expandedInput.account.identifier.accountId,
      });

      if (response.success) {
        const payload = {
          accountId: response.payload.accountId,
          publicKey: PublicKey.fromString(response.payload.publicKey),
          signature: Buffer.from(response.payload.signature, "base64"),
          state: response.payload.state,
        };

        this.logger.log(`Sign message successful for account ${payload.accountId}`, payload);

        return payload;
      } else {
        throw new Error(this.logger.formatMsg(`Sign message failed ${response.message}`));
      }
    }

    if (request.id === "near::sign_transactions") {
      const { wallet } = this.getSdkForNetworkAndTarget(
        request.expandedInput.account.identifier.network,
        executionTarget,
      );

      return await wallet.requestSignTransactions({
        transactions: request.expandedInput.transactions.map((t): TMeteorSdkV1Transaction => {
          return {
            receiverId: t.receiverId,
            actions: t.actions.map((action) => nearActionToSdkV1Action(action)),
          };
        }),
      });
    }

    if (request.id === "near::verify_owner") {
      const { wallet } = this.getSdkForNetworkAndTarget(
        request.expandedInput.account.identifier.network,
        executionTarget,
      );

      const response = await wallet.verifyOwner({
        accountId: request.expandedInput.account.identifier.accountId,
        message: request.expandedInput.message,
      });

      if (response.success) {
        return response.payload;
      } else {
        throw new Error(this.logger.formatMsg(`Verify owner failed ${response.message}`));
      }
    }

    throw new Error(`MeteorConnectV1Client: Action ID [${request["id"]}] not implemented`);
  }
}
