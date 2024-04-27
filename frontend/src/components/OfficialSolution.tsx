// import { pdfjs } from 'pdfjs-dist';
import { PDFDocumentLoadingTask } from "pdfjs-dist";
import { loadSplitRenderer } from "../api/hooks";
import { getDocument } from "../pdf/pdfjs";
import React, { useEffect, useRef } from "react";

interface PdfCoordinates {
  ref_page: number;
  p1: [number, number];
  p2: [number, number];
}

function PdfRenderer(solution_file: string, pdfCoordinates: PdfCoordinates, targetWidth?: number) {
  const myCanvas: React.RefObject<HTMLCanvasElement> = useRef(null);

  const renderCanvas = () => {
    const loadDocument: PDFDocumentLoadingTask = getDocument(solution_file);
    loadDocument.promise
      .then(pdf => {
        return pdf.getPage(Math.min(pdfCoordinates.ref_page, pdf.numPages));
      })
      .then(page => {
        const [x1, y1] = pdfCoordinates.p1;
        const [x2, y2] = pdfCoordinates.p2;

        const unscaledViewport = page.getViewport({ scale: 1 }); // Get viewport at scale 1 to calculate dimensions
        targetWidth = targetWidth?targetWidth:500
        const scale = 0.8*targetWidth / (unscaledViewport.width*Math.abs(x1-x2));
        const offsetX = -unscaledViewport.width * scale * x1;
        const offsetY = -unscaledViewport.height * scale * y1;
        const viewport = page.getViewport({
          scale: scale,
          offsetX: offsetX,
          offsetY: offsetY,
        });

        if (myCanvas.current) {
          const context = myCanvas.current.getContext("2d");
          if (context) {
            page.render({ canvasContext: context, viewport: viewport });
            myCanvas.current.height = viewport.height * Math.abs(y1 - y2);
            myCanvas.current.width = viewport.width * Math.abs(x1 - x2);
          }
        }
      });
  };

  // Render function
  if (solution_file) {
    try {
      renderCanvas();
      return (
        <div>
          <canvas ref={myCanvas} />
        </div>
      );
    } catch {
      return <>An Error occoured. Check your syntax.</>;
    }
  } else {
    return <>No Solution File found</>;
  }
}

interface Props {
  solution_file?: string;
  value?: string | null;
  targetWidth?: number;
}

const OfficialSolution: React.FC<Props> = ({
  solution_file,
  value,
  targetWidth,
}) => {
  if (solution_file) {
    const regx = new RegExp(
      /page: (\d+)\r?\nfrom-relative-coords: \((0\.\d+|1), (0.\d+|1)\)\r?\nto-relative-coords: \((0\.\d+|1), (0.\d+|1)\)/,
    );

    if (value) {
      const match = value.match(regx);
      if (match) {
        const page = parseInt(match[1]); // Extract page number and convert it to integer
        if (page < 1) return <>Invalid Page</>;
        const p1: [number, number] = [parseFloat(match[2]), parseFloat(match[3])]
        const p2: [number, number] = [parseFloat(match[4]), parseFloat(match[5])]
        return PdfRenderer(solution_file, {
          ref_page: page,
          p1,
          p2},
          targetWidth=targetWidth,
        );
      }
    }
    return <>Invalid Syntax</>;
  } else {
    return <>No Solution File found</>;
  }
};

export default OfficialSolution;
