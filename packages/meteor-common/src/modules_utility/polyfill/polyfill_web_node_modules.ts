import { Buffer } from "buffer";

// @ts-ignore
globalThis.Buffer = Buffer;

if (typeof (window as any).global === "undefined") {
  (window as any).global = window;
}
