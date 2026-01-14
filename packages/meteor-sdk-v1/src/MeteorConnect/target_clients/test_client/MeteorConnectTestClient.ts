import { KeyPairEd25519 } from "@near-js/crypto";
import { KeyPairSigner } from "@near-js/signers";
import type { TMCActionDefinition } from "../../action/mc_action.combined.ts";
import { MeteorConnectClientBase } from "../base/MeteorConnectClientBase.ts";
import { createFakeAccount } from "./utils/testClientFakeData.ts";

export class MeteorConnectTestClient extends MeteorConnectClientBase {
  clientName = "MeteorConnect TEST Client";

  async resolveRequest<R extends TMCActionDefinition = TMCActionDefinition>(
    request: R["request"],
  ): Promise<R["outcome"]> {
    if (request.actionId === "near::sign_in") {
      return createFakeAccount(request.target, request.connection);
    }

    if (request.actionId === "near::sign_out") {
      return request.target as R["outcome"];
    }

    if (request.actionId === "near::sign_message") {
      const signer = new KeyPairSigner(KeyPairEd25519.fromRandom());
      return await signer.signNep413Message(
        request.messageParams.message,
        request.target.accountId,
        request.messageParams.recipient,
        request.messageParams.nonce,
        request.messageParams.callbackUrl,
      );
    }

    throw new Error(`MeteorConnectTestClient: Action ID [${request["actionId"]}] not implemented`);
  }
}
