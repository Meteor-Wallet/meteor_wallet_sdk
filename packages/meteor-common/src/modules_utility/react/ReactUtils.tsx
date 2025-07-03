import React, { Fragment } from "react";

export function doHere(doAndReturnEle: () => any) {
  return doAndReturnEle();
}

type TFirstTrueInput = [boolean, React.ReactElement] | React.ReactElement;

export function firstTrue(inputs: TFirstTrueInput[]): React.ReactElement {
  for (const input of inputs) {
    if (Array.isArray(input)) {
      if (input[0]) {
        return input[1];
      }
    } else {
      return input;
    }
  }

  return <Fragment />;
}
