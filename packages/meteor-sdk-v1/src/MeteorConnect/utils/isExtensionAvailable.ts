export function isExtensionAvailable(): boolean {
  return (window as any).meteorWallet != null;
}
