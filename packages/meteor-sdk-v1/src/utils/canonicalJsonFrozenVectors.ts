// Copied verbatim from meteor-connect-bridge packages/meteor-connect-shared/src/utils/serialization/canonicalJsonFrozenVectors.ts.
// Same vectors in both repos = same wire bytes. Never edit one side alone.
/**
 * Frozen canonical-JSON vectors for the repository's sole signing-grade serializer:
 * nice-code/util's stringifyCanonicalJson and SHA-256 helpers.
 *
 * Phase 1 originally used this file to compare the library with a repo-local serializer. The
 * comparison exposed integer-like-key ordering and explicit-undefined divergences. D28's
 * pre-release hard cut selected the stricter library implementation for every contract and deleted
 * the local serializer, so this file now pins one authority only:
 *
 * - accepted vectors freeze exact canonical bytes plus padded-base64/lowercase-hex SHA-256; and
 * - rejection vectors freeze the accepted-value boundary (exception type/message is not contract).
 *
 * Inputs are functions because several values (-0, sparse holes, explicit undefined, non-plain
 * objects) cannot round-trip through JSON. Do not edit an existing accepted vector casually: moving
 * its bytes changes creation proofs, idempotency bindings, deterministic names, or signatures.
 */

export interface ICanonicalJsonVector {
  name: string;
  buildInput: () => unknown;
  /** Exact canonical string the library must produce, byte for byte. */
  canonical: string;
  /** SHA-256 of the UTF-8 canonical string, standard padded base64. */
  sha256Base64: string;
  /** SHA-256 of the UTF-8 canonical string, lowercase hex. */
  sha256Hex: string;
}

export interface ICanonicalJsonRejectionVector {
  name: string;
  buildInput: () => unknown;
}

const buildSparseArray = (): unknown => {
  const sparse: unknown[] = [1];
  sparse[2] = 3;
  return sparse;
};

const buildRepeatedReference = (): unknown => {
  const shared: Record<string, unknown> = { note: "shared reference twice is legal" };
  return { first: shared, second: shared };
};

const buildNonPlainWithOwnEntries = (): unknown => {
  const boxed: unknown = Object.assign(new Date(0), { ownEntry: "kept" });
  return { boxed };
};

const buildCircular = (): unknown => {
  const cyc: Record<string, unknown> = {};
  cyc["self"] = cyc;
  return cyc;
};

export const CANONICAL_JSON_VECTORS: ICanonicalJsonVector[] = [
  {
    name: "empty object",
    buildInput: () => ({}),
    canonical: "{}",
    sha256Base64: "RBNvo1WzZ4oRRq0W9+hknpT7T8If536DEMBg9hyq/4o=",
    sha256Hex: "44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a",
  },
  {
    name: "empty array",
    buildInput: () => [],
    canonical: "[]",
    sha256Base64: "T1PNoYwrqgwDVLtfmj7L5e0Sq02OEbqHPC8RFhICuUU=",
    sha256Hex: "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
  },
  {
    name: "primitive scalars with sorted keys",
    buildInput: () => ({ t: true, f: false, n: null, s: "text", i: 42 }),
    canonical: '{"f":false,"i":42,"n":null,"s":"text","t":true}',
    sha256Base64: "nHE5DVt1paY3i7fJSfOG7ko+1yh5EoTN82/pm0PTpOE=",
    sha256Hex: "9c71390d5b75a5a6378bb7c949f386ee4a3ed728791284cdf36fe99b43d3a4e1",
  },
  {
    name: "UTF-16 code-unit key sort including a non-BMP key",
    buildInput: () => ({ "\u{10000}": 1, "｡": 2, a: 3, Z: 4, "~": 5 }),
    canonical: '{"Z":4,"a":3,"~":5,"𐀀":1,"｡":2}',
    sha256Base64: "etoVZzWWuDsqrMasx2hp8M72xKLqp3lrT9wyvwIwtes=",
    sha256Hex: "7ada15673596b83b2aacc6acc76869f0cef6c4a2eaa7796b4fdc32bf0230b5eb",
  },
  {
    name: "integer-like keys sort by UTF-16 code unit rather than object enumeration order",
    buildInput: () => ({ "10": "ten", "2": "two", alpha: true }),
    canonical: '{"10":"ten","2":"two","alpha":true}',
    sha256Base64: "HlPWp0/GtHH/FJ+0fMGwZfb6RsBwYvZUdUJAzKlyPzw=",
    sha256Hex: "1e53d6a74fc6b471ff149fb47cc1b065f6fa46c07062f654754240cca9723f3c",
  },
  {
    name: "dropped undefined object properties",
    buildInput: () => ({ a: 1, b: undefined, c: 3 }),
    canonical: '{"a":1,"c":3}',
    sha256Base64: "6okTLwJ62ycHQd3uoW8H7pkhF2/O8Mp0wzST8yG5hiA=",
    sha256Hex: "ea89132f027adb270741ddeea16f07ee9921176fcef0ca74c33493f321b98620",
  },
  {
    name: "number spelling (-0 emits 0; native exponent forms)",
    buildInput: () => ({
      negZero: -0,
      zero: 0,
      frac: 0.1,
      negFrac: -1.5,
      big: 1e21,
      small: 1e-7,
      intMax: 9007199254740991,
    }),
    canonical:
      '{"big":1e+21,"frac":0.1,"intMax":9007199254740991,"negFrac":-1.5,"negZero":0,"small":1e-7,"zero":0}',
    sha256Base64: "5ZGcGSgcI3gyevfrHop17Wclw/lCoQ1AfoOOzFoA+5I=",
    sha256Hex: "e5919c19281c2378327af7eb1e8a75ed6725c3f942a10d407e838ecc5a00fb92",
  },
  {
    name: "sparse array hole becomes null",
    buildInput: buildSparseArray,
    canonical: "[1,null,3]",
    sha256Base64: "fbWzahVTpOMZFN9L62B1K9BzIOMFasHTeQZgxMrWoXM=",
    sha256Hex: "7db5b36a1553a4e31914df4beb60752bd07320e3056ac1d3790660c4cad6a173",
  },
  {
    name: "array order preserved while nested object keys sort",
    buildInput: () => [{ y: 2, x: 1 }, "mid", [3, { b: 2, a: 1 }]],
    canonical: '[{"x":1,"y":2},"mid",[3,{"a":1,"b":2}]]',
    sha256Base64: "sEl4JdXYcOtCOIHpSNSzvlbOuqFI13jKRTXXgiVWqyY=",
    sha256Hex: "b0497825d5d870eb423881e948d4b3be56cebaa148d778ca4535d7822556ab26",
  },
  {
    name: "string escaping (control chars escaped, non-BMP emitted literally)",
    buildInput: () => ({
      control: "\u0000\u001f",
      quote: '"q"',
      backslash: "a\\b",
      newline: "l1\nl2",
      nonBmp: "\u{1F680}",
    }),
    canonical:
      '{"backslash":"a\\\\b","control":"\\u0000\\u001f","newline":"l1\\nl2","nonBmp":"🚀","quote":"\\"q\\""}',
    sha256Base64: "Vc4y34Wh4V4yw6YmXV6E5gXCIfP/wHqfrFoZIgS5os8=",
    sha256Hex: "55ce32df85a1e15e32c3a6265d5e84e605c221f3ffc07a9fac5a192204b9a2cf",
  },
  {
    name: "toJSON never invoked (a bare Date serializes as its own enumerable entries)",
    buildInput: () => ({ when: new Date(0) }),
    canonical: '{"when":{}}',
    sha256Base64: "mHp3HO0F+wsl6E6pcErfJmWp8HDMUhX2e8QPrQB0blk=",
    sha256Hex: "987a771ced05fb0b25e84ea9704adf2665a9f070cc5215f67bc40fad00746e59",
  },
  {
    name: "non-plain object contributes only its own enumerable entries",
    buildInput: buildNonPlainWithOwnEntries,
    canonical: '{"boxed":{"ownEntry":"kept"}}',
    sha256Base64: "QPvSjd3BGqED59gXL4NlPUqbNw2L0fCnZKozuVmGGGs=",
    sha256Hex: "40fbd28dddc11aa103e7d8172f83653d4a9b370d8bd1f0a764aa33b95986186b",
  },
  {
    name: "repeated non-cyclic reference is legal",
    buildInput: buildRepeatedReference,
    canonical:
      '{"first":{"note":"shared reference twice is legal"},"second":{"note":"shared reference twice is legal"}}',
    sha256Base64: "F0hAvefqcK0FFYsompYVuU7SRtzQqUwKSNe0qRS+wio=",
    sha256Hex: "174840bde7ea70ad05158b289a9615b94ed246dcd0a94c0a48d7b4a914bec22a",
  },
];

export const CANONICAL_JSON_REJECTION_VECTORS: ICanonicalJsonRejectionVector[] = [
  { name: "top-level undefined", buildInput: () => undefined },
  { name: "explicit undefined array element", buildInput: () => [1, undefined, 3] },
  { name: "NaN", buildInput: () => ({ v: Number.NaN }) },
  { name: "Infinity", buildInput: () => ({ v: Number.POSITIVE_INFINITY }) },
  { name: "negative Infinity", buildInput: () => ({ v: Number.NEGATIVE_INFINITY }) },
  { name: "bigint value", buildInput: () => ({ v: BigInt(1) }) },
  { name: "function value", buildInput: () => ({ v: () => 1 }) },
  { name: "symbol value", buildInput: () => ({ v: Symbol("s") }) },
  { name: "circular reference", buildInput: buildCircular },
];
