import { RPC_ABNORMAL_PING_THRESHOLD } from "./rpc_constants";

async function getRpcPing({ nodeUrl, timeoutInMs }: { nodeUrl: string; timeoutInMs: number }) {
  try {
    const startTime = performance.now();
    await fetch(nodeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "gas_price",
        params: [null],
        id: "dontcare",
        jsonrpc: "2.0",
      }),
      signal: AbortSignal.timeout(timeoutInMs),
    });
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    return Math.floor(executionTime);
  } catch (err) {
    return RPC_ABNORMAL_PING_THRESHOLD + 1;
  }
}

export const rpc_async_functions = {
  getRpcPing,
};
