import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [
    react(),
    viteTsconfigPaths(),
    svgr({
      include: "**/*.svg?react",
    }),
  ],
  build: {
    outDir: "build",
    assetsDir: "static",
  },
  server: {
    open: true,
    port: 3000,
    proxy: {
      "/api": {
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
