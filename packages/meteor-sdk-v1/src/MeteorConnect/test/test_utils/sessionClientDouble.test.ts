import { describe, expect, it } from "bun:test";
import { ESessionPhase } from "@meteorwallet/connect-shared";
import { createSessionClientDoubleBase, sessionFactsFor } from "./sessionClientDouble";

/**
 * The contract every `PartnerSessionClient`-shaped double in this package is built on. It is
 * asserted here rather than only through the flows that use it, because the failure it guards
 * against is invisible by construction: a double that returns facts without emitting them makes
 * every ordering bug at that seam pass.
 */
describe("session client double base", () => {
  it("emits a verb's facts before that verb's promise resolves", async () => {
    const base = createSessionClientDoubleBase();
    const order: string[] = [];
    base.events.on("factsChanged", ({ facts, source }) =>
      order.push(`facts:${facts.phase}`, source),
    );
    base.events.on("terminal", ({ outcome }) => order.push(`terminal:${outcome.statusId}`));

    const acknowledgeAndClose = base.verb(() => sessionFactsFor(ESessionPhase.closed));
    await acknowledgeAndClose().then(() => order.push("resolved"));

    // `acceptSessionActionFacts` runs inside the verb's own still-pending await, so every event it
    // raises reaches the subscriber first. `async () => facts` produces `["resolved"]` alone.
    expect(order).toEqual([
      `facts:${ESessionPhase.closed}`,
      "action",
      `terminal:${ESessionPhase.closed}`,
      "resolved",
    ]);
  });

  it("raises terminal for both terminal phases and for neither live one", async () => {
    const terminalized: Array<string | undefined> = [];
    const base = createSessionClientDoubleBase();
    base.events.on("terminal", ({ outcome }) => terminalized.push(outcome.statusId));
    const publish = base.verb((phase: ESessionPhase) => sessionFactsFor(phase));

    await publish(ESessionPhase.wallet_action);
    await publish(ESessionPhase.result_ready);
    expect(terminalized).toEqual([]);

    await publish(ESessionPhase.closed);
    await publish(ESessionPhase.failed);
    expect(terminalized).toEqual([ESessionPhase.closed, ESessionPhase.failed]);
  });

  it("raises pinRequired at most once per binding, re-armed by a release", async () => {
    const base = createSessionClientDoubleBase();
    let pinPrompts = 0;
    base.events.on("pinRequired", () => {
      pinPrompts += 1;
    });
    const publish = base.verb((phase: ESessionPhase) => sessionFactsFor(phase));

    await publish(ESessionPhase.wallet_verification);
    await publish(ESessionPhase.wallet_verification);
    expect(pinPrompts).toBe(1);

    // `disconnectBridge` drops the binding, and the next one gets its own PIN ceremony.
    base.releaseBinding();
    await publish(ESessionPhase.wallet_verification);
    expect(pinPrompts).toBe(2);
  });

  it("moves sessionFacts by both routes and drops them when the binding is released", async () => {
    const base = createSessionClientDoubleBase();
    expect(base.getSessionFacts()).toBeUndefined();

    base.emit("factsChanged", {
      facts: sessionFactsFor(ESessionPhase.wallet_action),
      source: "realm",
    });
    expect(base.getSessionFacts()?.phase).toBe(ESessionPhase.wallet_action);

    await base.verb(() => sessionFactsFor(ESessionPhase.result_ready))();
    expect(base.getSessionFacts()?.phase).toBe(ESessionPhase.result_ready);

    base.releaseBinding();
    expect(base.getSessionFacts()).toBeUndefined();
  });

  it("keeps the scripted counterparty route to exactly the event it names", () => {
    // The flow code reads a terminal `closed` on two separate seams — the facts projection and the
    // terminal outcome — and each is asserted on its own. Coupling them here would make either
    // seam's test pass on the other's behaviour.
    const observed: string[] = [];
    const base = createSessionClientDoubleBase();
    base.events.on("factsChanged", ({ facts }) => observed.push(`facts:${facts.phase}`));
    base.events.on("terminal", () => observed.push("terminal"));

    base.emit("factsChanged", { facts: sessionFactsFor(ESessionPhase.closed), source: "realm" });

    expect(observed).toEqual([`facts:${ESessionPhase.closed}`]);
  });

  it("dispatches to every subscriber, and honours unsubscribing mid-dispatch", () => {
    const base = createSessionClientDoubleBase();
    const seen: string[] = [];
    const unsubscribeFirst = base.events.on("factsChanged", () => {
      seen.push("first");
      // `once` unsubscribes from inside its own dispatch; the pass in flight must still complete.
      unsubscribeFirst();
    });
    base.events.on("factsChanged", () => seen.push("second"));
    base.events.once("factsChanged", () => seen.push("once"));

    base.publishFacts(sessionFactsFor(ESessionPhase.wallet_action));
    base.publishFacts(sessionFactsFor(ESessionPhase.result_ready));

    expect(seen).toEqual(["first", "second", "once", "second"]);
  });
});
