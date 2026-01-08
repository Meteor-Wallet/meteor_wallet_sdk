import { MeteorConnectTest } from "~/pages/meteor-connect-test/MeteorConnectTest.tsx";
import type { Route } from "../../.react-router/types/app/routes/+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Meteor Connect Test" },
    {
      name: "description",
      content: "Page to test the MeteorConnect SDK function",
    },
  ];
}

export default function MeteorConnectRoute() {
  return <MeteorConnectTest />;
}
