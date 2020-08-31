import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "./app";
import { BrowserRouter, Route } from "react-router-dom";
import { QueryParamProvider } from "use-query-params";

ReactDOM.render(
  <BrowserRouter>
    <QueryParamProvider ReactRouterRoute={Route}>
      <App />
    </QueryParamProvider>
  </BrowserRouter>,
  document.getElementById("root") as HTMLElement,
);
