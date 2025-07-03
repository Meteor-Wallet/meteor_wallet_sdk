import { KeyPair, KeyPairString } from "@near-js/crypto";
import { Schema, serialize } from "borsh";
import { sha256 } from "js-sha256";
import { utils } from "near-api-js";
import {
  INep0413_PayloadToSign,
  INep0413_SignMessageParams,
  INep0413_SignedMessage,
} from "../types/standards/wallet_standard_types";

class Message {
  tag: number;
  message: string;
  nonce: Buffer;
  recipient: string;
  callbackUrl?: string;

  constructor(data: INep0413_PayloadToSign) {
    this.tag = 2147484061;
    this.message = data.message;
    this.nonce = data.nonce;
    this.recipient = data.recipient;
    if (data.callbackUrl) {
      this.callbackUrl = data.callbackUrl;
    }
  }
}

/*const MessageSchema = new Map<Function, any>([
  [
    Message,
    {
      kind: "struct",
      fields: [
        ["tag", "u32"],
        ["message", "string"],
        ["nonce", [32]],
        ["recipient", "string"],
        [
          "callbackUrl",
          {
            kind: "option",
            type: "string",
          },
        ],
      ],
    },
  ],
]);*/

const MessageSchema: Schema = {
  struct: {
    tag: "u32",
    message: "string",
    nonce: {
      array: {
        type: "u8",
        len: 32,
      },
    },
    recipient: "string",
    callbackUrl: {
      option: "string",
    },
  },
};

class MessageLedger {
  message: string;
  nonce: Buffer;
  recipient: string;
  callbackUrl?: string;

  constructor(data: INep0413_PayloadToSign) {
    this.message = data.message;
    this.nonce = data.nonce;
    this.recipient = data.recipient;
    if (data.callbackUrl) {
      this.callbackUrl = data.callbackUrl;
    }
  }
}

/*const MessageSchemaLedger = new Map<Function, any>([
  [
    MessageLedger,
    {
      kind: "struct",
      fields: [
        ["message", "string"],
        ["nonce", [32]],
        ["recipient", "string"],
        [
          "callbackUrl",
          {
            kind: "option",
            type: "string",
          },
        ],
      ],
    },
  ],
]);*/

const MessageSchemaLedger: Schema = {
  struct: {
    message: "string",
    nonce: {
      array: {
        type: "u8",
        len: 32,
      },
    },
    recipient: "string",
    callbackUrl: {
      option: "string",
    },
  },
};

function nep0413_createSignMessagePayloadHash(inputs: INep0413_PayloadToSign): number[] {
  if (inputs.nonce.byteLength !== 32) {
    throw Error("Expected nonce to be a 32 bytes buffer");
  }

  const borshPayload = serialize(MessageSchema, new Message(inputs));

  return sha256.array(borshPayload);
}

function nep0413_createLedgerSignMessagePayloadBuffer(inputs: INep0413_PayloadToSign): Buffer {
  if (inputs.nonce.byteLength !== 32) {
    throw Error("Expected nonce to be a 32 bytes buffer");
  }

  return Buffer.from(serialize(MessageSchemaLedger, new MessageLedger(inputs)));
}

interface IOSignMessageWithAccountAndPrivateKey extends INep0413_SignMessageParams {
  /**
   * in the format "ed25519:KEY"
   */
  privateKey: string | KeyPair;
  accountId: string;
}

function nep0413_signMessageWithAccountAndPrivateKey(
  inputs: IOSignMessageWithAccountAndPrivateKey,
): INep0413_SignedMessage {
  const hashedPayload = nep0413_createSignMessagePayloadHash({
    message: inputs.message,
    nonce: inputs.nonce,
    recipient: inputs.recipient,
    callbackUrl: inputs.callbackUrl,
  });

  const keyPair =
    typeof inputs.privateKey === "string"
      ? KeyPair.fromString(inputs.privateKey as KeyPairString)
      : inputs.privateKey;

  const signedPayload = keyPair.sign(Uint8Array.from(hashedPayload));

  return {
    signature: Buffer.from(signedPayload.signature).toString("base64"),
    accountId: inputs.accountId,
    publicKey: signedPayload.publicKey.toString(),
  };
}

interface IOVerifySignedMessage_Inputs {
  originalInputs: INep0413_PayloadToSign;
  signedPayload: INep0413_SignedMessage;
}

function nep0413_verifySignedMessage(inputs: IOVerifySignedMessage_Inputs): boolean {
  const hashedPayload = nep0413_createSignMessagePayloadHash(inputs.originalInputs);
  const createdPublicKey = utils.PublicKey.from(inputs.signedPayload.publicKey);

  return createdPublicKey.verify(
    new Uint8Array(Buffer.from(hashedPayload)),
    Buffer.from(inputs.signedPayload.signature, "base64"),
  );
}

export const near_wallet_utils = {
  nep0413_createLedgerSignMessagePayloadBuffer,
  nep0413_signMessageWithAccountAndPrivateKey,
  nep0413_createSignMessagePayloadHash,
  nep0413_verifySignedMessage,
};
