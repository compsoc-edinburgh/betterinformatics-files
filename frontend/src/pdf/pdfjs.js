var pdfjs = require("pdfjs-dist/build/pdf.js");
// eslint-disable-next-line import/no-webpack-loader-syntax
var PdfjsWorker = require("worker-loader?name=static/workers/[hash].worker.js!pdfjs-dist/build/pdf.worker.js");

if (typeof window !== "undefined" && "Worker" in window) {
  pdfjs.GlobalWorkerOptions.workerPort = new PdfjsWorker();
}

module.exports = pdfjs;
