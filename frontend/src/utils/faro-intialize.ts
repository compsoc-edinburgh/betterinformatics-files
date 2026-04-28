import {
  createRoutesFromChildren,
  matchRoutes,
  Routes,
  useLocation,
  useNavigationType,
} from "react-router-dom";

import { trace, context } from "@opentelemetry/api";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";

import {
  createReactRouterV7Options,
  getWebInstrumentations,
  initializeFaro,
  ReactIntegration,
  faro,
} from "@grafana/faro-react";

import serverData from "./server-data";

// Allow compile time disabling faro -- for local dev
if (import.meta.env.VITE_FARO_DISABLE !== "true" && serverData.faro_url) {
  initializeFaro({
    // Mandatory, the URL of the Grafana collector
    url: serverData.faro_url,

    // Mandatory, the identification label of your application
    app: {
      name: "community-solutions-frontend",
    },

    instrumentations: [
      // Load the default Web instrumentations
      ...getWebInstrumentations(),

      new TracingInstrumentation(),

      new ReactIntegration({
        router: createReactRouterV7Options({
          createRoutesFromChildren,
          matchRoutes,
          Routes,
          useLocation,
          useNavigationType,
        }),
      }),
    ],
  });
  // ...
  // register OpenTelemetry API with Faro Web SDK instance
  faro.api.initOTEL(trace, context);

  faro.api.pushLog(["Faro was initialized"]);
}
