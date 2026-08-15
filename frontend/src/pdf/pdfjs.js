import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

let pdfjsModulePromise;
// Async function to dynamically import and initialize the service worker for
// pdfjs-dist (if we haven't done so yet). This is used to avoid bundling pdfjs
// together into the main bundle.
const loadPdfJsModule = () => {
  if (!pdfjsModulePromise) {
    pdfjsModulePromise = import("pdfjs-dist/legacy/build/pdf").then(pdfjs => {
      if (typeof window !== "undefined" && window.Worker) {
        pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
      }
      return pdfjs;
    });
  }
  return pdfjsModulePromise;
};

// Wrapper around pdfjs-dist's getDocument function that dynamically imports
// pdfjs as necessary.
export const getDocument = params => {
  return {
    promise: loadPdfJsModule().then(pdfjs => pdfjs.getDocument(params).promise),
  };
};
