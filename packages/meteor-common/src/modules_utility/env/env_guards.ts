export function isOnWeb(): boolean {
  return typeof document !== "undefined";
}

export function isOnMobile(): boolean {
  console.warn("Need to add proper mobile app environment check");
  return false;
}

export function isOnNode(): boolean {
  return typeof process !== "undefined" && process.release.name === "node";
}

export function webOnlyCodeCheck() {
  if (!isOnWeb()) {
    throw new Error("Should only be running on web browser");
  }
}

export function appFrontendOnlyCodeCheck() {
  if (!isOnWeb() && !isOnMobile()) {
    throw new Error("Should only be running on app frontend (mobile or web)");
  }
}

export function nodeOnlyCodeCheck() {
  if (!isOnNode()) {
    throw new Error("Should only be running on Node.js");
  }
}

/*export function backendOnlyCodeCheck() {
  if (!isOnNode() && !isOnNode()) {
    throw new Error(
      "Should only be running on some kind of backend (Node.js or Cloudflare Workers)",
    );
  }
}*/
