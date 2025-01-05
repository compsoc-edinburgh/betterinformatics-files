import * as pdfjs from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

if (typeof window !== "undefined" && window.Worker) {
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export { getDocument } from "pdfjs-dist/build/pdf.mjs";
