import { smallGreyText } from "../../ui/tailwind-vars";
import { EXECUTOR_SOURCE_OPTIONS, EXECUTOR_SOURCES, type TExecutorSource } from "./executor-source";

interface IPropsExecutorSelector {
  executorSource: TExecutorSource;
}

/** The connector pins its manifest per page load, so a change navigates with `?executor=`. */
export const ExecutorSelector = ({ executorSource }: IPropsExecutorSelector) => {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`${smallGreyText} mr-5`}>Executor script</span>
      <select
        value={executorSource}
        className="border border-gray-700 rounded p-1"
        onChange={(e) => {
          const url = new URL(window.location.href);
          url.searchParams.set("executor", e.target.value);
          window.location.assign(url);
        }}
      >
        {EXECUTOR_SOURCE_OPTIONS.map((source) => (
          <option key={source} className={"bg-sky-950 text-white"} value={source}>
            {EXECUTOR_SOURCES[source].label}
          </option>
        ))}
      </select>
      <span className={`${smallGreyText} break-all`}>{EXECUTOR_SOURCES[executorSource].url}</span>
    </div>
  );
};
