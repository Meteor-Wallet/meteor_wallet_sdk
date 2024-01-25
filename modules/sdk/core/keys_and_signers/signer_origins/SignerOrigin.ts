import { IListManageable } from "../../utility/managers/list_manager/list_manager.interfaces";
import { OrdIdentity } from "../../utility/managers/list_manager/OrdIdentity";
import { ESignerOriginGenericType } from "./signer_origin.enums.ts";
import { IStorable } from "../../utility/data_entity/storable/storable.interfaces.ts";

import { ISignerOriginStorableData } from "./signer_origin.storable.interfaces.ts";

export abstract class SignerOrigin
  implements IListManageable<SignerOrigin>, IStorable<ISignerOriginStorableData>
{
  _ord: OrdIdentity = new OrdIdentity();
  abstract signerOriginType: ESignerOriginGenericType;

  abstract storableUniqueKey: Promise<string>;

  abstract getStorableUniqueKey(): Promise<string>;

  abstract getStorableData(): ISignerOriginStorableData;

  getRuntimeUniqueKey(): string | number {
    return this._ord.getOrd();
  }

  isEqualTo(signerOrigin: SignerOrigin): boolean {
    if (this.signerOriginType !== signerOrigin.signerOriginType) {
      return false;
    }

    return this.isEqualToOwnType(signerOrigin as this);
  }

  abstract isEqualToOwnType(signerOrigin: SignerOrigin): boolean;
}
