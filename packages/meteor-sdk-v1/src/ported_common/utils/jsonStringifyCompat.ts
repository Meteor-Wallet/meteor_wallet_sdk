export function jsonStringifyCompat(value: any): string {
  return JSON.stringify(value, (key, value) =>
    typeof value === "bigint" ? value.toString() : value,
  );
}
