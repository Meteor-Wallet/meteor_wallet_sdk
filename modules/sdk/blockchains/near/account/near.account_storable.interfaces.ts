import { IBasicAccountStorableData } from "../../../core/account/BasicAccount.interfaces.ts";

export interface INearAccountStateFeatureStorableData {
  exists: boolean;
}

export interface INearBasicAccountStorableData extends IBasicAccountStorableData {
  stateFeature: INearAccountStateFeatureStorableData;
}
