import { EnvironmentStateAdapter } from "../../modules_utility/state_utils/EnvironmentStorageUtils";

interface ISetupEnvironment_Input {
  sessionAdapter: EnvironmentStateAdapter;
  localStorageAdapter: EnvironmentStateAdapter;
}

const adaptiveVariables: Partial<ISetupEnvironment_Input> = {};

export function setupEnvironment({ sessionAdapter, localStorageAdapter }: ISetupEnvironment_Input) {
  adaptiveVariables.sessionAdapter = sessionAdapter;
  adaptiveVariables.localStorageAdapter = localStorageAdapter;
}

export function getAdaptiveVariable<N extends keyof ISetupEnvironment_Input>(
  name: N,
): ISetupEnvironment_Input[N] {
  const resp = adaptiveVariables[name];

  if (resp == null) {
    throw new Error(`Requested adaptive variable "${name}" has not been set yet.`);
  }

  return resp!;
}
