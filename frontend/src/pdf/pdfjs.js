import { GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.js";

if (typeof window !== "undefined" && window.Worker) {
  const PdfjsWorker = new Worker(
    new URL("pdfjs-dist/legacy/build/pdf.worker.js", import.meta.url),
  );
  GlobalWorkerOptions.workerPort = PdfjsWorker;
}
export * from "pdfjs-dist/legacy/build/pdf.js";
