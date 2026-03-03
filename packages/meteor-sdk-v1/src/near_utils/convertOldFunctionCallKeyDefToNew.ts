import type { AddFunctionCallKeyParams } from "../MeteorConnect/action/mc_action.near";
import type { PartialBy } from "../ported_common/utils/special_typescript_types";

export function convertOldFunctionCallKeyDefToNew({
  contractId,
  methodNames,
}: {
  contractId: string;
  methodNames?: Array<string>;
}): PartialBy<AddFunctionCallKeyParams, "publicKey"> {
  return {
    contractId,
    allowMethods:
      methodNames != null && methodNames.length > 0
        ? {
            anyMethod: false,
            methodNames,
          }
        : {
            anyMethod: true,
          },
  };
}
