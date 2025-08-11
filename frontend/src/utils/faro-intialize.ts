import { createBrowserHistory } from 'history';
import { Route } from 'react-router-dom';

import { trace, context } from '@opentelemetry/api';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

import {
  createReactRouterV5Options,
  getWebInstrumentations,
  initializeFaro,
  ReactIntegration,
  faro,
  ReactRouterHistory
} from '@grafana/faro-react';
import serverData from './server-data';

const history = createBrowserHistory();

// Allow compile time disabling faro -- for local dev
if (import.meta.env.VITE_FARO_DISABLE !== "true" && serverData.faro_url) {
  initializeFaro({
    // Mandatory, the URL of the Grafana collector
    url: serverData.faro_url,

    // Mandatory, the identification label of your application
    app: {
      name: 'my-react-app',
    },

    instrumentations: [
      // Load the default Web instrumentations
      ...getWebInstrumentations(),

      new TracingInstrumentation(),

      new ReactIntegration({
        // or createReactRouterV4Options
        router: createReactRouterV5Options({
          history: history as ReactRouterHistory, // the history object used by react-router
          Route, // Route component imported from react-router package
        }),
      }),
    ],
  });
  // ...
  // register OpenTelemetry API with Faro Web SDK instance
  faro.api.initOTEL(trace, context);

  faro.api.pushLog(["Faro was initialized"])
}
