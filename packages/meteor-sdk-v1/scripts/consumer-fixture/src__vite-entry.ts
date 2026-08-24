import { METEOR_CONNECT_BACKENDS, MeteorConnect } from "@meteorwallet/sdk";

// Reference both a value and a class so the bundler cannot tree-shake the package away and
// declare success without ever resolving its imports.
export function bootstrap(): string {
  return `${MeteorConnect.name}:${METEOR_CONNECT_BACKENDS.production}`;
}

if (typeof document !== "undefined") {
  const el = document.getElementById("app");
  if (el != null) {
    el.textContent = bootstrap();
  }
}
