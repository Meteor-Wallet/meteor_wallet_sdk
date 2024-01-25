import { SignerOrigin } from "../SignerOrigin";
import { PublicKey } from "../../keys/PublicKey";
import { ESignerOriginGenericType } from "../signer_origin.enums.ts";
import { hash_utils } from "../../../utility/hashing/hashing.utils.ts";
import { IStorable } from "../../../utility/data_entity/storable/storable.interfaces.ts";
import {
  IHardwareSignerOriginStorableData,
  ISignerOriginStorableData,
} from "../signer_origin.storable.interfaces.ts";

export class HardwareWalletSignerOrigin
  extends SignerOrigin
  implements IStorable<IHardwareSignerOriginStorableData>
{
  readonly storableUniqueKey: Promise<string>;
  // The hardware wallet's master public key
  publicKey: PublicKey;

  signerOriginType: ESignerOriginGenericType.hardware = ESignerOriginGenericType.hardware;

  constructor(props: { publicKey: PublicKey }) {
    super();
    this.publicKey = props.publicKey;
    this.storableUniqueKey = this.getStorableUniqueKey();
  }

  getStorableData(): IHardwareSignerOriginStorableData {
    return {
      originType: this.signerOriginType,
      publicKeyBase64: this.publicKey.getKeyData().toBase64(),
    };
  }

  async getStorableUniqueKey(): Promise<string> {
    return hash_utils.hashTextForStorageKey(this.publicKey.getKeyData().toBase64());
  }

  isEqualToOwnType(signerOrigin: HardwareWalletSignerOrigin): boolean {
    return this.publicKey.isEqualTo(signerOrigin.publicKey);
  }
}
