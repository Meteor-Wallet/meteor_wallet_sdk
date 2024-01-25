import { JsonUtils } from "./json.utils";

test("JsonUtils.isJSON", () => {
  expect(JsonUtils.isJSON('{"key":"string"}')).toBeTruthy();
  expect(JsonUtils.isJSON('[{"key":"string"},{"key":123}]')).toBeTruthy();
  expect(JsonUtils.isJSON('{"key":[{"key":"string"},{"key": 123}]}')).toBeTruthy();

  expect(JsonUtils.isJSON("")).toBeFalsy();
  expect(JsonUtils.isJSON("-")).toBeFalsy();
  expect(JsonUtils.isJSON("{key: string}")).toBeFalsy();
});
