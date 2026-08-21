export function supportsChromeExtension(): boolean {
  // Feature-detected with `in` rather than `window.chrome`: the SDK is consumed by source from
  // packages that do not (and should not have to) pull in `@types/chrome`, and the property read
  // is a compile error there.
  return typeof window !== "undefined" && "chrome" in window;
}
