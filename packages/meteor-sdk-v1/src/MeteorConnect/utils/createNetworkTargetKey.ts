import type { IMeteorConnectNetworkTarget, TNetworkTargetKey } from "../MeteorConnect.types.ts";

export function createNetworkTargetKey(
  networkTarget: IMeteorConnectNetworkTarget,
): TNetworkTargetKey {
  return `${networkTarget.blockchain}::${networkTarget.network}`;
}
