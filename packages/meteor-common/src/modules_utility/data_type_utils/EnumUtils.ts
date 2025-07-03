interface StringEnumType {
  [name: string]: string;
}

export function getEnumValues<T extends object>(fromEnum: T): T[keyof T][] {
  const values: T[keyof T][] = [];

  for (const keyValue in fromEnum as any) {
    if (Object.hasOwn(fromEnum, keyValue) && typeof fromEnum[keyValue] === "string") {
      values.push(fromEnum[keyValue] as T[keyof T]);
    }
  }

  return values;
}

export const EnumUtils = {
  getEnumValues,
};

export function isEnum<TEnum extends object>(test: unknown, enumType: TEnum): test is TEnum {
  return Object.values(enumType).includes(test);
}
