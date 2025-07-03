import { IRouteStatus } from "./meteor_router_types";

function defaultRouteStatus(): IRouteStatus {
  return {
    wasAt: false,
    isAt: false,
    isUnder: false,
    isAtOrUnder: false,
    wasAtOrUnder: false,
    wasUnder: false,
  };
}

export const meteor_router_defaults = {
  defaultRouteStatus,
};
