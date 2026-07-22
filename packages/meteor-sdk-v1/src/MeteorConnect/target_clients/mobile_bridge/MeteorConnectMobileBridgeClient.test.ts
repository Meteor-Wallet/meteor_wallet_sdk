import { describe, expect, it } from "bun:test";
import { MeteorConnectMobileBridgeClient } from "./MeteorConnectMobileBridgeClient";

describe("MeteorConnectMobileBridgeClient session lifecycle", () => {
  it("fences an abandoned current session before asynchronous disposal finishes", async () => {
    const client = new MeteorConnectMobileBridgeClient({} as any);
    let finishDisposal!: () => void;
    const disposal = new Promise<void>((resolve) => {
      finishDisposal = resolve;
    });
    const session = { dispose: () => disposal };
    (client as any).currentSession = session;
    (client as any).currentToken = "abandoned-session";

    const release = client.releaseSession(session as any);

    expect(client.getCurrentSession()).toBeUndefined();
    expect((client as any).currentToken).toBeUndefined();
    finishDisposal();
    await release;
  });
});
