import { notNullEmpty } from "../../ported_common/utils/nullEmptyString.ts";

interface IInitPropInput {
  propName?: string;
  canReinitialize?: boolean;
}

// Creates a property getter and setter (initialiser) which will throw and error if the property has not been initialized
export const initProp = <T>({ canReinitialize = false, propName }: IInitPropInput = {}) => {
  const state: { prop?: T } = {};

  return {
    set: (prop: T) => {
      if (prop != null) {
        if (state.prop == null || canReinitialize) {
          state.prop = prop;
        }
      }
    },
    get: (): T => {
      if (state.prop == null) {
        throw new Error(
          `Property requiring initialization${notNullEmpty(propName) ? ` "${propName}"` : ""} has not been set yet.`,
        );
      }

      return state.prop;
    },
  };
};
