import { PublicKey } from "@near-js/crypto";
import type { BrowserLocalStorageKeyStore } from "@near-js/keystores-browser";
import * as nearAPI from "near-api-js";
import { MeteorWallet } from "../../../MeteorWallet.ts";
import { EMeteorWalletSignInType } from "../../../ported_common/dapp/dapp.enums.ts";
import type { TMeteorSdkV1Transaction } from "../../../ported_common/dapp/dapp.types.ts";
import type { TMCActionOutput, TMCActionRegistry } from "../../action/mc_action.combined.ts";
import type { TMCActionRequestUnionExpandedInput } from "../../action/mc_action.types.ts";
import type { TMeteorConnectAccountNetwork, TMeteorConnection } from "../../MeteorConnect.types.ts";
import { MeteorConnectClientBase } from "../base/MeteorConnectClientBase.ts";
import { nearActionToSdkV1Action } from "./utils/nearActionToSdkV1Action.ts";

interface IMeteorWalletV1AndKeyStore {
  wallet: MeteorWallet;
  keyStore: BrowserLocalStorageKeyStore;
}

const sdkForNetwork: Record<TMeteorConnectAccountNetwork, IMeteorWalletV1AndKeyStore | undefined> =
  {
    mainnet: undefined,
    testnet: undefined,
  };

export class MeteorConnectV1Client extends MeteorConnectClientBase {
  clientName = "MeteorConnect V1 Client";

  private getSdkForNetwork(network: TMeteorConnectAccountNetwork): IMeteorWalletV1AndKeyStore {
    if (sdkForNetwork[network] != null) {
      return sdkForNetwork[network];
    }

    const keyStore = new nearAPI.keyStores.BrowserLocalStorageKeyStore(
      window.localStorage,
      "_meteor_wallet",
    );

    const wallet = new MeteorWallet({
      networkId: network,
      keyStore,
    });

    sdkForNetwork[network] = {
      wallet,
      keyStore,
    };

    return sdkForNetwork[network];
  }

  async makeRequest<R extends TMCActionRequestUnionExpandedInput<TMCActionRegistry>>(
    request: R,
    connection: TMeteorConnection,
  ): Promise<{ output: TMCActionOutput<R> }> {
    if (request.id === "near::sign_in") {
      const { wallet } = this.getSdkForNetwork(request.expandedInput.target.network);

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
          output: {
            connection,
            identifier: {
              accountId: signedInAccount.accountId,
              ...request.expandedInput.target,
            },
            publicKeys: [
              { type: "ed25519", publicKey: signedInAccount.accessKey.getPublicKey().toString() },
            ],
          },
        };
      } else {
        throw new Error(`MeteorConnectV1Client: Sign in failed ${response.message}`);
      }
    }

    if (request.id === "near::sign_out") {
      const { wallet } = this.getSdkForNetwork(request.expandedInput.account.identifier.network);

      await wallet.signOut();
      return { output: request.expandedInput.account.identifier };
    }

    if (request.id === "near::sign_message") {
      const { wallet } = this.getSdkForNetwork(request.expandedInput.account.identifier.network);
      const response = await wallet.signMessage({
        ...request.expandedInput.messageParams,
        accountId: request.expandedInput.account.identifier.accountId,
      });

      if (response.success) {
        return {
          output: {
            accountId: response.payload.accountId,
            publicKey: PublicKey.fromString(response.payload.publicKey),
            signature: Buffer.from(response.payload.signature, "base64"),
            state: response.payload.state,
          },
        };
      } else {
        throw new Error(this.formatMsg(`Sign message failed ${response.message}`));
      }
    }

    if (request.id === "near::sign_transactions") {
      const { wallet } = this.getSdkForNetwork(request.expandedInput.account.identifier.network);

      return {
        output: await wallet.requestSignTransactions({
          transactions: request.expandedInput.transactions.map((t): TMeteorSdkV1Transaction => {
            return {
              receiverId: t.receiverId,
              actions: t.actions.map((action) => nearActionToSdkV1Action(action)),
            };
          }),
        }),
      };
    }

    if (request.id === "near::verify_owner") {
      const { wallet } = this.getSdkForNetwork(request.expandedInput.account.identifier.network);

      const response = await wallet.verifyOwner({
        accountId: request.expandedInput.account.identifier.accountId,
        message: request.expandedInput.message,
      });

      if (response.success) {
        return {
          output: response.payload,
        };
      } else {
        throw new Error(this.formatMsg(`Verify owner failed ${response.message}`));
      }
    }

    throw new Error(`MeteorConnectV1Client: Action ID [${request["id"]}] not implemented`);
  }
}
