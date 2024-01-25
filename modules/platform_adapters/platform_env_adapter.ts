type TEnvGetter<T, K extends keyof T = keyof T> = (variableName: K) => T[K];

interface IEnvironmentAdapter_Output<T> {
  setEnvGetter: (getter: TEnvGetter<T>) => void;
  ENV_VARS: T;
}

const blackListedProperties = [
  // Because of Tamagui dynamic component checks
  "staticConfig",
  "$$typeof",
];

export function createEnvAdapter<T>(): IEnvironmentAdapter_Output<T> {
  let state: {
    getter?: TEnvGetter<T>;
    savedValues: any;
  } = {
    savedValues: {},
  };

  const ENV_VARS: T = new Proxy({} as any, {
    get(target: {}, p: string): string | undefined {
      if (blackListedProperties.includes(p)) {
        return undefined;
      }

      if (state.getter) {
        if (state.savedValues[p] != null) {
          return state.savedValues[p];
        }

        const value: any = state.getter(p as keyof T);

        if (value != null) {
          state.savedValues[p] = value;
          return value;
        } else {
          /*throw new Error(
            `Environment variable ${p} is not defined. No value was returned from getter.`,
          );*/
          return undefined;
        }
      } else {
        throw new Error(
          `Environment getter has not been set yet for this platform (Tried to get variable "${p}"). Use setEnvGetter() to implement it.`,
        );
      }
    },
  });

  function setEnvGetter(getter: TEnvGetter<T>) {
    state.getter = getter;
  }

  return {
    ENV_VARS,
    setEnvGetter,
  };
}
