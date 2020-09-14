import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "./app";
import { BrowserRouter, Route } from "react-router-dom";
import { KeycloakProvider } from "@react-keycloak/web";
import keycloak from "./keycloak";
import { QueryParamProvider } from "use-query-params";

ReactDOM.render(
  <BrowserRouter>
    <QueryParamProvider ReactRouterRoute={Route}>
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
    </QueryParamProvider>
  </BrowserRouter>,
  document.getElementById("root") as HTMLElement,
);
