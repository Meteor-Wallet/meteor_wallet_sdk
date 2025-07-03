import hotkeys from "hotkeys-js";
import jsonPrettify from "json-stringify-pretty-compact";
import { Store } from "pullstate";

interface ILocalStorageSnapshotStore {
  show: boolean;
  currentIsWellFormed: boolean;
  currentSnapshot: string;
  previousSnapshot: string;
}

export const LocalStorageSnapshotStore = new Store<ILocalStorageSnapshotStore>({
  show: false,
  currentIsWellFormed: true,
  currentSnapshot: "{}",
  previousSnapshot: "{}",
});

export async function initializeLocalStorageSnapshot() {
  hotkeys("ctrl+alt+d", () => {
    toggleLocalstorageUtil();
  });
}

export function getLocalStorageSnapshot() {
  const snapshot = jsonPrettify(localStorage);
  LocalStorageSnapshotStore.update((s) => {
    s.currentSnapshot = snapshot;
    s.currentIsWellFormed = true;
    s.previousSnapshot = snapshot;
  });
}

export function setLocalStorageFromSnapshot() {
  const snapshot = LocalStorageSnapshotStore.getRawState().currentSnapshot;
  if (!snapshot) return;

  const parsedSnapshot = JSON.parse(snapshot);

  localStorage.clear();

  for (const key in parsedSnapshot) {
    localStorage.setItem(key, parsedSnapshot[key]);
  }

  LocalStorageSnapshotStore.update((s, o) => {
    s.previousSnapshot = o.currentSnapshot;
  });
}

export function updateLocalStorageCurrentSnapshot(snapshot: string) {
  let isWellFormed = true;

  try {
    JSON.parse(snapshot);
  } catch (e) {
    isWellFormed = false;
  }

  LocalStorageSnapshotStore.update((s) => {
    s.currentSnapshot = snapshot;
    s.currentIsWellFormed = isWellFormed;
  });
}

export function toggleLocalstorageUtil() {
  if (!LocalStorageSnapshotStore.getRawState().show) {
    getLocalStorageSnapshot();
  }

  console.log("Toggling show localstorage snapshot util");
  LocalStorageSnapshotStore.update((s, o) => {
    s.show = !o.show;
  });
}
