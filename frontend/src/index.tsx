import * as ReactDOM from "react-dom";
import "./index.css";
import { BrowserRouter, Route } from "react-router-dom";
import { QueryParamProvider } from "use-query-params";
import App from "./app";
import React from "react";

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryParamProvider ReactRouterRoute={Route}>
        <App />
      </QueryParamProvider>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root") as HTMLElement,
);
