import type { NavigateFunction } from "react-router-dom";

const UiDirectReferences: {
  navigate: NavigateFunction;
} = {} as any;

function setNavigate(navigate: NavigateFunction) {
  UiDirectReferences.navigate = navigate;
}

function getNavigate(): NavigateFunction {
  return UiDirectReferences.navigate;
}

export const UiDirectReference = {
  setNavigate,
  getNavigate,
};
