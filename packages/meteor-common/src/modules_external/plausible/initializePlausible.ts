import Plausible from "plausible-tracker";

export function initializePlausible() {
  const plausible = Plausible({
    domain: "meteorwallet.app",
  });

  plausible.enableAutoPageviews();
}
