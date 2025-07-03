import { EErrorId_MeteorApi } from "@meteorwallet/core-sdk/errors/ids/MeteorErrorIds";
import { MeteorError, meteor_error_utils } from "@meteorwallet/errors";
import { TMeteorApiResponse } from "./meteor_api.types";
import { zMeteorApiResponseAnyError } from "./meteor_api.zod";

export const apiOkValueOrThrowMeteorError = <T>(apiResponse: TMeteorApiResponse<T>): T => {
  const structureValidate = zMeteorApiResponseAnyError.safeParse(apiResponse);

  if (!structureValidate.success) {
    throw MeteorError.fromId(
      EErrorId_MeteorApi.meteor_api_response_invalid_structure,
      apiResponse,
    ).withMessage("Invalid response structure from Meteor API");
  }

  if (apiResponse.ok) {
    return apiResponse.value;
  }

  if (
    apiResponse.error.message === undefined &&
    apiResponse.error.context?.unhandled_error?.message
  ) {
    // quick workaround to show unhandled error message properly in frontend
    // this bug only happens with prod backend
    // live-dev backend, local backend is not affected...
    apiResponse.error.message = apiResponse.error.context.unhandled_error.message;
  }

  const validMeteorError = MeteorError.castOrNull(apiResponse.error);

  apiResponse.error.context["requestId"] = apiResponse.requestId;

  if (validMeteorError == null) {
    throw meteor_error_utils.meteorOrUnknownError(apiResponse.error);
  }

  throw validMeteorError;
};
