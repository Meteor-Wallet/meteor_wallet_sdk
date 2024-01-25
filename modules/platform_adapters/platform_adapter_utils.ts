export function createPlatformAdapter<A>(adapterName: string) {
  let adapter: { i: A | undefined } = { i: undefined };

  const setAdapter = (implemented: A) => {
    if (adapter.i !== undefined) {
      console.warn(`${adapterName} Adapter already set. Overwriting`);
    }

    adapter.i = implemented;
  };

  const getAdapter = () => {
    if (adapter.i) {
      return adapter.i;
    }

    throw new Error(
      `${adapterName} Adapter has not been set yet. Use set${adapterName}Adapter() to implement it.`,
    );
  };

  const hasAdapter = () => {
    return adapter.i !== undefined;
  };

  return {
    setAdapter,
    getAdapter,
    hasAdapter,
  };
}
