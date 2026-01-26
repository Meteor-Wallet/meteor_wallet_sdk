import { customElement as litCustomElement } from "lit/decorators.js";

export const customElement = (tagName: string) => (classTarget: any) => {
  if (typeof window === "undefined") return;

  const existing = customElements.get(tagName);

  if (existing) {
    // 1. Update the prototype of the existing registration
    // so new instances (and often existing ones) use the new logic.
    Object.setPrototypeOf(existing.prototype, classTarget.prototype);

    console.log(`[HMR] Updated logic for <${tagName}>`);
    return;
  }

  // 2. Initial registration
  return litCustomElement(tagName)(classTarget);
};

// 3. Tell Vite to accept updates for the SDK files
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    // This empty callback tells Vite "I've handled the update, don't reload the page."
  });
}
