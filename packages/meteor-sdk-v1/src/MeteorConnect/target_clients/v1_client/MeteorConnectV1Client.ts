import type { BrowserLocalStorageKeyStore } from "@near-js/keystores-browser";
import * as nearAPI from "near-api-js";
import { MeteorWallet } from "../../../MeteorWallet.ts";
import { EMeteorWalletSignInType } from "../../../ported_common/dapp/dapp.enums.ts";
import { EMCActionId, type TMCActionResponse } from "../../MeteorConnect.action.types.ts";
import type {
  IMeteorConnect_TargetClient,
  IMeteorConnectAccount,
  TMeteorConnectAccountNetwork,
} from "../../MeteorConnect.types.ts";

interface IMeteorWalletV1AndKeyStore {
  wallet: MeteorWallet;
  keyStore: BrowserLocalStorageKeyStore;
}

const sdkForNetwork: Record<TMeteorConnectAccountNetwork, IMeteorWalletV1AndKeyStore | undefined> =
  {
    mainnet: undefined,
    testnet: undefined,
  };

export class MeteorConnectV1Client implements IMeteorConnect_TargetClient {
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

  async makeRequest<R extends TMCActionResponse = TMCActionResponse>(
    request: R["request"],
  ): Promise<R> {
    const { wallet } = this.getSdkForNetwork(request.networkTarget.network);

    if (request.actionId === EMCActionId.account_sign_in) {
      console.log("MeteorConnectV1Client: Requesting sign in");

      const response = await wallet.requestSignIn({
        type: EMeteorWalletSignInType.ALL_METHODS,
        contract_id: "",
      });

      console.log("MeteorConnectV1Client: Sign in complete", response);

      if (response.success) {
        const signedInAccount = response.payload;

        const payload: IMeteorConnectAccount = {
          connection: request.connection,
          identifier: {
            accountId: signedInAccount.accountId,
            ...request.networkTarget,
          },
          publicKeys: [
            { type: "ed25519", publicKey: signedInAccount.accessKey.getPublicKey().toString() },
          ],
        };

        return {
          request,
          responsePayload: payload,
        } as R;
      } else {
        throw new Error(`MeteorConnectV1Client: Sign in failed ${response.message}`);
      }
    }

    throw new Error(`MeteorConnectV1Client: Action ID [${request["actionId"]}] not implemented`);
  }
}
