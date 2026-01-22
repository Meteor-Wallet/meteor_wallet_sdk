export function isV1ExtensionAvailable(): boolean {
  return (window as any).meteorCom != null;
}

export function isV1ExtensionWithDirectAvailable(): boolean {
  return (window as any).meteorComV2 != null;
}
