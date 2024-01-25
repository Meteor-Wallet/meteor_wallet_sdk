function isEnumMember<T extends { [key: string]: string }>(
  enumObj: T,
  value: string,
): value is T[keyof T] {
  return Object.values(enumObj).includes(value);
}

export const EnumUtils = {
  isEnumMember,
};
