import "./utils/faro-intialize";

import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import App from "./app";
import { MantineProvider } from "@mantine/core";
import { FaroErrorBoundary } from "@grafana/faro-react";
import serverData from "./utils/server-data";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const container = document.getElementById("root")!;
const root = createRoot(container);

const queryClient = new QueryClient();

const content = (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <MantineProvider defaultColorScheme="auto">
        <App />
      </MantineProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

root.render(
  import.meta.env.VITE_FARO_DISABLE !== "true" && serverData.faro_url ? (
    <FaroErrorBoundary>{content}</FaroErrorBoundary>
  ) : (
    content
  ),
);
