import * as pdfjs from "pdfjs-dist/legacy/build/pdf";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

if (typeof window !== "undefined" && window.Worker) {
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export { getDocument } from "pdfjs-dist/legacy/build/pdf";
