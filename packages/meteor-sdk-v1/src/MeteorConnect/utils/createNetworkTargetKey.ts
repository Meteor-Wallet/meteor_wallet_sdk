import type { IMeteorConnectNetworkTarget, TNetworkTargetKey } from "../MeteorConnect.types";

export function createNetworkTargetKey(
  networkTarget: IMeteorConnectNetworkTarget,
): TNetworkTargetKey {
  return `${networkTarget.blockchain}::${networkTarget.network}`;
}
