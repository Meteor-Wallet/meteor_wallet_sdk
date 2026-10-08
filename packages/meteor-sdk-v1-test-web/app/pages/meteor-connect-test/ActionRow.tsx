import type { ReactNode } from "react";
import type { IActionResult } from "./results/resultsModel";
import { ActionResultCard, useActionResults } from "./results/ActionResultsUi";

/**
 * One testable request: what it does, its inputs, its button(s) — and directly underneath, how the
 * last attempt went. On a phone that inline result is the whole point: it sits where the tester
 * tapped, so coming back from the wallet app shows the answer without hunting for it.
 *
 * `resultKeys[0]` is the row's primary request. Follow-up keys (a relay after a sign, a second
 * prompt after a sign-in) are shown only when they belong to the latest primary attempt, so an
 * old follow-up never sits under a fresh, unrelated result.
 */
export const ActionRow = ({
  title,
  description,
  resultKeys,
  inputs,
  actions,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  resultKeys: readonly string[];
  inputs?: ReactNode;
  actions: ReactNode;
  children?: ReactNode;
}) => {
  const { results } = useActionResults();
  const latest = resultKeys
    .map((key) => results.find((result) => result.key === key))
    .filter((result): result is IActionResult => result != null);
  const anchor = results.find((result) => result.key === resultKeys[0])?.startedAt;
  const shown = latest
    .filter((result) => anchor == null || result.startedAt >= anchor)
    .sort((a, b) => a.startedAt - b.startedAt);

  return (
    <div className={"flex min-w-0 flex-col gap-3 py-4 first:pt-0 last:pb-0"}>
      <div className={"min-w-0"}>
        <h3 className={"text-sm font-semibold text-slate-900 dark:text-slate-100"}>{title}</h3>
        {description != null && (
          <p className={"mt-0.5 text-sm text-slate-500 dark:text-slate-400"}>{description}</p>
        )}
      </div>
      {inputs != null && <div className={"grid gap-3 sm:grid-cols-2"}>{inputs}</div>}
      <div className={"flex flex-col gap-2 sm:flex-row sm:flex-wrap"}>{actions}</div>
      {children}
      {shown.map((result) => (
        <ActionResultCard key={result.id} result={result} compact={shown.length === 1} />
      ))}
    </div>
  );
};

export const ActionList = ({ children }: { children: ReactNode }) => (
  <div className={"divide-y divide-slate-200 dark:divide-slate-800"}>{children}</div>
);
