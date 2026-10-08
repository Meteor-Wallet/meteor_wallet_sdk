import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertIcon,
  BanIcon,
  CheckIcon,
  ClockIcon,
  CopyButton,
  cx,
  ExternalIcon,
  Spinner,
  XIcon,
} from "../ui";
import {
  describeActionError,
  formatClock,
  formatDuration,
  type IActionResult,
  type IActionResultField,
  type IActionResultSummary,
  loadStoredResults,
  MAX_STORED_RESULTS,
  storeResults,
  type TActionResultStatus,
  type TNearNetwork,
  toDisplayJson,
  truncateMiddle,
} from "./resultsModel";

//
// RUNNER + STORE
//

export interface IRunActionRequest<T> {
  /** Stable per control — its latest run is what that control shows inline. */
  key: string;
  label: string;
  actionId?: string;
  accountId?: string;
  network?: TNearNetwork;
  execute: () => Promise<T>;
  summarize?: (output: T) => IActionResultSummary | Promise<IActionResultSummary>;
}

export type TRunOutcome<T> = { ok: true; output: T } | { ok: false; error: unknown };

interface IActionResultsContext {
  results: IActionResult[];
  /** Never throws: every outcome, good or bad, lands in the log instead of an unhandled rejection. */
  run: <T>(request: IRunActionRequest<T>) => Promise<TRunOutcome<T>>;
  remove: (id: string) => void;
  clear: () => void;
  toastId?: string;
  dismissToast: () => void;
}

const ActionResultsContext = createContext<IActionResultsContext | null>(null);

const createResultId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const ActionResultsProvider = ({ children }: { children: ReactNode }) => {
  const [results, setResults] = useState<IActionResult[]>([]);
  const [toastId, setToastId] = useState<string>();
  const [loaded, setLoaded] = useState(false);

  // Loaded after mount, not in the initializer — the SPA shell is prerendered without storage.
  // Merged by id, because StrictMode runs this twice in development.
  useEffect(() => {
    const stored = loadStoredResults();
    setResults((current) => {
      const known = new Set(current.map((result) => result.id));
      return [...current, ...stored.filter((result) => !known.has(result.id))].slice(
        0,
        MAX_STORED_RESULTS,
      );
    });
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) storeResults(results);
  }, [loaded, results]);

  const patch = useCallback((id: string, update: Partial<IActionResult>) => {
    setResults((current) =>
      current.map((result) => (result.id === id ? { ...result, ...update } : result)),
    );
  }, []);

  const run = useCallback(
    async <T,>(request: IRunActionRequest<T>): Promise<TRunOutcome<T>> => {
      const id = createResultId();
      const startedAt = Date.now();
      setResults((current) =>
        [
          {
            id,
            key: request.key,
            label: request.label,
            actionId: request.actionId,
            accountId: request.accountId,
            network: request.network,
            status: "pending" as const,
            startedAt,
            fields: [],
          },
          ...current,
        ].slice(0, MAX_STORED_RESULTS),
      );
      console.log(`[${request.label}] requested`, request.actionId ?? "");

      let output: T;
      try {
        output = await request.execute();
      } catch (error) {
        const described = describeActionError(error);
        console.error(`[${request.label}] ${described.status}:`, error);
        patch(id, {
          status: described.status,
          endedAt: Date.now(),
          headline: described.headline,
          errorMessage: described.message,
          errorCode: described.code,
          raw: toDisplayJson(error),
        });
        setToastId(id);
        return { ok: false, error };
      }

      // A summarizer bug must not turn a successful wallet request into a reported failure.
      let summary: IActionResultSummary;
      try {
        summary = (await request.summarize?.(output)) ?? { headline: "Completed" };
      } catch (summaryError) {
        summary = {
          status: "warning",
          headline: "Completed, but the output could not be summarized",
          fields: [{ label: "Summary error", value: String(summaryError) }],
        };
      }
      console.log(`[${request.label}] ${summary.status ?? "success"}: ${summary.headline}`, output);
      patch(id, {
        status: summary.status ?? "success",
        endedAt: Date.now(),
        headline: summary.headline,
        fields: summary.fields ?? [],
        raw: toDisplayJson(output),
      });
      setToastId(id);
      return { ok: true, output };
    },
    [patch],
  );

  // Stable, so the toast's auto-dismiss timer isn't restarted by every unrelated log update.
  const dismissToast = useCallback(() => setToastId(undefined), []);

  const value = useMemo<IActionResultsContext>(
    () => ({
      results,
      run,
      remove: (id) => setResults((current) => current.filter((result) => result.id !== id)),
      // Pending requests stay: their promise is still out and will land back here.
      clear: () => setResults((current) => current.filter((result) => result.status === "pending")),
      toastId,
      dismissToast,
    }),
    [results, run, toastId, dismissToast],
  );

  return <ActionResultsContext.Provider value={value}>{children}</ActionResultsContext.Provider>;
};

export const useActionResults = (): IActionResultsContext => {
  const context = useContext(ActionResultsContext);
  if (context == null) throw new Error("useActionResults needs an <ActionResultsProvider>");
  return context;
};

/** The newest run of one control, plus whether a request from it is still out. */
export const useLatestActionResult = (
  key: string,
): { latest?: IActionResult; pending: boolean } => {
  const { results } = useActionResults();
  const latest = results.find((result) => result.key === key);
  return { latest, pending: latest?.status === "pending" };
};

//
// STATUS DISPLAY
//

const STATUS_META: Record<
  TActionResultStatus,
  { label: string; badge: string; accent: string; icon: (className: string) => ReactNode }
> = {
  pending: {
    label: "Waiting",
    badge:
      "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900",
    accent: "border-l-blue-500",
    icon: (className) => <Spinner className={className} />,
  },
  success: {
    label: "Success",
    badge:
      "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900",
    accent: "border-l-emerald-500",
    icon: (className) => <CheckIcon className={className} />,
  },
  warning: {
    label: "Check",
    badge:
      "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900",
    accent: "border-l-amber-500",
    icon: (className) => <AlertIcon className={className} />,
  },
  cancelled: {
    label: "Cancelled",
    badge:
      "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
    accent: "border-l-slate-400",
    icon: (className) => <BanIcon className={className} />,
  },
  failed: {
    label: "Failed",
    badge:
      "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900",
    accent: "border-l-red-500",
    icon: (className) => <XIcon className={className} />,
  },
  interrupted: {
    label: "Interrupted",
    badge:
      "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
    accent: "border-l-slate-400",
    icon: (className) => <ClockIcon className={className} />,
  },
};

export const StatusBadge = ({ status }: { status: TActionResultStatus }) => {
  const meta = STATUS_META[status];
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
        meta.badge,
      )}
    >
      {meta.icon("size-3.5")}
      {meta.label}
    </span>
  );
};

/** Re-renders every second while something is pending, so the wait reads as alive. */
const useNow = (active: boolean): number => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);
  return now;
};

const elapsedOf = (result: IActionResult, now: number): string | undefined => {
  if (result.endedAt != null) return formatDuration(result.endedAt - result.startedAt);
  if (result.status === "pending") return formatDuration(now - result.startedAt);
  return undefined;
};

const FIELD_TONE: Record<NonNullable<IActionResultField["tone"]>, string> = {
  good: "text-emerald-700 dark:text-emerald-400",
  bad: "text-red-700 dark:text-red-400",
  warn: "text-amber-700 dark:text-amber-400",
};

const ResultField = ({ field }: { field: IActionResultField }) => {
  // Hashes, keys and account ids: no spaces. Those get monospace and, when long, a middle cut
  // (copy and the raw response still carry the full value). Prose just wraps.
  const identifierLike = !/\s/.test(field.value);
  const long = identifierLike && field.value.length > 34;
  return (
    // Label beside value only when the CARD is wide enough — the same card renders full-width
    // inline and squeezed in the log column, so the viewport width says nothing useful here.
    <div className={"flex min-w-0 flex-col gap-0.5 py-1.5 @md:flex-row @md:items-center @md:gap-3"}>
      <dt className={"shrink-0 text-xs text-slate-500 @md:w-40 dark:text-slate-400"}>
        {field.label}
      </dt>
      <dd className={"flex min-w-0 flex-1 items-center gap-1"}>
        {field.href != null ? (
          <a
            href={field.href}
            target={"_blank"}
            rel={"noreferrer"}
            title={field.value}
            className={cx(
              "inline-flex min-w-0 items-center gap-1 font-mono text-xs underline decoration-dotted underline-offset-2 hover:decoration-solid",
              field.tone != null ? FIELD_TONE[field.tone] : "text-blue-700 dark:text-blue-400",
            )}
          >
            <span className={"truncate"}>
              {long ? truncateMiddle(field.value, 14) : field.value}
            </span>
            <ExternalIcon className={"size-3 shrink-0"} />
          </a>
        ) : (
          <span
            title={field.value}
            className={cx(
              "min-w-0 text-xs break-words",
              identifierLike && "font-mono",
              field.tone != null
                ? cx("font-medium", FIELD_TONE[field.tone])
                : "text-slate-800 dark:text-slate-200",
            )}
          >
            {long ? truncateMiddle(field.value, 14) : field.value}
          </span>
        )}
        {field.copyable !== false && <CopyButton text={field.value} label={""} />}
      </dd>
    </div>
  );
};

const PendingHint = () => (
  <p className={"text-sm text-slate-600 dark:text-slate-300"}>
    Waiting for the wallet — approve or reject the request there. This updates on its own when the
    answer arrives.
  </p>
);

export const ActionResultCard = ({
  result,
  onRemove,
  compact = false,
  defaultExpanded = true,
}: {
  result: IActionResult;
  onRemove?: () => void;
  /** Inline under a control: the control already names the action, so the label is dropped. */
  compact?: boolean;
  /** Collapsed cards keep the verdict and error visible and fold the fields away. */
  defaultExpanded?: boolean;
}) => {
  const now = useNow(result.status === "pending");
  const elapsed = elapsedOf(result, now);
  const meta = STATUS_META[result.status];
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasDetails = result.fields.length > 0 || result.raw != null;

  return (
    <article
      // Only the log copy is a scroll target — the inline copy of the same result would collide.
      id={compact ? undefined : `action-result-${result.id}`}
      aria-live={"polite"}
      className={cx(
        "@container min-w-0 scroll-mt-4 rounded-xl border border-l-4 border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/40",
        meta.accent,
      )}
    >
      <header className={"flex flex-wrap items-center gap-x-2 gap-y-1"}>
        <StatusBadge status={result.status} />
        {!compact && (
          <span
            className={"min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-slate-100"}
          >
            {result.label}
          </span>
        )}
        <span
          className={
            "ml-auto flex items-center gap-2 text-xs text-slate-500 tabular-nums dark:text-slate-400"
          }
        >
          {elapsed != null && (
            <>
              <span>{elapsed}</span>
              <span aria-hidden>·</span>
            </>
          )}
          <span>{formatClock(result.startedAt)}</span>
          {onRemove != null && result.status !== "pending" && (
            <button
              type={"button"}
              aria-label={"Remove result"}
              onClick={onRemove}
              className={
                "-mr-1 cursor-pointer rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              }
            >
              <XIcon className={"size-3.5"} />
            </button>
          )}
        </span>
      </header>

      <div className={"mt-2 flex flex-col gap-2"}>
        {result.status === "pending" ? (
          <PendingHint />
        ) : (
          result.headline != null && (
            <p className={"text-sm font-medium text-slate-900 dark:text-slate-100"}>
              {result.headline}
            </p>
          )
        )}

        {(result.accountId != null || result.actionId != null) && !compact && (
          <p className={"text-xs text-slate-500 dark:text-slate-400"}>
            {[result.actionId, result.accountId, result.network].filter(Boolean).join(" · ")}
          </p>
        )}

        {result.errorMessage != null && (
          <div
            className={cx(
              "flex items-start gap-2 rounded-lg px-2.5 py-2 font-mono text-xs break-words",
              result.status === "failed"
                ? "bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-200"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
            )}
          >
            <span className={"min-w-0 flex-1"}>
              {result.errorCode != null && result.errorCode !== result.errorMessage
                ? `${result.errorCode}: ${result.errorMessage}`
                : result.errorMessage}
            </span>
            <CopyButton text={result.errorMessage} label={""} />
          </div>
        )}

        {hasDetails && !expanded && (
          <button
            type={"button"}
            onClick={() => setExpanded(true)}
            className={
              "inline-flex min-h-8 cursor-pointer items-center self-start text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }
          >
            Show details{result.fields.length > 0 ? ` (${result.fields.length})` : ""}
          </button>
        )}

        {expanded && result.fields.length > 0 && (
          <dl className={"divide-y divide-slate-200/70 dark:divide-slate-800"}>
            {result.fields.map((field, index) => (
              <ResultField key={`${field.label}-${index}`} field={field} />
            ))}
          </dl>
        )}

        {expanded && result.raw != null && (
          <details className={"group"}>
            <summary
              className={
                "inline-flex min-h-8 cursor-pointer list-none items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 [&::-webkit-details-marker]:hidden"
              }
            >
              <span className={"group-open:hidden"}>Show raw response</span>
              <span className={"hidden group-open:inline"}>Hide raw response</span>
            </summary>
            <div className={"relative mt-1"}>
              <pre
                className={
                  "max-h-72 overflow-auto rounded-lg bg-slate-900 p-3 pr-16 font-mono text-[11px] leading-relaxed text-slate-100 dark:bg-black"
                }
              >
                {result.raw}
              </pre>
              <div className={"absolute top-1.5 right-1.5 rounded-lg bg-slate-800 text-slate-200"}>
                <CopyButton text={result.raw} />
              </div>
            </div>
          </details>
        )}
      </div>
    </article>
  );
};

//
// LOG PANEL
//

type TFilter = "all" | "problems";

const TALLY_ORDER: TActionResultStatus[] = [
  "pending",
  "success",
  "warning",
  "failed",
  "cancelled",
  "interrupted",
];

export const ActionResultsPanel = ({ className }: { className?: string }) => {
  const { results, remove, clear } = useActionResults();
  const [filter, setFilter] = useState<TFilter>("all");

  const tally = useMemo(() => {
    const counts = new Map<TActionResultStatus, number>();
    for (const result of results) counts.set(result.status, (counts.get(result.status) ?? 0) + 1);
    return TALLY_ORDER.filter((status) => counts.has(status))
      .map((status) => `${counts.get(status)} ${STATUS_META[status].label.toLowerCase()}`)
      .join(" · ");
  }, [results]);

  const visible =
    filter === "problems"
      ? results.filter((result) => result.status !== "success" && result.status !== "pending")
      : results;

  return (
    <section
      id={"action-results"}
      aria-label={"Request results"}
      className={cx(
        "flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
        className,
      )}
    >
      <header
        className={
          "flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-200 p-4 dark:border-slate-800"
        }
      >
        <div className={"min-w-0 flex-1"}>
          <h2 className={"text-base font-semibold text-slate-900 dark:text-slate-100"}>Results</h2>
          <p className={"text-xs text-slate-500 tabular-nums dark:text-slate-400"}>
            {results.length === 0 ? "Every request and its outcome lands here" : tally}
          </p>
        </div>
        {results.length > 0 && (
          <div className={"flex items-center gap-1"}>
            <button
              type={"button"}
              onClick={() => setFilter(filter === "all" ? "problems" : "all")}
              className={cx(
                "min-h-8 cursor-pointer rounded-lg px-2.5 text-xs font-medium",
                filter === "problems"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
              )}
            >
              Not ok only
            </button>
            <button
              type={"button"}
              onClick={clear}
              className={
                "min-h-8 cursor-pointer rounded-lg px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }
            >
              Clear
            </button>
          </div>
        )}
      </header>

      <div className={"flex min-h-0 flex-col gap-2 overflow-auto p-3"}>
        {visible.length === 0 ? (
          <p className={"px-1 py-6 text-center text-sm text-slate-500 dark:text-slate-400"}>
            {results.length === 0
              ? "No requests yet. Results stay here across reloads."
              : "Nothing failed or was cancelled."}
          </p>
        ) : (
          // Newest (and anything still waiting) open; older entries folded to their verdict so the
          // log stays scannable on a phone.
          visible.map((result, index) => (
            <ActionResultCard
              key={result.id}
              result={result}
              onRemove={() => remove(result.id)}
              defaultExpanded={index === 0 || result.status === "pending"}
            />
          ))
        )}
      </div>
    </section>
  );
};

//
// TOAST
//

const TOAST_MS = 6000;

/**
 * A glanceable verdict for the request that just settled, wherever the page is scrolled to.
 * Tapping it jumps to the full result in the log.
 */
export const ResultToast = () => {
  const { results, toastId, dismissToast } = useActionResults();
  const result = toastId != null ? results.find((entry) => entry.id === toastId) : undefined;

  useEffect(() => {
    if (toastId == null) return;
    const timer = window.setTimeout(dismissToast, TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toastId, dismissToast]);

  if (result == null || result.status === "pending") return null;
  const meta = STATUS_META[result.status];

  return (
    <div
      aria-live={"polite"}
      className={
        "pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      }
    >
      <div
        className={cx(
          "pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-l-4 border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95",
          meta.accent,
        )}
      >
        <button
          type={"button"}
          className={"flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"}
          onClick={() => {
            document
              .getElementById(`action-result-${result.id}`)
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
            dismissToast();
          }}
        >
          <StatusBadge status={result.status} />
          <span className={"min-w-0 flex-1"}>
            <span
              className={"block truncate text-sm font-semibold text-slate-900 dark:text-slate-100"}
            >
              {result.label}
            </span>
            <span className={"block truncate text-xs text-slate-600 dark:text-slate-300"}>
              {result.headline}
            </span>
          </span>
        </button>
        <button
          type={"button"}
          aria-label={"Dismiss"}
          onClick={dismissToast}
          className={
            "shrink-0 cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          }
        >
          <XIcon />
        </button>
      </div>
    </div>
  );
};
