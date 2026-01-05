import { NearConnectTest } from "~/near-connect/NearConnectTest";
import type { Route } from "../../.react-router/types/app/routes/+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Meteor SDK Test " },
    {
      name: "description",
      content: "This is a site to test out the Meteor SDK functionality before release",
    },
  ];
}

export default function NearConnectRoute() {
  return <NearConnectTest />;
}
