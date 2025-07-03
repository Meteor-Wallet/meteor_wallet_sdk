export const StringUtil = {
  omitText(text: string, keepAmount: number): string {
    if (keepAmount >= text.length) {
      return text;
    }

    const halfToKeep = Math.floor(keepAmount / 2);

    const start = text.slice(0, halfToKeep);
    const end = text.slice(text.length - halfToKeep);

    return `${start}...${end}`;
  },
};
