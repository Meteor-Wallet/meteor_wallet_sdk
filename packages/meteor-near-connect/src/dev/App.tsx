import { useState } from "react";
import "./App.css";
import { bodyDesktop } from "../meteor-connect/view.ts";
import { setupNearConnectStyles } from "./near-connect-layout/setupNearConnect.ts";

setupNearConnectStyles();

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
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
              <img src="https://tgapp.herewallet.app/images/hot/hot-icon.png" alt="HOT Connector" />
              <p>HOT Connector</p>
              <p className="get-wallet-link">Don't have a wallet?</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
