import { TObjectKeyEnumSet } from "../../../typescript_utils/special_types";
import { ETaskFunctionEndId } from "../TaskFunctionTypes";

const statusCodesForEndId: { [statusCode: string]: ETaskFunctionEndId[] } = {
  // "200": [ETaskFunctionEndId.SUCCESS],
  "400": [ETaskFunctionEndId.ILLEGAL_ARGUMENT],
  "401": [ETaskFunctionEndId.UNAUTHORIZED],
  "403": [ETaskFunctionEndId.FORBIDDEN],
  "404": [ETaskFunctionEndId.NOT_FOUND],
  "409": [ETaskFunctionEndId.CONFLICT_FOUND],
  "501": [ETaskFunctionEndId.NOT_IMPLEMENTED],
  "500": [ETaskFunctionEndId.ERROR],
};

const endIdForStatusCode: { [key in ETaskFunctionEndId]?: string } = {};

for (const [statusCode, endIds] of Object.entries(statusCodesForEndId)) {
  for (const endId of endIds) {
    endIdForStatusCode[endId] = statusCode;
  }
}

// console.log(endIdForStatusCode);

/*const statusCodesForEndId: TObjectKeyEnumSet<ETaskFunctionEndId, number> = {
  SUCCESS: 200,
  ILLEGAL_ARGUMENT: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT_FOUND: 409,
  NOT_IMPLEMENTED: 501,
};*/

export const _getEndIdForHttpStatusCode = (statusCode: string | number): ETaskFunctionEndId => {
  if (Number(statusCode) >= 200 && Number(statusCode) < 300) {
    return ETaskFunctionEndId.SUCCESS;
  }

  const check = statusCodesForEndId[`${statusCode}`];

  if (check && check.length > 0) {
    return check[0];
  }

  return ETaskFunctionEndId.ERROR;
};

export const _getHttpStatusCodeForEndId = (endId: ETaskFunctionEndId): number => {
  switch (endId) {
    case ETaskFunctionEndId.SUCCESS: {
      return 200;
    }
    case ETaskFunctionEndId.ILLEGAL_ARGUMENT: {
      return 400;
    }
    case ETaskFunctionEndId.UNAUTHORIZED: {
      return 401;
    }
    case ETaskFunctionEndId.FORBIDDEN: {
      return 403;
    }
    case ETaskFunctionEndId.NOT_FOUND: {
      return 404;
    }
    case ETaskFunctionEndId.CONFLICT_FOUND: {
      return 409;
    }
    case ETaskFunctionEndId.NOT_IMPLEMENTED: {
      return 501;
    }
    default: {
      return 500;
    }
  }
};

const mapEndIdToMessage: TObjectKeyEnumSet<ETaskFunctionEndId> = {
  [ETaskFunctionEndId.CONFLICT_FOUND]: `A conflict was found`,
  [ETaskFunctionEndId.DATA_VALIDATION_FAILED]: `Data validation failed`,
  [ETaskFunctionEndId.ILLEGAL_ARGUMENT]: `An illegal argument was passed`,
  [ETaskFunctionEndId.NOT_IMPLEMENTED]: `This method is not implemented yet`,
  [ETaskFunctionEndId.ERROR]: `An unknown error occurred`,
  [ETaskFunctionEndId.NOT_FOUND]: `Not found`,
  [ETaskFunctionEndId.FORBIDDEN]: `Operation is forbidden`,
  [ETaskFunctionEndId.UNAUTHORIZED]: `Operation is unauthorized`,
  [ETaskFunctionEndId.EXTERNAL_API_ERROR]: `An external API threw an error`,
  [ETaskFunctionEndId.LIMIT_REACHED]: `Limit has been reached`,
  [ETaskFunctionEndId.SUCCESS]: `Successfully completed`,
  [ETaskFunctionEndId.THROWN_ERROR]: `An error was thrown`,
  [ETaskFunctionEndId.TIMED_OUT]: `Operation timed out`,
  [ETaskFunctionEndId.WARNING]: `Operation ran with warnings`,
  [ETaskFunctionEndId.REDIRECT]: "A redirect is necessary",
};

export const _getDefaultErrorMessageForEndId = (endId: ETaskFunctionEndId): string => {
  const message = mapEndIdToMessage[endId];

  if (message) {
    return message;
  }

  return `No error message was provided`;
};
