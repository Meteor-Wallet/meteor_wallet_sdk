import { TErrorId } from "./MeteorErrorIds.ts";
import { MeteorError } from "./MeteorError.ts";

export interface IMeteorErrorMetadata {
  name: string;
  description: string;
}

export type TMeteorErrorMetadataReference<E extends string> = {
  [key in E]: {};
};

export type TBooleanResultWithError<E extends string = TErrorId> =
  | {
      good: true;
      error?: undefined;
    }
  | {
      good: false;
      error: MeteorError<E>;
    };
