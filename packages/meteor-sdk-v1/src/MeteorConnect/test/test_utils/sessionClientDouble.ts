import type {
  ISessionEventEmitter,
  ISessionEventPayloads,
  TSessionEventName,
} from "@meteorwallet/connect";
import { ESessionPhase, type TSessionFacts } from "@meteorwallet/connect-shared";

/**
 * The half of a `PartnerSessionClient` double that every test in this package needs identical, and
 * the half they kept getting wrong: what a VERB does with the facts it returns.
 *
 * The shipped client never merely RETURNS facts. Every verb that produces them — `createSession`,
 * `verifyPin`, `submitPreparedAction`, `submitPreparedAdvance`, `acknowledgeResult`,
 * `acknowledgeAndBeginExternalWork`, `acknowledgeAndClose`, `requestCloseAfterTurn`,
 * `abandonResultAndClose`, `closeSession`, and the `closePhaseSafe` that composes them — hands them
 * to `acceptSessionActionFacts` first, SYNCHRONOUSLY, from inside its own still-pending await. A
 * subscriber therefore sees `factsChanged` (plus `pinRequired`, plus `terminal` on a terminal
 * phase) BEFORE the verb resolves. A double that only returns the facts moves every one of those
 * events to after the await — which is exactly what hid a session reading the terminal facts of its
 * OWN close verb as a counterparty cancel.
 *
 * So: build the events surface with {@link createSessionClientDoubleBase}, and return every verb's
 * facts through {@link ISessionClientDoubleBase.verb}. {@link ISessionClientDoubleBase.emit} stays
 * the raw single-event injector for the COUNTERPARTY side of the bridge (the realm projection and
 * the transport link), deliberately not coupled to the verb path: the flow code reacts to
 * `factsChanged` and to `terminal` on two separate seams, and the tests assert them separately.
 */
/**
 * The facts fixture every double here stages: only the members the SDK's own projection reads. The
 * rest of the authenticated record is irrelevant to these tests, so it is not invented.
 */
export const sessionFactsFor = (phase: ESessionPhase): TSessionFacts =>
  ({
    phase,
    idleExpiresAt: Date.now() + 300_000,
    absoluteExpiresAt: Date.now() + 1_800_000,
  }) as TSessionFacts;

export interface ISessionClientDoubleBase {
  /** Verbatim `client.events`: multi-subscribe, synchronous dispatch, unsubscribe handles. */
  readonly events: ISessionEventEmitter;
  /**
   * Raise ONE event exactly as scripted — the realm/transport side, which arrives on its own
   * rather than out of a verb the SDK called. Facts on a `factsChanged` are recorded (the client's
   * realm path records them too); nothing further is raised.
   */
  emit<TEventName extends TSessionEventName>(
    eventName: TEventName,
    payload: ISessionEventPayloads[TEventName],
  ): void;
  /** What the double's `sessionFacts` getter must return: the last facts it accepted. */
  getSessionFacts(): Readonly<TSessionFacts> | undefined;
  /**
   * `acceptSessionActionFacts`, mirrored: record, then emit `factsChanged` from the ACTION source,
   * `pinRequired` once per binding, and `terminal` on a terminal phase. Returns its argument so a
   * verb body can end in `return publishFacts(...)`.
   */
  publishFacts(facts: TSessionFacts, selfInitiated?: boolean): TSessionFacts;
  /**
   * Wrap a facts-returning verb so its facts are published before its promise resolves — the shape
   * every such verb on a double is written in, so the emission cannot be forgotten.
   */
  verb<TArguments extends unknown[]>(
    implementation: (...args: TArguments) => TSessionFacts | Promise<TSessionFacts>,
    /** Set for a CLOSE verb, so its terminal is published as this client's own (`selfInitiated`). */
    options?: { selfInitiated?: boolean },
  ): (...args: TArguments) => Promise<TSessionFacts>;
  /** What `disconnectBridge` / `resetClient` do: drop the binding's facts, re-arm `pinRequired`. */
  releaseBinding(): void;
}

/**
 * Build the shared base of a `PartnerSessionClient`-shaped double. `facts` seeds the binding for a
 * double that stands in for an already-bound session.
 */
export function createSessionClientDoubleBase(
  input: { facts?: TSessionFacts } = {},
): ISessionClientDoubleBase {
  let sessionFacts: Readonly<TSessionFacts> | undefined = input.facts;
  /** `pinRequired` fires at most once per session binding (F14). */
  let pinRequiredEmitted = false;
  const handlers = new Map<TSessionEventName, Set<(payload: never) => void>>();
  const events: ISessionEventEmitter = {
    on: (eventName, handler) => {
      const set = handlers.get(eventName) ?? new Set();
      handlers.set(eventName, set);
      set.add(handler as (payload: never) => void);
      return () => set.delete(handler as (payload: never) => void);
    },
    off: (eventName, handler) => {
      handlers.get(eventName)?.delete(handler as (payload: never) => void);
    },
    once: (eventName, handler) => {
      const unsubscribe = events.on(eventName, (payload) => {
        unsubscribe();
        handler(payload);
      });
      return unsubscribe;
    },
  };
  const dispatch = <TEventName extends TSessionEventName>(
    eventName: TEventName,
    payload: ISessionEventPayloads[TEventName],
  ): void => {
    // A copy: a handler that unsubscribes during dispatch must not perturb this pass.
    for (const handler of [...(handlers.get(eventName) ?? [])]) {
      (handler as unknown as (value: ISessionEventPayloads[TEventName]) => void)(payload);
    }
  };
  /**
   * The client records the facts it accepts whatever route they arrived by, so a realm-sourced
   * `factsChanged` (or `pinRequired`) moves the double's `sessionFacts` too.
   */
  const recordFactsCarriedBy = (payload: ISessionEventPayloads[TSessionEventName]): void => {
    if ("facts" in payload) sessionFacts = payload.facts;
  };
  const publishFacts = (facts: TSessionFacts, selfInitiated = false): TSessionFacts => {
    sessionFacts = facts;
    dispatch("factsChanged", { facts, source: "action" });
    if (!pinRequiredEmitted && facts.phase === ESessionPhase.wallet_verification) {
      pinRequiredEmitted = true;
      dispatch("pinRequired", { facts });
    }
    if (facts.phase === ESessionPhase.closed || facts.phase === ESessionPhase.failed) {
      // Mirrors the real client: a terminal produced by one of THIS client's own close verbs is
      // flagged, so a projection can tell its own close from the counterparty ending the session.
      dispatch("terminal", {
        outcome: { reason: "terminal_status", statusId: facts.phase, selfInitiated },
      });
    }
    return facts;
  };
  return {
    events,
    emit: (eventName, payload) => {
      recordFactsCarriedBy(payload);
      dispatch(eventName, payload);
    },
    getSessionFacts: () => sessionFacts,
    publishFacts,
    verb:
      (implementation, options) =>
      async (...args) =>
        publishFacts(await implementation(...args), options?.selfInitiated ?? false),
    releaseBinding: () => {
      sessionFacts = undefined;
      pinRequiredEmitted = false;
    },
  };
}
