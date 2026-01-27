import type { PartialBy } from "../../ported_common/utils/special_typescript_types";
import type { IMeteorConnectAccountIdentifier } from "../MeteorConnect.types";

export function accountTargetToText(
  target: PartialBy<IMeteorConnectAccountIdentifier, "accountId">,
): string {
  return `${target.blockchain}:${target.network}${target.accountId != null ? `:${target.accountId}` : ""}`;
}
