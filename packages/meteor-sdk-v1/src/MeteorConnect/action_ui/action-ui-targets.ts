import type { TMeteorConnectionExecutionTarget } from "../MeteorConnect.types";

/**
 * Account-targeted actions must stay on the platform that owns the account.
 * Untargeted actions (notably sign-in) may offer every configured platform.
 */
export function getVisibleActionTargets(
  availableTargets: TMeteorConnectionExecutionTarget[],
  contextualTarget?: TMeteorConnectionExecutionTarget,
): TMeteorConnectionExecutionTarget[] {
  return contextualTarget == null ? availableTargets : [contextualTarget];
}
