import { ObjectUtils } from "./object.utils";

describe("ObjectUtils.isEmptyObject", () => {
  it("returns true for an empty object", () => {
    const emptyObject = {};
    expect(ObjectUtils.isEmptyObject(emptyObject)).toBe(true);
  });

  it("returns false for a non-empty object", () => {
    const nonEmptyObject = { key: "value" };
    expect(ObjectUtils.isEmptyObject(nonEmptyObject)).toBe(false);
  });
});
