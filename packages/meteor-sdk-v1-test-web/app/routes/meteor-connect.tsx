import { MeteorConnectTest } from "~/pages/meteor-connect-test/MeteorConnectTest";
import type { Route } from "./+types/meteor-connect";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Meteor Connect SDK Test" },
    {
      name: "description",
      content: "Page to test the MeteorConnect SDK function",
    },
  ];
}

export default function MeteorConnectRoute() {
  return <MeteorConnectTest />;
}
