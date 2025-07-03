/**
 * Driver is an interface to deal with the difference of the platforms
 * such as browser and extension.
 */ import { EAppPlatformType } from "../app_platform_types";

export interface IBaseDriver {
  types: EAppPlatformType[];

  initialize(): Promise<void>;
}
