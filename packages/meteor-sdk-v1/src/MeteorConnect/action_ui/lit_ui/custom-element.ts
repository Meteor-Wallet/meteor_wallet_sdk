import type { LitElement } from "lit";
import { customElement as litCustomElement } from "lit/decorators.js";

type CE = CustomElementConstructor & {
  styles?: any;
  elementStyles?: any;
};

/**
 * Custom decorator that becomes HMR-friendly. When Vite swaps the module it will
 * patch the already-registered element instead of forcing a full page reload.
 */
export const customElement = <T extends CE>(tagName: string) => (classTarget: T): void | T => {
  if (typeof window === "undefined") return;

  const existing = customElements.get(tagName);

  if (existing) {
    // Overwrite prototype methods so new logic is used without redefining.
    for (const key of Reflect.ownKeys(classTarget.prototype)) {
      if (key === "constructor") continue;
      const desc = Object.getOwnPropertyDescriptor(classTarget.prototype, key);
      if (desc) {
        Object.defineProperty(existing.prototype, key, desc);
      }
    }

    // Update commonly used static fields (styles etc.).
    const staticKeys = ["styles", "shadowRootOptions", "properties"];
    for (const key of staticKeys) {
      if (key in classTarget) {
        (existing as any)[key] = (classTarget as any)[key];
      }
    }

    // Re-finalize Lit styles so adoptedStyleSheets reflect changes.
    const finalizeStyles = (existing as any).finalizeStyles ?? (classTarget as any).finalizeStyles;
    if (finalizeStyles) {
      (existing as any)._styles = undefined;
      (existing as any).elementStyles = finalizeStyles.call(existing, (existing as any).styles ?? []);
    }

    // Ask live instances to re-render with the new prototype and styles.
    document.querySelectorAll<LitElement>(tagName).forEach((el) => {
      // Refresh adopted styles on the live element.
      const ctor: any = el.constructor;
      if (el.shadowRoot && Array.isArray(ctor.elementStyles)) {
        const sheets = ctor.elementStyles
          .map((s: any) => s?.styleSheet)
          .filter(Boolean);
        if (sheets.length && (el.shadowRoot as any).adoptedStyleSheets) {
          (el.shadowRoot as any).adoptedStyleSheets = sheets;
        }
      }

      el.requestUpdate();
    });

    console.info(`[HMR] Refreshed <${tagName}>`);
    return classTarget;
  }

  return litCustomElement(tagName)(classTarget) as unknown as T;
};

// Tell Vite we've handled updates so it does not trigger a full reload.
if (import.meta.hot) {
  import.meta.hot.accept();
}
