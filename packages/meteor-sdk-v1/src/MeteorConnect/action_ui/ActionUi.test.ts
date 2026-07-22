import { describe, expect, it } from "bun:test";
import { ActionUi } from "./ActionUi";

describe("ActionUi lifecycle", () => {
  it("releases the active action before asynchronous session disposal finishes", async () => {
    const ui = new ActionUi();
    let finishDisposal!: () => void;
    const disposal = new Promise<void>((resolve) => {
      finishDisposal = resolve;
    });
    const action = { disposePreparedMobileSession: () => disposal };
    (ui as any).activeAction = action;

    const finishPrompt = (ui as any).finishPrompt(action);

    expect((ui as any).activeAction).toBeUndefined();
    finishDisposal();
    await finishPrompt;
  });

  it("ignores late cleanup from an older action after another action is rendered", () => {
    const ui = new ActionUi();
    const oldAction = {};
    const currentAction = {};
    let removed = false;
    (ui as any).renderedAction = currentAction;
    (ui as any).actionUiComponent = { remove: () => (removed = true) };

    ui.cleanup(oldAction as any);

    expect(removed).toBeFalse();
    expect((ui as any).renderedAction).toBe(currentAction);
  });
});
