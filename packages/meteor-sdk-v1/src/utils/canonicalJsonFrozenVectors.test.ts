// Mirrors the bridge's canonicalJsonFrozenVectors.test.ts. A failure means the SDK's bytes drifted
// from the bridge's signed-contract bytes: a protocol break, not a fixture to update.
import { describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import { CANONICAL_JSON_REJECTION_VECTORS, CANONICAL_JSON_VECTORS } from "./canonicalJsonFrozenVectors";
import { stringifyCanonicalJson } from "./stringifyCanonicalJson";

const sha256 = (s: string) => createHash("sha256").update(s, "utf8");

describe("canonical JSON frozen vectors (shared with bridge)", () => {
  for (const vector of CANONICAL_JSON_VECTORS) {
    it(vector.name, () => {
      const out = stringifyCanonicalJson(vector.buildInput());
      expect(out).toBe(vector.canonical);
      expect(sha256(out).digest("base64")).toBe(vector.sha256Base64);
      expect(sha256(out).digest("hex")).toBe(vector.sha256Hex);
    });
  }
  for (const vector of CANONICAL_JSON_REJECTION_VECTORS) {
    it(`rejects: ${vector.name}`, () => {
      expect(() => stringifyCanonicalJson(vector.buildInput())).toThrow();
    });
  }
});
