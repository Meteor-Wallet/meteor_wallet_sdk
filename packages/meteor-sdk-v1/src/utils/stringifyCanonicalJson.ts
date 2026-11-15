// Copied verbatim from lostpebble/nice-code @ v0.110.0 (a700c7959247cd5a931985667327afeea9266c88),
// packages/nice-util/src/crypto/canonical/stringifyCanonicalJson.ts — formerly imported from the
// nice-code `util` package. The output bytes are a frozen contract (hashed and signed); see the test file.

/**
 * Deterministic, signing-grade JSON serialization: the same data always produces the same bytes,
 * regardless of key insertion order — the foundation for content hashes, idempotency keys, and
 * signed challenges. This is a **frozen project contract** (guarded by byte-level test vectors),
 * not RFC 8785/JCS. The exact rules:
 *
 * - `null`, booleans, strings, and finite numbers serialize with native `JSON.stringify` spelling
 *   and escaping (so `-0` emits `0`).
 * - Objects contribute their **own enumerable string-keyed** entries only, sorted by UTF-16
 *   code-unit order; entries whose value is `undefined` are omitted. Symbol keys and prototype
 *   properties are ignored. `toJSON` is **never** invoked — a Date/Map/Set/class instance
 *   contributes only its own enumerable entries.
 * - Arrays retain element order. A sparse **hole** serializes as `null` (native JSON behavior); an
 *   **explicit** `undefined`/function/symbol/bigint element throws.
 * - Non-finite numbers, bigints, functions/symbols as values, top-level `undefined`, and circular
 *   references throw. Repeated (non-cyclic) references are allowed.
 *
 * Error *messages* are not part of the contract; accepted-value bytes are.
 */
export function stringifyCanonicalJson(value: unknown): string {
  return writeCanonical(value, "$", new Set());
}

function writeCanonical(value: unknown, path: string, ancestors: Set<object>): string {
  if (value === null) return "null";
  switch (typeof value) {
    case "string":
      return JSON.stringify(value);
    case "boolean":
      return value ? "true" : "false";
    case "number":
      if (!Number.isFinite(value)) {
        throw new Error(`stringifyCanonicalJson: non-finite number at ${path}`);
      }
      return JSON.stringify(value);
    case "undefined":
    case "bigint":
    case "function":
    case "symbol":
      throw new Error(`stringifyCanonicalJson: unsupported ${typeof value} at ${path}`);
    default:
      break;
  }

  const obj = value as object;
  if (ancestors.has(obj)) {
    throw new Error(`stringifyCanonicalJson: circular reference at ${path}`);
  }
  ancestors.add(obj);
  try {
    if (Array.isArray(obj)) {
      let out = "[";
      for (let i = 0; i < obj.length; i++) {
        if (i > 0) out += ",";
        // A hole (absent index) is native JSON's `null`; an explicit undefined element throws
        // in the recursion — the `in` check is what tells them apart.
        out += i in obj ? writeCanonical(obj[i], `${path}[${i}]`, ancestors) : "null";
      }
      return `${out}]`;
    }
    const record = obj as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    const parts: string[] = [];
    for (const key of keys) {
      const entry = record[key];
      if (entry === undefined) continue;
      parts.push(`${JSON.stringify(key)}:${writeCanonical(entry, `${path}.${key}`, ancestors)}`);
    }
    return `{${parts.join(",")}}`;
  } finally {
    ancestors.delete(obj);
  }
}
