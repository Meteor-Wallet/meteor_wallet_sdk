import isEqual from "fast-deep-equal";
import produce, { Draft } from "immer";

export class ApiStateStore<S> {
  private currentState: S;
  private initialState: S;
  private watchers: (() => void)[] = [];

  constructor(initial: S) {
    this.currentState = initial;
    this.initialState = initial;
  }

  addWatcher(selection: (state: S) => any, onChange: (selected: any) => void) {
    let watchState = { previous: selection(this.currentState) };

    this.watchers.push(() => {
      const current = selection(this.currentState);

      if (!isEqual(watchState.previous, current)) {
        watchState.previous = current;
        onChange(current);
      }
    });
  }

  update(updater: (draft: Draft<S>, original: S) => void) {
    this.currentState = produce(this.currentState, (s: Draft<S>) => updater(s, this.currentState));
    this.watchers.forEach((watcher) => watcher());
  }

  replace(newState: S) {
    this.currentState = newState;
    this.watchers.forEach((watcher) => watcher());
  }

  get current() {
    return this.currentState;
  }
}
