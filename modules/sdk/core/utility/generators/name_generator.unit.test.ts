import { generateRandomAccountName } from "./name_generator";

describe("name_generator generateAccountName", () => {
  it("should generate random name", () => {
    const name = generateRandomAccountName({ seed: 12022 });
    const possibleName = ["regulatorybandicoot", "pinkbandicoot"];
    expect(possibleName).toContain(name);
  });
});
