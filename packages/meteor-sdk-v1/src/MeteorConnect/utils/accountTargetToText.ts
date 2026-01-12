import type { PartialBy } from "../../ported_common/utils/special_typescript_types.ts";
import type { IMeteorConnectAccountIdentifier } from "../MeteorConnect.types.ts";

export function accountTargetToText(
  target: PartialBy<IMeteorConnectAccountIdentifier, "accountId">,
): string {
  return `${target.blockchain}:${target.network}${target.accountId != null ? `:${target.accountId}` : ""}`;
}
