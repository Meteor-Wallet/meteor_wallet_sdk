import { Route } from "./Route";
import { ERoutePathPartType } from "./meteor_router_types";

function prettyPrintRoute(route: Route<any, any>): string {
  return `/${route.pathParts
    .slice(1)
    .map((part) => (part.type === ERoutePathPartType.text ? part.text : `:${part.prop}`))
    .join("/")} [${route.id}]`;
}

export const meteor_router_utils = {
  prettyPrintRoute,
};
