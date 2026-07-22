import { describe, expect, it } from "bun:test";
import { getVisibleActionTargets } from "./action-ui-targets";

const targets = ["v1_ext", "v1_web", "v2_bridge_mobile"] as const;

describe("getVisibleActionTargets", () => {
  it("shows every configured target for untargeted sign-in actions", () => {
    expect(getVisibleActionTargets([...targets])).toEqual([...targets]);
  });

  it("shows only Meteor Mobile for an account bound to the mobile bridge", () => {
    expect(getVisibleActionTargets([...targets], "v2_bridge_mobile")).toEqual(["v2_bridge_mobile"]);
  });

  it("shows only the legacy platform for an account bound to that platform", () => {
    expect(getVisibleActionTargets([...targets], "v1_ext")).toEqual(["v1_ext"]);
  });
});
