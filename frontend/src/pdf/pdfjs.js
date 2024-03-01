import * as pdfjs from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?url";

if (typeof window !== "undefined" && window.Worker) {
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export { getDocument } from "pdfjs-dist/build/pdf.js";
