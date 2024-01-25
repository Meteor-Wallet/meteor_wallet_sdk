/**
 * Created by Paul on 2017-06-19.
 */

const isEqual = (array1: any[], array2: any[]): boolean => {
  if (array1.length !== array2.length) {
    return false;
  }

  for (let i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) {
      return false;
    }
  }

  return true;
};

export const ArrayUtils = {
  isEqual,
};
