import { SerializationUtils } from "../../../../javascript_helpers/SerializationUtils";
import { CookiePlugin_Def, ICookiePlugin_Methods } from "./CookiePlugin_Def";

CookiePlugin_Def.implementContextual(({ context }) => {
  const get: ICookiePlugin_Methods["get"] = context.get;
  const set: ICookiePlugin_Methods["set"] = context.set;
  const clear: ICookiePlugin_Methods["clear"] = context.clear;

  const getVar: ICookiePlugin_Methods["getVar"] = (inputs) => {
    const value = get(inputs);
    if (value == null) {
      return undefined;
    }

    try {
      return JSON.parse(value, SerializationUtils.JsonRevivers.reviveDateObjects);
    } catch (e) {
      console.error(`Couldn't parse found cookie: ${value}`);
      return undefined;
    }
  };

  const setVar: ICookiePlugin_Methods["setVar"] = (inputs) => {
    set({
      ...inputs,
      value: JSON.stringify(inputs.value),
    });
  };

  return {
    methods: {
      get,
      set,
      clear,
      getVar,
      setVar,
    },
    state: {},
  };
});

export const CookiePlugin_Impl = CookiePlugin_Def;
