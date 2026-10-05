/**
 * Which meteor-near-connect executor script the NEAR Connect test page loads, read once from
 * `?executor=` at init — like `?backend=` on the Meteor Connect page, switching is a full
 * navigation, because the connector pins its manifest for the page's lifetime.
 *
 *   ?executor=local          the local `near-connect-build` watch output, served by the dev server
 *                            (dev server default)
 *   ?executor=published      the released executor on GCS — what real dApps load (deployed default)
 *   ?executor=candidate      this deploy's production build of the executor: exactly what releasing
 *                            this commit to GCS would upload
 *   ?executor=candidate-dev  this deploy's development build (debug logging, mobile bridge on the
 *                            development stack, dev-only options)
 *
 * The candidates are built into `build/client/executor/` by `build:executor-candidates`, which
 * `build:dev` / `build:production` (the deploy builds) run after the app build.
 */
export type TExecutorSource = "local" | "published" | "candidate" | "candidate-dev";

interface IExecutorSource {
  label: string;
  url: string;
  /**
   * The wallet manifest version — near-connect's executor cache key (`<wallet id>:<version>`). It
   * runs the cached copy first and only refreshes it in the background, so every source gets its
   * own key: switching sources must never run the other source's cached code.
   */
  manifestVersion: string;
}

export const EXECUTOR_SOURCES: Record<TExecutorSource, IExecutorSource> = {
  local: {
    label: "Local build (watch)",
    url: `http://${process.env.LOCAL_IP || "localhost"}:5173/meteor-near-connect.js`,
    manifestVersion: "1.0.0-local",
  },
  published: {
    label: "Published (live on GCS)",
    url: "https://storage.googleapis.com/meteor-apps-v2/near-connect/executor/latest/meteor-near-connect.js",
    manifestVersion: "1.0.0",
  },
  candidate: {
    label: "Candidate: production build (this deploy)",
    url: "/executor/candidate/meteor-near-connect.js",
    manifestVersion: "1.0.0-candidate",
  },
  "candidate-dev": {
    label: "Candidate: development build (this deploy)",
    url: "/executor/candidate-dev/meteor-near-connect.js",
    manifestVersion: "1.0.0-candidate-dev",
  },
};

/** The dev server serves the local watch build; a deployed build carries its own candidates. */
export const EXECUTOR_SOURCE_OPTIONS: readonly TExecutorSource[] = import.meta.env.DEV
  ? ["local", "published"]
  : ["published", "candidate", "candidate-dev"];

export const resolveExecutorSource = (): TExecutorSource => {
  const fallback = EXECUTOR_SOURCE_OPTIONS[0];
  if (typeof window === "undefined") return fallback;
  const requested = new URLSearchParams(window.location.search).get("executor");
  return EXECUTOR_SOURCE_OPTIONS.find((source) => source === requested) ?? fallback;
};
