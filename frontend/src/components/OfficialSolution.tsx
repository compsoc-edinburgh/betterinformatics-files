import { PDFDocumentProxy } from 'pdfjs-dist';
import PDF from '../pdf/pdf-renderer';
import { getDocument } from '../pdf/pdfjs';
import React, { useEffect, useRef } from "react";


const OfficialSolution = ({ pdfUrl= "https://ethz.ch/content/dam/ethz/main/education/bachelor/studiengaenge/files/ETH-Zurich-Degree-programmes.pdf", pageNumber = 1, scale = 0.9, start = 0.2, end = 0.8 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const fetchPdf = async () => {
      const loadingTask = getDocument(pdfUrl);
      const pdfDoc = await loadingTask.promise;
      const pdf = new PDF(pdfDoc);

      const [canvas, , ref] = await pdf.renderCanvasSplit(pageNumber, scale, start, end);
      if (canvasRef.current) {
        const context = canvasRef.current.getContext("2d");
        canvasRef.current.width = canvas.width;
        canvasRef.current.height = canvas.height;
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        context.drawImage(canvas, 0, 0, canvas.width, canvas.height);
      }
      // Remember to release the reference when it's no longer needed
      ref.release();
    };

    fetchPdf().catch(console.error);

    // Cleanup function to potentially abort PDF loading task if component unmounts
    return () => {
      loadingTask.destroy();
    };
  }, [pdfUrl, pageNumber, scale, start, end]); // Update effect dependencies as needed

  return <canvas ref={canvasRef}></canvas>;
};

export default OfficialSolution;