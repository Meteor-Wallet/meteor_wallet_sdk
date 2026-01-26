import { type NearNep413MessagePayload, serializeMessageNep413 } from "@meteorwallet/sdk";
import { PublicKey } from "@near-js/crypto";
import { base64 } from "@scure/base";
import { type IPropsWalletAction } from "./wallet-action.types.ts";
// import {} from

export const SignMessage = ({ wallet }: IPropsWalletAction) => {
  const signMessage = async () => {
    try {
      const nonce = new Uint8Array(window.crypto.getRandomValues(new Uint8Array(32)));

      const message: NearNep413MessagePayload = { message: "Hello", recipient: "Demo app", nonce };

      const result = await wallet.signMessage?.(message);
      console.log("Signed Message", result);

      if (result != null) {
        const messageSerialized = serializeMessageNep413(message);

        const publicKey = PublicKey.from(result!.publicKey);
        const isValid = publicKey.verify(messageSerialized, base64.decode(result!.signature));

        console.log(`Is verified: ${isValid}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={"input-form"}>
      <div className={"input-row no-grid"}>
        <button className={"input-button"} onClick={() => signMessage()}>
          Sign message
        </button>
      </div>
    </div>
  );
};
