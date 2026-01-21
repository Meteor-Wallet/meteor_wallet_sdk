import { KeyPairEd25519 } from "@near-js/crypto";
import { KeyPairSigner } from "@near-js/signers";
import type { TMCActionOutput, TMCActionRegistry } from "../../action/mc_action.combined.ts";
import type { TMCActionRequestUnionExpandedInput } from "../../action/mc_action.types.ts";
import type { TMeteorExecutionTargetConfig } from "../../MeteorConnect.types.ts";
import { MeteorConnectClientBase } from "../base/MeteorConnectClientBase.ts";
import { createFakeAccount } from "./utils/testClientFakeData.ts";

export class MeteorConnectTestClient extends MeteorConnectClientBase {
  clientName = "MeteorConnect TEST Client";

  async getExecutionTargetConfigs(): Promise<TMeteorExecutionTargetConfig[]> {
    return [
      {
        executionTarget: "test",
      },
    ];
  }

  async makeRequest<R extends TMCActionRequestUnionExpandedInput<TMCActionRegistry>>(
    request: R,
    connection: TMeteorExecutionTargetConfig,
  ): Promise<TMCActionOutput<R>> {
    if (request.id === "near::sign_in") {
      return createFakeAccount(request.expandedInput.target, connection);
    }

    if (request.id === "near::sign_out") {
      return request.expandedInput.account.identifier;
    }

    if (request.id === "near::sign_message") {
      const signer = new KeyPairSigner(KeyPairEd25519.fromRandom());
      return await signer.signNep413Message(
        request.expandedInput.messageParams.message,
        request.expandedInput.account.identifier.accountId,
        request.expandedInput.messageParams.recipient,
        request.expandedInput.messageParams.nonce,
        request.expandedInput.messageParams.callbackUrl,
      );
    }

    throw new Error(`MeteorConnectTestClient: Action ID [${request["actionId"]}] not implemented`);
  }
}
