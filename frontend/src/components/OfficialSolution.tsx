// import { pdfjs } from 'pdfjs-dist';
import { PDFDocumentLoadingTask } from 'pdfjs-dist';
import { loadSplitRenderer } from '../api/hooks';
import { getDocument } from '../pdf/pdfjs';
import React, { useEffect, useRef } from "react";



// pdfjs.GlobalWorkerOptions.workerSrc = 'pdf.worker.js';

function PdfTest(solution_file: string, solpage:number, x1:number, y1:number, x2: number , y2: number) {
  // useRef hooks
  const myCanvas: React.RefObject<HTMLCanvasElement> = useRef(null);

  const test = () => {
    const loadDocument = getDocument(solution_file);
    loadDocument.promise
// tslint:disable-next-line: no-any
      .then((pdf) => {
        return pdf.getPage(solpage);
      })
// tslint:disable-next-line: no-any
      .then((page) => {
        const viewport = page.getViewport({ 
          scale: 1,
          offsetX: -100 * 2,
          offsetY: -100 * 2
        });


        if (myCanvas.current) {
          const context = myCanvas.current.getContext('2d');
          if (context) {
            page.render({ canvasContext: context, viewport: viewport });
            myCanvas.current.height = viewport.height*(Math.abs(y1-y2));
            myCanvas.current.width = viewport.width*(Math.abs(x1-x2));
          }
        }
      });
  };

  // Render function
  if(solution_file){
    test()
    return (
      <div>
        <canvas ref={myCanvas} />
      </div>
    );
  }else{
    return "No Solution File found"
  }
  
}



const OfficialSolution = ({solution_file="", value=""}) => {

  if(solution_file){
    const regx = new RegExp(/page: (\d+)\r?\nfrom-relative-coords: \((0\.\d+|1), (0.\d+|1)\)\r?\nto-relative-coords: \((0\.\d+|1), (0.\d+|1)\)/)


    const match = value.match(regx)
    console.log(match)
    if(match){
      const page = parseInt(match[1], 10); // Extract page number and convert it to integer
      const x1 = parseFloat(match[2]);
      const y1 = parseFloat(match[3]);
      const x2 = parseFloat(match[4]);
      const y2 = parseFloat(match[5]);
      return PdfTest(solution_file, page, x1,y1,x2,y2)
    }else{
      return "Invalid Syntax use:\npage: <page number>\nfrom-relative-coords: (<x1>, <y1>)\r\nto-relative-coords: (<x2>, <y2>)"
    }
  }else{
    return "No Solution File found"
  }
  
};

export default OfficialSolution;