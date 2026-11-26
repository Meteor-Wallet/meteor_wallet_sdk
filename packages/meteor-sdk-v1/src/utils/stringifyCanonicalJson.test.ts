// Frozen vectors copied from lostpebble/nice-code @ v0.110.0 (a700c7959247cd5a931985667327afeea9266c88),
// packages/nice-util/src/crypto/canonical/canonical.test.ts. Never "fix" a vector to make a change pass.
import { describe, expect, it } from "bun:test";
import { stringifyCanonicalJson } from "./stringifyCanonicalJson";

describe("stringifyCanonicalJson — frozen byte-level contract", () => {
  it("sorts object keys by UTF-16 code unit, recursively", () => {
    expect(stringifyCanonicalJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
    expect(stringifyCanonicalJson({ b: { d: 1, c: 2 }, a: 0 })).toBe('{"a":0,"b":{"c":2,"d":1}}');
    // Code-unit order, not locale/codepoint order: "z" (0x7A) < "🌍" (0xD83C…) < "Ａ" (0xFF21).
    expect(stringifyCanonicalJson({ Ａ: 1, "🌍": 2, z: 3 })).toBe('{"z":3,"🌍":2,"Ａ":1}');
  });

  it("is insertion-order independent (the whole point)", () => {
    const forward = stringifyCanonicalJson({ a: 1, b: [{ x: 1, y: 2 }] });
    const backward = stringifyCanonicalJson({ b: [{ y: 2, x: 1 }], a: 1 });
    expect(forward).toBe(backward);
  });

  it("omits object entries whose value is undefined", () => {
    expect(stringifyCanonicalJson({ a: 1, b: undefined })).toBe('{"a":1}');
    expect(stringifyCanonicalJson({ b: undefined })).toBe("{}");
  });

  it("serializes -0 as 0 (native JSON.stringify spelling)", () => {
    expect(stringifyCanonicalJson(-0)).toBe("0");
    expect(stringifyCanonicalJson({ x: -0 })).toBe('{"x":0}');
  });

  it("keeps array order; a sparse HOLE is null, an explicit undefined element throws", () => {
    expect(stringifyCanonicalJson([3, 1, 2])).toBe("[3,1,2]");
    // The hole is the vector under test — constructed explicitly so no lint rule trips on it.
    const holed = new Array(3);
    holed[0] = 1;
    holed[2] = 2;
    expect(stringifyCanonicalJson(holed)).toBe("[1,null,2]");
    expect(() => stringifyCanonicalJson([1, undefined, 2])).toThrowError(/undefined/);
  });

  it("escapes strings and keys exactly as JSON.stringify (lone surrogates included)", () => {
    expect(stringifyCanonicalJson({ "\uD800": 1 })).toBe('{"\\ud800":1}');
    expect(stringifyCanonicalJson('a\nb"c')).toBe(JSON.stringify('a\nb"c'));
  });

  it("ignores prototypes and symbol keys; never invokes toJSON", () => {
    const inherited = Object.create({ fromProto: 1 });
    inherited.own = 2;
    expect(stringifyCanonicalJson(inherited)).toBe('{"own":2}');
    expect(stringifyCanonicalJson({ [Symbol("s")]: 1, a: 2 } as object)).toBe('{"a":2}');
    // A Date's value lives in an internal slot, not own enumerable entries — toJSON would leak it.
    expect(stringifyCanonicalJson(new Date(0))).toBe("{}");
    expect(stringifyCanonicalJson(new Map([["k", "v"]]))).toBe("{}");
    expect(stringifyCanonicalJson(new Set([1]))).toBe("{}");
  });

  it("allows repeated non-cyclic references, throws on cycles", () => {
    const shared = { s: 1 };
    expect(stringifyCanonicalJson({ a: shared, b: shared })).toBe('{"a":{"s":1},"b":{"s":1}}');
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() => stringifyCanonicalJson(cyclic)).toThrowError(/circular/);
    const deepCycle: unknown[] = [];
    deepCycle.push({ inner: deepCycle });
    expect(() => stringifyCanonicalJson(deepCycle)).toThrowError(/circular/);
  });

  it("rejects every non-JSON value class", () => {
    expect(() => stringifyCanonicalJson(undefined)).toThrowError(/undefined/);
    expect(() => stringifyCanonicalJson(Number.NaN)).toThrowError(/non-finite/);
    expect(() => stringifyCanonicalJson(Number.POSITIVE_INFINITY)).toThrowError(/non-finite/);
    expect(() => stringifyCanonicalJson({ x: Number.NEGATIVE_INFINITY })).toThrowError(
      /non-finite/,
    );
    expect(() => stringifyCanonicalJson(1n)).toThrowError(/bigint/);
    expect(() => stringifyCanonicalJson({ fn: () => 1 })).toThrowError(/function/);
    expect(() => stringifyCanonicalJson({ sym: Symbol("x") })).toThrowError(/symbol/);
  });
});

describe("stringifyCanonicalJson — frozen end-to-end vector", () => {
  it("serializes the nested value", () => {
    const value = { b: 1, a: [true, null, "x"], c: { z: -0, y: "héllo" } };
    expect(stringifyCanonicalJson(value)).toBe(
      '{"a":[true,null,"x"],"b":1,"c":{"y":"héllo","z":0}}',
    );
  });
});
