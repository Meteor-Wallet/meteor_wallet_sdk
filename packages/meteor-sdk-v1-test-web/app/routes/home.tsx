import { MeteorSdkTest } from "~/pages/meteor-sdk-test/MeteorSdkTest.tsx";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Meteor SDK Test " },
    {
      name: "description",
      content: "This is a site to test out the Meteor SDK functionality before release",
    },
  ];
}

export default function Home() {
  return <MeteorSdkTest />;
}
