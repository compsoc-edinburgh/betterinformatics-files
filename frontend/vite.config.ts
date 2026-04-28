import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

const parent_dirname = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const changelogPath = path.resolve(parent_dirname, "CHANGELOG.md");

// This plugin allows us to import the changelog file in the parent directory
// by referencing "CHANGELOG.md" in the import path.
// We originally tried Git symlinks to put a copy of the changelog in `frontend`
// but this didn't work on Windows without administrator mode.
function changelogAlias() {
  return {
    name: "changelog-alias",
    resolveId(source: string) {
      // Only use for local server, not for production build
      if (
        !process.env.BACKEND_HOST &&
        source.startsWith("../../CHANGELOG.md")
      ) {
        return `${changelogPath}${source.slice("../../CHANGELOG.md".length)}`;
      }

      return null;
    },
  };
}

export default defineConfig({
  plugins: [
    changelogAlias(),
    react(),
    svgr({
      include: "**/*.svg?react",
    }),
  ],
  build: {
    outDir: "build",
    assetsDir: "static",
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    fs: {
      allow: [parent_dirname],
    },
    proxy: {
      "/api": {
        // If we're running in a container, we can't use localhost
        target: `http://${process.env.BACKEND_HOST ?? "localhost"}:8081`,
        changeOrigin: false,
        secure: false,
      },
      "/static/ninja": {
        target: `http://${process.env.BACKEND_HOST ?? "localhost"}:8081`,
        changeOrigin: false,
        secure: false,
      },
    },
  },
  css: {
    modules: {
      localsConvention: "camelCaseOnly",
    },
  },
});
