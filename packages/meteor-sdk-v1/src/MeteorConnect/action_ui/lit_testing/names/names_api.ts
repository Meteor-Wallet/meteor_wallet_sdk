export type TLibNamesResult = Array<{ name: string }>;
export type TLibNamesKind = (typeof lib_names_kinds)[number];

export const lib_names_baseUrl = "https://swapi.py4e.com/api/";

export const lib_names_kinds = [
  "",
  "people",
  "starships",
  "species",
  "planets",
  // Inserted to demo an error state.
  "error",
] as const;
