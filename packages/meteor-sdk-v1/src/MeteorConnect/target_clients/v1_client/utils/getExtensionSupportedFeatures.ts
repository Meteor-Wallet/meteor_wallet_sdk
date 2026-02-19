import { isV1ExtensionWithDirectAvailable } from "../../../utils/isV1ExtensionAvailable";

export async function getExtensionSupportedFeatures(): Promise<string[]> {
  if (isV1ExtensionWithDirectAvailable()) {
    return window.meteorComV2?.featureFlags ?? [];
  }

  return [];
}
