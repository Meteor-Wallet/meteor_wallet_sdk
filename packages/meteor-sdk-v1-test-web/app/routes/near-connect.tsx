import { NearConnectTest } from "~/pages/near-connect/NearConnectTest";
import type { Route } from "./+types/near-connect";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "NEAR Connect Meteor Wallet SDK" },
    {
      name: "description",
      content: "This is a site to test out the Meteor SDK functionality before release",
    },
  ];
}

export default function NearConnectRoute() {
  return <NearConnectTest />;
}
