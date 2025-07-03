import jsonPrettify from "json-stringify-pretty-compact";
import { useState } from "react";
import { notNullEmpty } from "../data_type_utils/StringUtils";
import {
  LocalStorageSnapshotStore,
  getLocalStorageSnapshot,
  setLocalStorageFromSnapshot,
  toggleLocalstorageUtil,
  updateLocalStorageCurrentSnapshot,
} from "./localstorage_snapshot.util";

export const LocalStorageSnapshotModal = () => {
  const { show, currentSnapshot, previousSnapshot, currentIsWellFormed } =
    LocalStorageSnapshotStore.useState();

  const [label, setLabel] = useState("");

  if (!show) return null;

  const isEqual = previousSnapshot === currentSnapshot;

  return (
    <div
      style={{
        zIndex: 999999999,
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
      onClick={() => {
        toggleLocalstorageUtil();
      }}
    >
      <div
        style={{
          zIndex: 999999999,
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "5px",
          color: "black",
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div>Local Storage Snapshot</div>
        <textarea
          style={{
            width: "100%",
            height: "400px",
            minWidth: "400px",
            border: "1px solid black",
            fontSize: "12px",
            fontFamily: "monospace",
            whiteSpace: "pre",
            backgroundColor: "white",
          }}
          value={currentSnapshot}
          onChange={(e) => {
            updateLocalStorageCurrentSnapshot(e.target.value);
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {!currentIsWellFormed && (
            <span style={{ color: "red" }}>Current Snapshot is not valid JSON</span>
          )}
          {!isEqual && <span style={{ color: "orange" }}>Snapshots are not equal</span>}
          <span style={{ color: "gray", fontSize: "12px" }}>
            Optional Label to append to exported filename
          </span>
          <input
            style={{
              border: "1px solid black",
              padding: "10px",
              backgroundColor: "white",
            }}
            placeholder={"Optional label to append to filename"}
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "10px",
              gap: "40px",
            }}
          >
            <button
              style={{
                color: !currentIsWellFormed || isEqual ? "gray" : "black",
              }}
              disabled={!currentIsWellFormed || isEqual}
              onClick={() => {
                setLocalStorageFromSnapshot();
              }}
            >
              Update Local Storage from text area
            </button>
            <button
              disabled={isEqual}
              style={{
                color: !isEqual ? "black" : "gray",
              }}
              onClick={() => {
                getLocalStorageSnapshot();
              }}
            >
              Refresh From Local Storage
            </button>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "10px",
              gap: "40px",
            }}
          >
            <button
              disabled={!currentIsWellFormed}
              style={{
                color: currentIsWellFormed ? "black" : "gray",
              }}
              onClick={() => {
                const element = document.createElement("a");
                const snapshotPretty = jsonPrettify(JSON.parse(currentSnapshot));
                const file = new Blob([snapshotPretty], { type: "text/plain" });
                element.href = URL.createObjectURL(file);
                const dateNow = new Date();
                element.download = `meteor_local_storage_${dateNow.toLocaleDateString()}_${dateNow.toLocaleTimeString()}${
                  notNullEmpty(label) ? `_${label}` : ""
                }.txt`;
                document.body.appendChild(element); // Required for this to work in FireFox
                element.click();
              }}
            >
              Save text area to File
            </button>
            <button
              disabled={!currentIsWellFormed}
              style={{
                color: currentIsWellFormed ? "black" : "gray",
              }}
              onClick={() => {
                // Select local file and load text from it
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".txt";
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  const file: File = (target.files as FileList)[0];
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const text = e.target?.result as string;
                    updateLocalStorageCurrentSnapshot(text);
                  };
                  reader.readAsText(file);
                };
                input.click();
              }}
            >
              Load text from File
            </button>
            <button
              style={{
                color: "black",
              }}
              onClick={() => toggleLocalstorageUtil()}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
