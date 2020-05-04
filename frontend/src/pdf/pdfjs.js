/**
 * By default worker-loader won't output to /static. Therefore we need to reexport
 * pdfjs and inject the correct location using webpack's loader sytnax. I hope this
 * is just a temporary workaround because there probably is a way to do this nicely.
 * We could also overwrite the webpack config...
 */
var pdfjs = require("pdfjs-dist/build/pdf.js");
// eslint-disable-next-line import/no-webpack-loader-syntax
var PdfjsWorker = require("worker-loader?name=static/workers/[hash].worker.js!pdfjs-dist/build/pdf.worker.js");

if (typeof window !== "undefined" && "Worker" in window) {
  pdfjs.GlobalWorkerOptions.workerPort = new PdfjsWorker();
}

module.exports = pdfjs;
