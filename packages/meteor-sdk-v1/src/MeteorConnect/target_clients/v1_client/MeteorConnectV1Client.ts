import { PublicKey } from "@near-js/crypto";
import type { BrowserLocalStorageKeyStore } from "@near-js/keystores-browser";
import * as nearAPI from "near-api-js";
import { MeteorWallet } from "../../../MeteorWallet";
import { EMeteorWalletSignInType } from "../../../ported_common/dapp/dapp.enums";
import type { TMeteorSdkV1Transaction } from "../../../ported_common/dapp/dapp.types";
import { notNullEmpty } from "../../../utils/nullEmpty";
import type { TMCActionOutput, TMCActionRegistry } from "../../action/mc_action.combined";
import type { TMCActionRequestUnionExpandedInput } from "../../action/mc_action.types";
import { supportsChromeExtension } from "../../action_ui/utils/supportsChromeExtension";
import { MeteorLogger } from "../../logging/MeteorLogger";
import type {
  TMeteorConnectAccountNetwork,
  TMeteorConnectionExecutionTarget,
  TMeteorConnectPublicKey,
  TMeteorExecutionTargetConfig,
} from "../../MeteorConnect.types.ts";
import { isV1ExtensionWithDirectAvailable } from "../../utils/isV1ExtensionAvailable";
import { MeteorConnectClientBase } from "../base/MeteorConnectClientBase";
import type { TMeteorConnectV1ExecutionTargetConfig } from "./MeteorConnectV1Client.types";
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
  target: "v1_web" | "v1_web_localhost" | "v1_ext",
): `${TMeteorConnectAccountNetwork}::${"v1_web" | "v1_web_localhost" | "v1_ext"}` {
  return `${network}::${target}`;
}

export class MeteorConnectV1Client extends MeteorConnectClientBase {
  clientName = "MeteorConnect V1 Client";
  executionTargets: TMeteorConnectionExecutionTarget[] = ["v1_web", "v1_web_localhost", "v1_ext"];
  protected logger = MeteorLogger.createLogger("MeteorConnect:V1Client");

  private getSdkForNetworkAndTarget(
    network: TMeteorConnectAccountNetwork,
    executionTargetConfig: TMeteorConnectV1ExecutionTargetConfig,
  ): IMeteorWalletV1AndKeyStore {
    const key = createKeyForNetworkAndTarget(network, executionTargetConfig.executionTarget);

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
      forceTargetPlatformConfig: executionTargetConfig,
    });

    sdkForNetworkAndTarget[key] = {
      wallet,
      keyStore,
    };

    return sdkForNetworkAndTarget[key];
  }

  async getEnvironmentSupportedPlatforms(): Promise<TMeteorConnectionExecutionTarget[]> {
    if (supportsChromeExtension()) {
      return ["v1_ext", "v1_web"];
    }

    return ["v1_web"];
  }

  async getExecutionTargetConfigs<R extends TMCActionRequestUnionExpandedInput<TMCActionRegistry>>(
    _request: R,
  ): Promise<TMeteorExecutionTargetConfig[]> {
    const supportedTargets: TMeteorExecutionTargetConfig[] = [
      {
        executionTarget: "v1_web",
      },
    ];

    const forceDev = (await this.meteorConnect.storage.getJsonOrDef("dev_000_met", 0)) === 1;

    if (forceDev || process.env.NODE_ENV === "development") {
      supportedTargets.push({
        executionTarget: "v1_web_localhost",
        // Only use this specific localhost base URL in dev mode for security reasons
        baseUrl: forceDev
          ? "https://localhost:3001"
          : await this.meteorConnect.storage.getJsonOrDef(
              "webDevLocalhostBaseUrl",
              "https://localhost:3001",
            ),
      });
    }

    if (isV1ExtensionWithDirectAvailable()) {
      supportedTargets.push({
        executionTarget: "v1_ext",
      });
    }

    return supportedTargets;
  }

  async makeRequest<R extends TMCActionRequestUnionExpandedInput<TMCActionRegistry>>(
    request: R,
    connectionConfig: TMeteorExecutionTargetConfig,
  ): Promise<TMCActionOutput<R>> {
    const executionTarget = connectionConfig.executionTarget;
    this.logger.log(
      `Making request for action [${request.id}] using execution target [${executionTarget}]`,
      request.expandedInput,
    );

    if (
      executionTarget !== "v1_web" &&
      executionTarget !== "v1_ext" &&
      executionTarget !== "v1_web_localhost"
    ) {
      throw new Error(
        this.logger.formatMsg(
          `Can't target environment [${executionTarget}] using [${this.clientName}] client`,
        ),
      );
    }

    if (request.id === "near::sign_in" || request.id === "near::sign_in_and_sign_message") {
      const { wallet } = this.getSdkForNetworkAndTarget(
        request.expandedInput.target.network,
        connectionConfig,
      );

      const isContractSignIn = request.expandedInput.contract != null;
      const isContractWithSelectedMethods =
        isContractSignIn &&
        request.expandedInput.contract?.methods != null &&
        request.expandedInput.contract.methods.length > 0;

      let signInType: EMeteorWalletSignInType = EMeteorWalletSignInType.ACCOUNT_ONLY;

      if (isContractSignIn) {
        if (isContractWithSelectedMethods) {
          signInType = EMeteorWalletSignInType.SELECTED_METHODS;
        } else {
          signInType = EMeteorWalletSignInType.ALL_METHODS;
        }
      }

      const response = await wallet.requestSignIn({
        type: signInType,
        contract_id: request.expandedInput.contract?.id ?? "",
        methods: request.expandedInput.contract?.methods,
        messageParams:
          request.id === "near::sign_in_and_sign_message"
            ? request.expandedInput.messageParams
            : undefined,
      });

      if (response.success) {
        const signedInAccount = response.payload;

        const publicKeys: TMeteorConnectPublicKey[] = [];

        if (notNullEmpty(request.expandedInput.contract?.id)) {
          publicKeys.push({
            type: "ed25519",
            publicKey: signedInAccount.accessKey.getPublicKey().toString(),
            meta: {
              contractId: request.expandedInput.contract.id,
              methods: request.expandedInput.contract.methods,
            },
          });
        }

        let signedMessage:
          | TMCActionOutput<Extract<R, { id: "near::sign_in_and_sign_message" }>>["signedMessage"]
          | undefined;

        if (request.id === "near::sign_in_and_sign_message") {
          if (response.payload.signedMessage == null) {
            throw new Error(
              this.logger.formatMsg(
                `Expected signed message in response payload for action [${request.id}] but it was not present`,
              ),
            );
          }

          signedMessage = {
            accountId: response.payload.accountId,
            publicKey: PublicKey.fromString(response.payload.signedMessage.publicKey),
            signature: Buffer.from(response.payload.signedMessage.signature, "base64"),
            state: response.payload.signedMessage.state,
          };
        }

        return {
          connection: connectionConfig,
          identifier: {
            accountId: signedInAccount.accountId,
            ...request.expandedInput.target,
          },
          publicKeys,
          signedMessage,
        };
      } else {
        throw new Error(`MeteorConnectV1Client: Sign in failed ${response.message}`);
      }
    }

    if (request.id === "near::sign_out") {
      if (
        request.expandedInput.account.publicKeys == null ||
        request.expandedInput.account.publicKeys.length === 0
      ) {
        return request.expandedInput.account.identifier;
      }

      const { wallet } = this.getSdkForNetworkAndTarget(
        request.expandedInput.account.identifier.network,
        connectionConfig,
      );

      await wallet.signOut();
      return request.expandedInput.account.identifier;
    }

    if (request.id === "near::sign_message") {
      const { wallet } = this.getSdkForNetworkAndTarget(
        request.expandedInput.account.identifier.network,
        connectionConfig,
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
        connectionConfig,
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
        connectionConfig,
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

    if (request.id === "near::sign_delegate_actions") {
      const { wallet } = this.getSdkForNetworkAndTarget(
        request.expandedInput.account.identifier.network,
        connectionConfig,
      );

      return await wallet.requestSignDelegateActions({
        delegateActions: request.expandedInput.delegateActions,
      });
    }

    throw new Error(`MeteorConnectV1Client: Action ID [${request["id"]}] not implemented`);
  }
}
