import bs58 from "bs58";

function encode(value: Uint8Array | string): string {
  if (typeof value === "string") {
    value = Buffer.from(value, "utf8");
  }
  return bs58.encode(Buffer.from(value));
}

function decode(value: string): Buffer {
  return Buffer.from(bs58.decode(value));
}

export const encoding_base58 = {
  encode,
  decode,
};
