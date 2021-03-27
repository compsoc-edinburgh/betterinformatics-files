import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "./app";
import { BrowserRouter, Route } from "react-router-dom";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import keycloak from "./keycloak";
import { QueryParamProvider } from "use-query-params";

const optParse = (str: string | null) => {
  try {
    return str === null ? undefined : JSON.parse(str);
  } catch (e) {
    return undefined;
  }
};

ReactDOM.render(
  <BrowserRouter>
    <QueryParamProvider ReactRouterRoute={Route}>
      <ReactKeycloakProvider
        authClient={keycloak}
        onTokens={tokens => {
          // "kc-store-tokens" enables storing keycloak tokens in localStorage
          // Currently this is exclusively a debug feature so that page reloads
          // don't require the developer to press the login button again. It is potentially
          // a security issue to store these tokens in localStorage
          if (localStorage.getItem("kc-store-tokens")) {
            localStorage.setItem("kc-idToken", JSON.stringify(tokens.idToken));
            localStorage.setItem(
              "kc-refreshToken",
              JSON.stringify(tokens.refreshToken),
            );
            localStorage.setItem("kc-token", JSON.stringify(tokens.token));
          }
        }}
        initOptions={{
          checkLoginIframe: false,
          silentCheckSsoFallback: false,
          onLoad: "",
          flow: "implicit",
          idToken: optParse(localStorage.getItem("kc-idToken")),
          refreshToken: optParse(localStorage.getItem("kc-refreshToken")),
          token: optParse(localStorage.getItem("kc-token")),
        }}
      >
        <App />
      </ReactKeycloakProvider>
    </QueryParamProvider>
  </BrowserRouter>,
  document.getElementById("root") as HTMLElement,
);
