import React from "react";
import ReactDOM from "react-dom/client";
import AppWithRouter from "./AppWithRouter";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppWithRouter />
  </React.StrictMode>,
);
