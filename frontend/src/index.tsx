import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "./app";
import { BrowserRouter } from "react-router-dom";
import { KeycloakProvider } from "@react-keycloak/web";
import keycloak from "./keycloak";

ReactDOM.render(
  <BrowserRouter>
    <KeycloakProvider
      keycloak={keycloak}
      initConfig={{
        flow: "standard",
        pkceMethod: "S256",
        enableLogging: true,
        checkLoginIframe: false,
      }}
    >
      <App />
    </KeycloakProvider>
  </BrowserRouter>,
  document.getElementById("root") as HTMLElement,
);
