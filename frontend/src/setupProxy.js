const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  // allows for changing the host using an env variable
  const host = process.env.BACKEND_HOST ?? "localhost:8081";
  app.use(
    "/api",
    createProxyMiddleware({
      target: `http://${host}`,
      changeOrigin: false,
    }),
  );
};
