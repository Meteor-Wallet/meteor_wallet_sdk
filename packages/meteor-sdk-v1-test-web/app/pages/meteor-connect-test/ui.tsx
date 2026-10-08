import { type ReactNode, useState } from "react";

/**
 * Small UI kit for the Meteor Connect harness. Mobile first: 44px touch targets, 16px inputs (iOS
 * zooms into anything smaller on focus), and everything readable without the console.
 */

export const cx = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(" ");

//
// ICONS
//

const iconProps = {
  "aria-hidden": true,
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeWidth: 2,
  viewBox: "0 0 24 24",
} as const;

export const CheckIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const XIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const AlertIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <path d="M12 8v5M12 16.5v.01" />
    <path d="M10.3 3.9L2.4 17.6A2 2 0 004.1 20.6h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
  </svg>
);

export const BanIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M5.6 5.6l12.8 12.8" />
  </svg>
);

export const ClockIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const CopyIcon = ({ className = "size-3.5" }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 012-2h10" />
  </svg>
);

export const ExternalIcon = ({ className = "size-3.5" }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4" />
  </svg>
);

export const ChevronIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const Spinner = ({ className = "size-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden className={cx("animate-spin", className)}>
    <circle
      cx="12"
      cy="12"
      r="9"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      opacity="0.25"
    />
    <path d="M21 12a9 9 0 00-9-9" fill="none" stroke="currentColor" strokeWidth="3" />
  </svg>
);

//
// BUTTONS
//

type TButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const BUTTON_VARIANTS: Record<TButtonVariant, string> = {
  primary: "bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:bg-blue-800",
  secondary:
    "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 active:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
  danger:
    "border border-red-300 bg-white text-red-700 hover:bg-red-50 active:bg-red-100 dark:border-red-900 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950",
  ghost:
    "text-slate-600 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800",
};

export const ActionButton = ({
  onClick,
  children,
  disabled = false,
  pending = false,
  pendingLabel,
  variant = "primary",
  size = "md",
  fullWidth = false,
  title,
}: {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  /** Shows a spinner and blocks re-entry — a request is already out with the wallet. */
  pending?: boolean;
  pendingLabel?: ReactNode;
  variant?: TButtonVariant;
  size?: "sm" | "md";
  fullWidth?: boolean;
  title?: string;
}) => {
  const inactive = disabled || pending;
  return (
    <button
      type={"button"}
      title={title}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
        size === "sm" ? "min-h-9 px-3 text-sm" : "min-h-11 px-4 text-sm",
        fullWidth && "w-full",
        BUTTON_VARIANTS[variant],
        pending ? "cursor-wait" : disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer",
      )}
      // A real `disabled` attribute AND a guard, never just a grey class — see `~/ui/Button` for the
      // duplicate submission that decorative gating once let through.
      disabled={inactive}
      aria-disabled={inactive}
      aria-busy={pending}
      onClick={() => {
        if (inactive) return;
        onClick();
      }}
    >
      {pending && <Spinner />}
      {pending && pendingLabel != null ? pendingLabel : children}
    </button>
  );
};

//
// LAYOUT
//

export const Section = ({
  id,
  title,
  description,
  aside,
  children,
  className,
}: {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <section
    id={id}
    className={cx(
      "min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900",
      className,
    )}
  >
    <header className={"mb-4 flex items-start justify-between gap-3"}>
      <div className={"min-w-0"}>
        <h2 className={"text-base font-semibold text-slate-900 dark:text-slate-100"}>{title}</h2>
        {description != null && (
          <p className={"mt-1 text-sm text-slate-500 dark:text-slate-400"}>{description}</p>
        )}
      </div>
      {aside}
    </header>
    {children}
  </section>
);

/** A bordered block inside a section — for tools that group several controls. */
export const SubPanel = ({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) => (
  <div
    className={
      "flex min-w-0 flex-col gap-4 rounded-xl border border-slate-200 p-3 sm:p-4 dark:border-slate-800"
    }
  >
    <div className={"min-w-0"}>
      <h3 className={"text-sm font-semibold text-slate-900 dark:text-slate-100"}>{title}</h3>
      {description != null && (
        <p className={"mt-0.5 text-sm text-slate-500 dark:text-slate-400"}>{description}</p>
      )}
    </div>
    {children}
  </div>
);

const readStoredFlag = (key: string, fallback: boolean): boolean => {
  try {
    const stored = window.localStorage.getItem(key);
    return stored == null ? fallback : stored === "1";
  } catch {
    return fallback;
  }
};

/** A section that remembers whether it was left open — handy for tools used every session. */
export const CollapsibleSection = ({
  storageKey,
  title,
  description,
  defaultOpen = false,
  children,
  className,
}: {
  storageKey: string;
  title: ReactNode;
  description?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) => {
  const [open, setOpen] = useState(() =>
    typeof window === "undefined" ? defaultOpen : readStoredFlag(storageKey, defaultOpen),
  );

  return (
    <details
      open={open}
      onToggle={(event) => {
        const next = event.currentTarget.open;
        setOpen(next);
        try {
          window.localStorage.setItem(storageKey, next ? "1" : "0");
        } catch {
          // Private mode or blocked storage — the section just won't remember.
        }
      }}
      className={cx(
        "group min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
        className,
      )}
    >
      <summary
        className={
          "flex cursor-pointer list-none items-start gap-3 p-4 sm:p-5 [&::-webkit-details-marker]:hidden"
        }
      >
        <ChevronIcon
          className={
            "mt-0.5 size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90"
          }
        />
        <div className={"min-w-0"}>
          <h2 className={"text-base font-semibold text-slate-900 dark:text-slate-100"}>{title}</h2>
          {description != null && (
            <p className={"mt-1 text-sm text-slate-500 dark:text-slate-400"}>{description}</p>
          )}
        </div>
      </summary>
      <div className={"flex flex-col gap-4 px-4 pb-4 sm:px-5 sm:pb-5"}>{children}</div>
    </details>
  );
};

//
// FORM CONTROLS
//

const inputClass =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 sm:text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

export const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  hint,
  mono = false,
  disabled = false,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: ReactNode;
  mono?: boolean;
  disabled?: boolean;
  inputMode?: "text" | "decimal";
}) => (
  <label className={"flex min-w-0 flex-col gap-1.5"}>
    <span className={"text-xs font-medium text-slate-600 dark:text-slate-400"}>{label}</span>
    <input
      className={cx(inputClass, mono && "font-mono")}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      inputMode={inputMode}
      autoComplete={"off"}
      autoCapitalize={"off"}
      autoCorrect={"off"}
      spellCheck={false}
      onChange={(event) => onChange(event.target.value)}
    />
    {hint != null && <span className={"text-xs text-slate-500 dark:text-slate-400"}>{hint}</span>}
  </label>
);

export const TextArea = ({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows = 2,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: ReactNode;
  rows?: number;
}) => (
  <label className={"flex min-w-0 flex-col gap-1.5"}>
    <span className={"text-xs font-medium text-slate-600 dark:text-slate-400"}>{label}</span>
    <textarea
      className={cx(inputClass, "py-2 font-mono")}
      value={value}
      placeholder={placeholder}
      rows={rows}
      autoComplete={"off"}
      autoCapitalize={"off"}
      autoCorrect={"off"}
      spellCheck={false}
      onChange={(event) => onChange(event.target.value)}
    />
    {hint}
  </label>
);

export const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <label
    className={
      "inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-slate-700 select-none dark:text-slate-300"
    }
  >
    <input
      type={"checkbox"}
      className={"peer sr-only"}
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
    <span
      aria-hidden
      className={
        "relative h-6 w-10 shrink-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/40 dark:bg-slate-700 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4"
      }
    />
    {label}
  </label>
);

export const SegmentedControl = <T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  ariaLabel: string;
}) => (
  <fieldset
    aria-label={ariaLabel}
    className={"inline-flex min-w-0 shrink-0 rounded-xl bg-slate-100 p-1 dark:bg-slate-800"}
  >
    {options.map((option) => {
      const selected = option.value === value;
      return (
        <button
          key={option.value}
          type={"button"}
          aria-pressed={selected}
          onClick={() => onChange(option.value)}
          className={cx(
            "min-h-9 cursor-pointer rounded-lg px-3 text-sm font-medium transition-colors",
            selected
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
          )}
        >
          {option.label}
        </button>
      );
    })}
  </fieldset>
);

//
// SMALL DISPLAY PIECES
//

export const Chip = ({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "blue" | "green" | "amber" | "red";
}) => (
  <span
    className={cx(
      "inline-flex max-w-full items-center gap-1 truncate rounded-full px-2.5 py-0.5 text-xs font-medium",
      tone === "neutral" && "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      tone === "blue" && "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
      tone === "green" &&
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
      tone === "amber" && "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
      tone === "red" && "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
    )}
  >
    {children}
  </span>
);

export const Notice = ({
  tone,
  children,
}: {
  tone: "info" | "warn" | "danger" | "success";
  children: ReactNode;
}) => (
  <div
    className={cx(
      "rounded-xl border px-3 py-2.5 text-sm",
      tone === "info" &&
        "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-200",
      tone === "warn" &&
        "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
      tone === "danger" &&
        "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200",
      tone === "success" &&
        "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200",
    )}
  >
    {children}
  </div>
);

/** `navigator.clipboard` needs a secure context — a phone hitting the LAN dev server has none. */
export const copyText = async (text: string): Promise<boolean> => {
  try {
    if (window.isSecureContext && navigator.clipboard != null) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path.
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
};

export const CopyButton = ({ text, label = "Copy" }: { text: string; label?: string }) => {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <button
      type={"button"}
      className={
        "inline-flex min-h-8 shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      }
      onClick={async () => {
        setState((await copyText(text)) ? "copied" : "failed");
        setTimeout(() => setState("idle"), 1500);
      }}
    >
      {state === "copied" ? <CheckIcon className={"size-3.5"} /> : <CopyIcon />}
      {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : label}
    </button>
  );
};
