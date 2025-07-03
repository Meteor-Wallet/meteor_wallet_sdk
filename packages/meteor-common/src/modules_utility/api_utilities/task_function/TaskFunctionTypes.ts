export enum ETaskType {
  PARENT = "PARENT",
  CHILD = "CHILD",
}

export enum ETaskFunctionType {
  NORMAL = "NORMAL",
  OBSERVABLE = "OBSERVABLE",
}

export interface IOGetTasks {
  tags?: string[] | null;
  taskType?: ETaskType | null;
  excludeTags?: string[] | null;
}

export interface ITaskTiming {
  endDelayMillis: number;
}

export interface IParentTaskDefinition {
  subTaskIds?: string[];
  subTaskTimings?: { [taskId: string]: ITaskTiming };
  subTaskResponseToOptionLinking?: {
    [taskId: string]: {
      [option: string]: string[]; // PATH in _.get(payload, PATH)
    };
  };
}

export interface ITaskFunctionCreationOptions extends ITaskFunctionOptions {
  addToRegister?: boolean;
}

export interface ITaskFunctionOptions {
  skipInputValidation?: boolean;
  skipOutputValidation?: boolean;
  hideObserverMissingWarnings?: boolean;
}

// export interface ITaskFunctionOnRunOptions {
//   hideObserverMissingWarnings?: boolean;
// }

export interface ITaskResponseMapping {
  [prop: string]: string[];
}

export interface ITaskRunRequest {
  taskId: string;
  runningTaskUid: string;
  taskOptions: { [taskId: string]: any };
}

export interface IRunningTask {
  id: string;
  taskId: string;
  subTaskNames: string[];
}

export enum ERunningTaskStatus {
  RUNNING = "RUNNING",
  FINISHED = "FINISHED",
  TIMED_OUT = "TIMED_OUT",
  CRASHED = "CRASHED",
}

export interface IHistoricalRunningTask extends IRunningTask {
  taskProgressCollection: ITaskProgress[];
  taskResponseCollection: {
    [taskId: string]: any;
  };
  status: ERunningTaskStatus;
}

export enum ETaskFeedbackType {
  PERCENT = "PERCENT",
  UNQUANTIFIABLE = "UNQUANTIFIABLE",
  FRACTION = "FRACTION",
}

export enum ETaskStatus {
  OKAY = "OKAY",
  WARNING = "WARNING",
  ERROR = "ERROR",
  CRASH = "CRASH",
}

export enum ETaskProgressAction {
  DELAY = "DELAY",
  START = "START",
  BUSY = "BUSY",
  END = "END",
}

export interface IFractionFeedback {
  unit: string;
  limit: number;
  current: number;
}

export interface ITaskProgressUpdate {
  feedbackType?: ETaskFeedbackType;
  feedbackValue?: number;
  feedbackValueLimit?: number;
  feedbackUnit?: string;
  message?: string;
  status?: ETaskStatus;
  action?: ETaskProgressAction;
  tfe?: ITaskFunctionNegativeResponse<any>;
}

export interface ITaskProgressUpdateMeta {
  feedbackPercent: number;
  feedbackValueString: string;
}

export interface ITaskProgress extends ITaskProgressUpdate, ITaskProgressUpdateMeta {
  id: string;
  taskId: string;
  runningTaskUid: string;
  progressIndex: number;
  totalSubTasks: number;
  currentSubTaskIndex: number;
  timestamp?: number;
}

export enum ETaskFunctionEndId {
  SUCCESS = "SUCCESS",

  ERROR = "ERROR",
  THROWN_ERROR = "THROWN_ERROR",
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
  WARNING = "WARNING",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT_FOUND = "CONFLICT_FOUND",
  NOT_IMPLEMENTED = "NOT_IMPLEMENTED",
  TIMED_OUT = "TIMED_OUT",
  ILLEGAL_ARGUMENT = "ILLEGAL_ARGUMENT",
  LIMIT_REACHED = "LIMIT_REACTED",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  DATA_VALIDATION_FAILED = "DATA_VALIDATION_FAILED",
  REDIRECT = "REDIRECT",
}

export enum EInternalTaskIds {
  util_run_task_function_on_object = "util_run_task_function_on_object",
}

export enum EEndLabelSeverity {
  error = 0,
  warning = 1,
  info = 2,
}

export interface ITaskFunctionEndLabel<TAG extends string = string> {
  /** The overall type of this label */
  tag: TAG;
  /** Severity */
  sev: EEndLabelSeverity;
  /** If applicable, specific identifiers */
  keys?: string[];
  /** Internal text message describing this specific reason for the tag */
  text?: string;
}

export interface ITaskFunctionResponseBase<ET> {
  endId: ETaskFunctionEndId;
  endMessage?: string;
  endTags: ET[];
  labels?: ITaskFunctionEndLabel[];
  taskId?: string | null;
  uid?: string;
}

export interface ITaskFunctionNegativeResponse<TE, ET extends string = string>
  extends ITaskFunctionResponseBase<ET> {
  positive: false;
  errorPayload: TE;
  payload: null;
  endMessage: string;
}

export interface ITaskFunctionPositiveResponse<TP, ET extends string = string>
  extends ITaskFunctionResponseBase<ET> {
  positive: true;
  errorPayload: null;
  payload: TP;
}

export type ITaskFunctionResponse<TP = any, TE = any, ET extends string = string> =
  | ITaskFunctionNegativeResponse<TE, ET>
  | ITaskFunctionPositiveResponse<TP, ET>;

export type TFRPromise<TP = any, TE = any, ET extends string = string> = Promise<
  ITaskFunctionResponse<TP, TE, ET>
>;

export type TObjectOfTaskFunctions<T extends string = any> = {
  [prop in T]?: (...args: any[]) => Promise<ITaskFunctionResponse>;
};
