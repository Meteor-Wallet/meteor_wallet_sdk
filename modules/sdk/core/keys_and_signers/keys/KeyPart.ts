import { KeyData } from "./KeyData";
import { IEqualityCheckable } from "../../utility/managers/list_manager/list_manager.interfaces";

export abstract class KeyPart implements IEqualityCheckable<KeyPart> {
  protected readonly data: KeyData;

  constructor(data: KeyData) {
    this.data = data;
  }

  getKeyData(): KeyData {
    return this.data;
  }

  isEqualTo(keyPart: KeyPart): boolean {
    return this.data.isEqualTo(keyPart.data);
  }
}
