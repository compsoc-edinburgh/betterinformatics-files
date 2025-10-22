import "./utils/faro-intialize"

import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { ReactRouter5Adapter } from "use-query-params/adapters/react-router-5";
import { QueryParamProvider } from "use-query-params";
import App from "./app";
import { parse, stringify } from "query-string";
import { MantineProvider } from "@mantine/core";
import { FaroErrorBoundary } from "@grafana/faro-react";
import serverData from "./utils/server-data";

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);

const content = (
  <BrowserRouter>
    <QueryParamProvider
      adapter={ReactRouter5Adapter}
      options={{ searchStringToObject: parse, objectToSearchString: stringify }}
    >
      <MantineProvider defaultColorScheme="auto">
        <App />
      </MantineProvider>
    </QueryParamProvider>
  </BrowserRouter>
);

root.render(
  (import.meta.env.VITE_FARO_DISABLE !== "true" && serverData.faro_url)
    ? <FaroErrorBoundary>{content}</FaroErrorBoundary>
    : content,
);
