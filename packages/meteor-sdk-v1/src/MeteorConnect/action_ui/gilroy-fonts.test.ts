import { expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { GILROY_FONT_FAMILY_DATA_URL_STYLESHEET } from "./lit_ui/font/gilroy-font-kit/gilroy_font.static";

it("ships the actual Gilroy faces required by the main UI without consumer asset URLs", () => {
  const faces = [...GILROY_FONT_FAMILY_DATA_URL_STYLESHEET.matchAll(/@font-face\s*\{([^}]+)\}/g)];
  expect(faces).toHaveLength(5);
  for (const [weight, name] of [[400, "Regular"], [500, "Medium"], [600, "Semibold"], [700, "Bold"], [800, "Extrabold"]] as const) {
    const face = faces.find((match) => match[1].includes(`font-weight: ${weight};`))?.[1];
    expect(face).toBeDefined();
    expect(face).not.toContain("local(");
    const encoded = face!.match(/url\('data:font\/woff2;base64,([^']+)'\)/)?.[1];
    expect(encoded).toBeDefined();
    const asset = readFileSync(new URL(`./lit_ui/font/gilroy-font-kit/Gilroy-${name}.woff2`, import.meta.url));
    expect(Buffer.from(encoded!, "base64")).toEqual(asset);
  }
});
