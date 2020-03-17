import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "./app";
//import registerServiceWorker from "./register-service-worker";
import { BrowserRouter } from "react-router-dom";
import "@vseth/vseth-theme/dist/vseth-bootstrap-theme.css";

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById("root") as HTMLElement,
);
//registerServiceWorker();
