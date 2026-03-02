import { parseNearAmount } from "@near-js/utils";

const defaultFunctionCallKeyGas = "0.25";

export function printThings() {
  console.log("Default function call key gas:", defaultFunctionCallKeyGas);
  console.log(
    `Yocto NEAR in human-readable format: ${parseNearAmount("0.")} NEAR`,
  );
}

if (require.main === module) {
  printThings();
}
