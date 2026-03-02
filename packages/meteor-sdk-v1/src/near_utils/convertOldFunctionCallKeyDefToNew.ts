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
    receiverId: contractId,
    methodTarget:
      methodNames != null && methodNames.length > 0
        ? {
            target: "select_methods",
            methodNames,
          }
        : {
            target: "all_methods",
          },
  };
}
