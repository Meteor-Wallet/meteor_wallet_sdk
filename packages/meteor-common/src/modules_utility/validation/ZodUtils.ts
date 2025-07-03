import _ from "lodash";
import { ZodError, ZodSchema } from "zod";

const getLanguageForPathItem = (pathItem: number | string) =>
  typeof pathItem === "number" ? `item number "${pathItem}"` : `"${pathItem}"`;

const getConjunctionForPathItem = (pathItem: number | string) =>
  typeof pathItem === "number" ? "inside the list" : "on";

function niceErrorMessage(error: ZodError, separator: string = "\n"): string {
  let message = "";

  let issues = error.issues;

  if (error.issues?.[0].code === "invalid_union") {
    issues = _.uniqBy(
      error.issues[0].unionErrors.flatMap((ue) => ue.issues),
      (i) => {
        return i.path.join("___") + i.message;
      },
    );
  }

  for (const issue of issues) {
    const pathLength = issue.path.length;
    const lastPathItem = issue.path[pathLength - 1];

    message = `${message}${separator}${getLanguageForPathItem(lastPathItem)} ${
      pathLength > 1
        ? ` (${getConjunctionForPathItem(lastPathItem)} ${issue.path
            .reverse()
            .map((p, i) =>
              i === 0
                ? ""
                : `${getLanguageForPathItem(p)}${
                    i < pathLength - 1 ? ` ${getConjunctionForPathItem(p)} ` : ""
                  }`,
            )
            .join(" ")}) `
        : " "
    }${issue.message}`;
  }

  return message.trim();
}

function parseOrNull<T>(zodSchema: ZodSchema<T>, data: any): T | null {
  const parsed = zodSchema.safeParse(data);

  if (parsed.success) {
    return parsed.data;
  }

  console.error(niceErrorMessage(parsed.error, " & "));
  return null;
}

export const ZodUtils = {
  niceErrorMessage,
  parseOrNull,
};
