import bs58 from "bs58";
import { ArrayUtils } from "../../../modules_utility/data_type_utils/ArrayUtils";

export class KeyData {
  private readonly data: Uint8Array;

  constructor(rawBytes: Uint8Array) {
    this.data = rawBytes;
  }

  isEqualTo(keyData: KeyData): boolean {
    return ArrayUtils.isEqual([...this.data], [...keyData.data]);
  }

  bytes(): Uint8Array {
    return this.data;
  }

  static fromBase58(base58: string): KeyData {
    return new KeyData(bs58.decode(base58));
  }

  static fromBase64(base64: string): KeyData {
    return new KeyData(Buffer.from(base64, "base64"));
  }

  toBase58(): string {
    return bs58.encode(this.data);
  }

  toBase64(): string {
    return Buffer.from(this.data).toString("base64");
  }
}
