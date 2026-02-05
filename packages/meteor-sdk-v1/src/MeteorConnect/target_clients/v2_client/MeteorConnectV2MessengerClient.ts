import type { TMCActionOutput, TMCActionRegistry } from "../../action/mc_action.combined";
import type { TMCActionRequestUnionExpandedInput } from "../../action/mc_action.types";
import { MeteorLogger } from "../../logging/MeteorLogger";
import type {
  TMeteorConnectionExecutionTarget,
  TMeteorExecutionTargetConfig,
} from "../../MeteorConnect.types.ts";
import { MeteorConnectClientBase } from "../base/MeteorConnectClientBase";

export class MeteorConnectV2MessengerClient extends MeteorConnectClientBase {
  clientName = "MeteorConnect V2 Messenger Client";
  executionTargets: TMeteorConnectionExecutionTarget[] = [
    "v2_rid_mobile_deep_link",
    "v2_rid_qr_code",
  ];
  protected readonly logger = MeteorLogger.createLogger("MeteorConnect:V2MessengerClient");

  async getExecutionTargetConfigs<R extends TMCActionRequestUnionExpandedInput<TMCActionRegistry>>(
    _request: R,
  ): Promise<TMeteorExecutionTargetConfig[]> {
    // For now we don't support any targets for V2 Messenger Client, as the deep link and QR code flows are not yet implemented
    return [];

    const supportedTargets: TMeteorExecutionTargetConfig[] = [
      {
        executionTarget: "v2_rid_mobile_deep_link",
      },
      {
        executionTarget: "v2_rid_qr_code",
      },
    ];

    return supportedTargets;
  }

  async makeRequest<R extends TMCActionRequestUnionExpandedInput<TMCActionRegistry>>(
    request: R,
    connection: TMeteorExecutionTargetConfig,
  ): Promise<TMCActionOutput<R>> {
    const executionTarget = connection.executionTarget;

    /*if (executionTarget !== "v1_web" && executionTarget !== "v1_ext") {
      throw new Error(
        this.formatMsg(
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
        return {
          accountId: response.payload.accountId,
          publicKey: PublicKey.fromString(response.payload.publicKey),
          signature: Buffer.from(response.payload.signature, "base64"),
          state: response.payload.state,
        };
      } else {
        throw new Error(this.formatMsg(`Sign message failed ${response.message}`));
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
        throw new Error(this.formatMsg(`Verify owner failed ${response.message}`));
      }
    }*/

    throw new Error(`MeteorConnectV1Client: Action ID [${request["id"]}] not implemented`);
  }
}
