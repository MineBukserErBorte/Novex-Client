import LegalGate from "./components/LegalGate";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(
    document.getElementById("root")!
).render(
    <React.StrictMode>
        <LegalGate><App /></LegalGate>
    </React.StrictMode>
);