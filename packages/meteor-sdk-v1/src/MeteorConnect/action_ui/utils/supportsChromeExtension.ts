export function supportsChromeExtension(): boolean {
  return window != null && (window as any).chrome != null;
}
