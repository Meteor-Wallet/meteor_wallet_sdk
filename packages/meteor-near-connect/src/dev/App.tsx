import { useState } from "react";
import "./App.css";
import { bodyDesktop } from "../meteor-near-connect/view.ts";
import { setupNearConnectStyles } from "./near-connect-layout/setupNearConnect.ts";

setupNearConnectStyles();

function App() {
  const [emulateNearConnectPopup, setEmulateNearConnectPopup] = useState(false);

  return (
    <>
      <div
        style={{
          position: "relative",
          zIndex: 9999,
          marginBottom: "1em",
        }}
      >
        <button onClick={() => setEmulateNearConnectPopup(!emulateNearConnectPopup)}>
          {emulateNearConnectPopup ? "Pure Meteor Popup Styles" : "Emulate Near Popup"}
        </button>
      </div>
      <div className={"popup-test-area"}>
        {emulateNearConnectPopup ? (
          <div className="test hot-connector popup">
            <div className="modal-container">
              <div className="modal-content">
                <div className="modal-body" style={{ padding: 0, overflow: "auto" }}>
                  <div
                    style={{
                      width: "100%",
                      height: "720px",
                      border: "none",
                    }}
                    dangerouslySetInnerHTML={{ __html: bodyDesktop }}
                  />
                </div>
                <div className="footer">
                  <img
                    src="https://tgapp.herewallet.app/images/hot/hot-icon.png"
                    alt="HOT Connector"
                  />
                  <p>HOT Connector</p>
                  <p className="get-wallet-link">Don't have a wallet?</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={"popup-test-container"}>
            <div
              className={"popup-test-wallet-area"}
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                border: "none",
              }}
              dangerouslySetInnerHTML={{ __html: bodyDesktop }}
            />
            <div className="footer">
              <p>HOT Connector</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
