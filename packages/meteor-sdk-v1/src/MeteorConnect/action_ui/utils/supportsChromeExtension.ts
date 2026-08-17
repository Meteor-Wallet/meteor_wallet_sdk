export function supportsChromeExtension(): boolean {
  return typeof window !== "undefined" && window.chrome != null;
}
