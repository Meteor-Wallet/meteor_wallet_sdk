import { randomBytes } from "crypto";
import { getNearRpcClient } from "../../../modules_external/near/clients/near_rpc/NearRpcClient";
import { ENearNetwork } from "../../../modules_external/near/types/near_basic_types";
import { INep0413_PayloadToSign } from "../../../modules_external/near/types/standards/wallet_standard_types";
import { near_wallet_utils } from "../../../modules_external/near/utils/near_wallet_utils";
import { account_async_functions } from "../account_async_functions";

async function account_sign_message_test() {
  const accountId = "pebbledev.testnet";

  // let textEncoder = new TextEncoder();
  // const nonceArray: Uint8Array = textEncoder.encode(nanoid());

  const nonceArray = randomBytes(32);

  const payload: INep0413_PayloadToSign = {
    nonce: nonceArray,
    recipient: "test",
    message: JSON.stringify({ msg: "testing things" }),
  };

  // IN WALLET (access to private key)
  const signed = await account_async_functions.signMessage({
    accountId,
    network: ENearNetwork.testnet,
    payload,
  });

  // ON SERVER (no private key)
  const verified = near_wallet_utils.nep0413_verifySignedMessage({
    signedPayload: signed,
    originalInputs: payload,
  });

  // DATABASE CHECK nonce

  console.log(`Is verified: ${verified}`, signed);

  const keyCheck = await getNearRpcClient(ENearNetwork.testnet).view_access_key({
    account_id: `${accountId}`,
    public_key: signed.publicKey,
  });

  console.log(keyCheck);
}
