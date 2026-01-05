import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("near-connect", "routes/near-connect.tsx"),
] satisfies RouteConfig;
