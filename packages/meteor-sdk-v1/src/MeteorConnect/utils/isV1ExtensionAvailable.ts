export function isV1ExtensionAvailable(): boolean {
  return (window as any).meteorCom != null;
}
