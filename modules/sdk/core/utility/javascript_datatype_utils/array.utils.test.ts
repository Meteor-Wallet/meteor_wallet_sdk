import { ArrayUtils } from "./array.utils";

test("isEqual should return true for equal arrays", () => {
  const array1 = [1, 2, 3];
  const array2 = [1, 2, 3];
  expect(ArrayUtils.isEqual(array1, array2)).toBe(true);
});

test("isEqual should return false for different arrays", () => {
  const array1 = [1, 2, 3];
  const array2 = [1, 2, 4];
  expect(ArrayUtils.isEqual(array1, array2)).toBe(false);
});

test("isEqual should return false for arrays of different lengths", () => {
  const array1 = [1, 2, 3];
  const array2 = [1, 2, 3, 4];
  expect(ArrayUtils.isEqual(array1, array2)).toBe(false);
});
