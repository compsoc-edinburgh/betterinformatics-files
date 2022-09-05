/**
 * By default worker-loader won't output to /static. Therefore we need to reexport
 * pdfjs and inject the correct location using webpack's loader sytnax. I hope this
 * is just a temporary workaround because there probably is a way to do this nicely.
 * We could also overwrite the webpack config...
 */
// eslint-disable-next-line import/no-webpack-loader-syntax
import PdfjsWorker from "worker-loader?publicPath=/static/!pdfjs-dist/legacy/build/pdf.worker.js";
import { GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.js";

if (typeof window !== "undefined" && "Worker" in window) {
  GlobalWorkerOptions.workerPort = new PdfjsWorker();
}
export * from "pdfjs-dist/legacy/build/pdf.js";
