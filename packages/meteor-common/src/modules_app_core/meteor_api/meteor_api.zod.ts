import { z } from "zod";

export const zMeteorApiResponse_Error = z.object({
  ok: z.literal(false),
  error: z.any(),
});

export const zMeteorApiResponse_Ok = z.object({
  ok: z.literal(true),
  value: z.any(),
});

export const zMeteorApiResponseAnyError = z.union([
  zMeteorApiResponse_Error,
  zMeteorApiResponse_Ok,
]);
