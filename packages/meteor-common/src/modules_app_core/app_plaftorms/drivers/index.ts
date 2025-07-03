import { IBaseDriver } from "./base";
import { ChromeDriver } from "./chrome";
import { WebDriver } from "./web";

export enum EDriverPlatform {
  ext_chrome = "ext_chrome",
  web = "web",
  unknown = "unknown",
}

const platform: "web" | "ext" | undefined = import.meta.env.VITE_DRIVER_PLATFORM as
  | "web"
  | "ext"
  | undefined;

export const getCurrentPlatform = (): EDriverPlatform => {
  if (platform === "ext") {
    return EDriverPlatform.ext_chrome;
  }

  if (platform === "web") {
    return EDriverPlatform.web;
  }

  return EDriverPlatform.unknown;
};

/** is extension platform */
export function isExtPlatform() {
  return [EDriverPlatform.ext_chrome].includes(getCurrentPlatform());
}

let driver: IBaseDriver;

const createDriver = (type: EDriverPlatform) => {
  switch (type) {
    case EDriverPlatform.ext_chrome: {
      // console.log("Using Chrome Driver");
      return new ChromeDriver();
    }
    case EDriverPlatform.web: {
      // console.log("Using Web Driver");
      return new WebDriver();
    }
    default:
      throw new Error(`Cannot find driver for the type "${type}"`);
  }
};

// driver factory with cache
export function getDriver(): IBaseDriver {
  // console.log(`Getting driver: ${getCurrentPlatform()}`);

  if (!driver) {
    driver = createDriver(getCurrentPlatform());
  }
  return driver;
}
