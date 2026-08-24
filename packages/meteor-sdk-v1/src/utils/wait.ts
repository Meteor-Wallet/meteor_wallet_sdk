/**
 * A local `setTimeout` promise.
 *
 * Previously `wait_utils.waitMillis` from `@meteorwallet/utils/javascript_helpers/wait.utils`. That
 * deep subpath resolves through a wildcard `exports` entry with nested conditions, which Node
 * handles but Parcel's default resolver does not — so the published SDK could not be bundled by a
 * Parcel consumer (REVIEW-consumer-implementation B-01). Five lines are not worth a runtime
 * dependency and a resolver-compatibility risk on the public package surface.
 */
export async function waitMillis(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
