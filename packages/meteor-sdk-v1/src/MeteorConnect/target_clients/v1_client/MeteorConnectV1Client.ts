import { PublicKey } from "@near-js/crypto";
import type { BrowserLocalStorageKeyStore } from "@near-js/keystores-browser";
import * as nearAPI from "near-api-js";
import { MeteorWallet } from "../../../MeteorWallet.ts";
import { EMeteorWalletSignInType } from "../../../ported_common/dapp/dapp.enums.ts";
import type { TMCActionDefinition } from "../../action/mc_action.combined.types.ts";
import type { TMeteorConnectAccountNetwork } from "../../MeteorConnect.types.ts";
import { MeteorConnectClientBase } from "../base/MeteorConnectClientBase.ts";

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

  async resolveRequest<R extends TMCActionDefinition = TMCActionDefinition>(
    request: R["request"],
  ): Promise<R["outcome"]> {
    if (request.actionId === "near::sign_in") {
      const { wallet } = this.getSdkForNetwork(request.target.network);

      const response = await wallet.requestSignIn({
        type: EMeteorWalletSignInType.ALL_METHODS,
        contract_id: "",
      });

      if (response.success) {
        const signedInAccount = response.payload;

        return {
          connection: request.connection,
          identifier: {
            accountId: signedInAccount.accountId,
            ...request.target,
          },
          publicKeys: [
            { type: "ed25519", publicKey: signedInAccount.accessKey.getPublicKey().toString() },
          ],
        };
      } else {
        throw new Error(`MeteorConnectV1Client: Sign in failed ${response.message}`);
      }
    }

    if (request.actionId === "near::sign_out") {
      const { wallet } = this.getSdkForNetwork(request.target.network);

      await wallet.signOut();
      return request.target as R["outcome"];
    }

    if (request.actionId === "near::sign_message") {
      const { wallet } = this.getSdkForNetwork(request.target.network);
      const response = await wallet.signMessage({
        ...request.messageParams,
        accountId: request.target.accountId,
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

    throw new Error(`MeteorConnectV1Client: Action ID [${request["actionId"]}] not implemented`);
  }
}
