import { ESignerGenericType } from "./signer.enums.ts";
import { TSignerDerivation_All_StorableData } from "../signer_origins/signer_origin.storable.interfaces.ts";
import { IUniqueAccountProps } from "../../account/account.interfaces.ts";

export interface ISignerStorableData {
  derivation: TSignerDerivation_All_StorableData;
  genericType: ESignerGenericType;
  userBackedUp: boolean;
  account: IUniqueAccountProps;
}

export interface IKeyPairSignerStorableData extends ISignerStorableData {
  privateKeyBase64: string;
}
