import { EErrorId_Security, TErrorId } from "./MeteorErrorIds";
import { IErrorIdWithContextData, meteorErrorContextCheck } from "./MeteorErrorContext";
import { StringUtils } from "../utility/javascript_datatype_utils/string.utils.ts";

export class MeteorError<E extends string = TErrorId> extends Error {
  isUnknownError: boolean = false;
  private errorIds: (EErrorId_Security | string)[] = [];
  private context: Partial<IErrorIdWithContextData> = {};

  get hasMultiple(): boolean {
    return this.errorIds.length > 1;
  }

  getIds(): E[] {
    return this.errorIds as E[];
  }

  getContextForId<K extends keyof IErrorIdWithContextData>(id: K): IErrorIdWithContextData[K] {
    if (this.context[id] == null) {
      throw new MeteorInternalError(
        `MeteorError: Error ID "${id}" context was never set. Use MeteorError.withContext() when creating the Error, or use MeteorError.fromId(id, context)`,
      );
    }

    return this.context[id];
  }

  constructor(message: string, ids: TErrorId[], context?: Partial<IErrorIdWithContextData>) {
    super(message ?? "");
    this.errorIds = ids;
    this.context = context ?? {};
    if (StringUtils.nullEmpty(this.message)) {
      this.message = `error_ids[${this.errorIds.join(", ")}]`;
    } else {
      this.message = `${this.message} error_ids[${this.errorIds.join(", ")}]`;
    }
  }

  static fromError(error: Error) {
    return new MeteorError(error.message, []);
  }

  static withContext(errorContext: Partial<IErrorIdWithContextData>) {
    const errorIds = Object.keys(errorContext) as TErrorId[];
    return new MeteorError("", errorIds, errorContext);
  }

  static fromId<K extends TErrorId>(
    errorId: K,
    context?: K extends keyof IErrorIdWithContextData ? IErrorIdWithContextData[K] : never,
  ): MeteorError<K> {
    if (meteorErrorContextCheck[errorId as keyof IErrorIdWithContextData] && context == null) {
      throw new MeteorInternalError(
        `MeteorError: Error ID "${errorId}" requires context data. Provide context as second argument, or use MeteorError.withContext()`,
      );
    }

    return new MeteorError("", [errorId], {
      [errorId]: context,
    });
  }

  static fromIds<K extends TErrorId>(
    errorIds: K[],
    context?: Partial<IErrorIdWithContextData>,
  ): MeteorError<K> {
    for (const errorId of errorIds) {
      const badIds: string[] = [];

      if (
        meteorErrorContextCheck[errorId as keyof IErrorIdWithContextData] &&
        context?.[errorId as keyof IErrorIdWithContextData] == null
      ) {
        badIds.push(errorId);
      }

      if (badIds.length > 0) {
        throw new MeteorInternalError(
          `MeteorError: Error IDs "${badIds.join(
            ", ",
          )}" require context data. Provider context as second argument or use MeteorError.withContext()`,
        );
      }
    }

    return new MeteorError("", errorIds);
  }

  public has(errorId: E | string): boolean {
    return this.errorIds.includes(errorId);
  }
}

export class MeteorInternalError extends Error {}
