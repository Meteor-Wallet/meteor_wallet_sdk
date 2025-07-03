import { z } from "zod";
import { TFRSuccessPayload } from "../../task_function/TaskFunctionResponses";
import { ApiAction_RandomColors } from "./ApiAction_RandomColors";

const colors: string[] = ["red", "green", "blue"];

ApiAction_RandomColors.setValidation(
  z.object({
    num: z.number().int(),
  }),
);

ApiAction_RandomColors.implement(async ({ num }, { plugins: {} }) => {
  return TFRSuccessPayload({ color: colors[Math.abs(Math.floor(num % 3))] });
});

export const ApiAction_RandomColors_Impl = ApiAction_RandomColors;
