import { uniqueNamesGenerator, adjectives, Config, colors, animals } from "unique-names-generator";

const randomIndex = () => Math.round(Math.random());

const dictionaries = () => {
  const d1 = [adjectives, colors];
  return [d1[randomIndex()], animals];
};

export const generateRandomAccountName = (config?: Partial<Config>) => {
  const randomName = uniqueNamesGenerator({
    dictionaries: dictionaries(),
    separator: "",
    ...config,
  });

  return randomName.toLowerCase();
};
