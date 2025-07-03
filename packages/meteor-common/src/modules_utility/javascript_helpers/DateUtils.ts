type DateOrUndefined = Date | undefined | null;

/*export function isPassed(
  ...{ 0: date, 1: defaultIfUndefined, length }:
    | [definedDate: Date]
    | [possiblyUndefinedDate: DateOrUndefined, defaultIfUndefined: boolean]
): boolean {
  if (date == null) {
    return defaultIfUndefined ?? false;
  }

  return Date.now() > date.getTime();
}*/

export function isDatePassed(date: Date): boolean;
export function isDatePassed(date: DateOrUndefined, defaultIfUndefined: boolean): boolean;
export function isDatePassed(date: DateOrUndefined, defaultIfUndefined?: boolean): boolean {
  if (date == null) {
    return defaultIfUndefined ?? false;
  }

  return Date.now() > date.getTime();
}

export function isDateComingUp(date: Date): boolean;
export function isDateComingUp(date: DateOrUndefined, defaultIfUndefined: boolean): boolean;
export function isDateComingUp(date: DateOrUndefined, defaultIfUndefined?: boolean): boolean {
  return !isDatePassed(date, defaultIfUndefined ?? false);
}

/*export const DateUtils = {
  isPassed,
};*/

/*
const dateOr: Date | undefined;
const properDate: Date = new Date();

isPassed(dateOr, false);
isPassed(properDate);
*/
