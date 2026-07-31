import { readFile } from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { defineConfig } from "orval";

async function resolveOpenApiPath(): Promise<string> {
  // Prioritise getting schema over http
  // If it exists, it is most up-to-date
  const backendHost = process.env.BACKEND_HOST ?? "localhost";
  const backendUrl = `http://${backendHost}:8081/api/openapi.json`;

  try {
    const res = await fetch(backendUrl);
    if (res.ok) {
      return backendUrl;
    }
  } catch {
    // Ignore
  }

  const frontendRoot = import.meta.url;
  const comsolRoot = new URL("../", frontendRoot);

  // Outside docker, it is written to backend/static/
  const hostPath = new URL("backend/static/openapi.json", comsolRoot);
  // Inside docker, we copy it to frontend/public/
  const dockerPath = new URL("public/openapi.json", frontendRoot);

  try {
    await readFile(dockerPath);
    return fileURLToPath(dockerPath);
  } catch {
    // Ignore
  }

  try {
    await readFile(hostPath);
    return fileURLToPath(hostPath);
  } catch {
    // Ignore
  }

  throw new Error(
    "Could not find OpenAPI schema. Try one of the following:\n" +
      "  - Start the backend server on localhost:8081.\n" +
      "  - Run `uv run manage.py export_openapi`.\n" +
      "  - Become a carrot farmer in Uzbekistan and avoid all of this hassle.",
  );
}

const inputTarget = await resolveOpenApiPath();

export default defineConfig({
  api: {
    output: {
      mode: "tags",
      target: "src/api/hooks/api.ts",
      schemas: "src/api/model",
      clean: true,
      client: "react-query",
      httpClient: "fetch",
      mock: false,
      override: {
        fetch: {
          includeHttpResponseReturnType: false,
        },
        mutator: {
          path: "src/api/mutator.ts",
          name: "customFetch",
        },
      },
    },
    input: {
      target: inputTarget,
      filters: {
        mode: "exclude",
        tags: ["frontend-exclude"],
      },
    },
  },
});
