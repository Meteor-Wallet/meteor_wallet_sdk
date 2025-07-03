import { KeyData } from "./KeyData";

export abstract class KeyPart {
  protected readonly data: KeyData;

  constructor(data: KeyData) {
    this.data = data;
  }

  abstract toPrefixedString(): string;

  getKeyData(): KeyData {
    return this.data;
  }

  isEqualTo(keyPart: KeyPart): boolean {
    return this.data.isEqualTo(keyPart.data);
  }
}
