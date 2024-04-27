// import { pdfjs } from 'pdfjs-dist';
import { PDFDocumentLoadingTask } from 'pdfjs-dist';
import { loadSplitRenderer } from '../api/hooks';
import { getDocument } from '../pdf/pdfjs';
import React, { useEffect, useRef } from "react";




function PdfRenderer(solution_file: string, solpage:number, x1:number, y1:number, x2: number , y2: number) {
  const myCanvas: React.RefObject<HTMLCanvasElement> = useRef(null);

  const renderCanvas = () => {
    const loadDocument:PDFDocumentLoadingTask = getDocument(solution_file);
    loadDocument.promise
      .then((pdf) => {
        if(solpage>pdf.numPages){
          // returns the last page if page too big
          return pdf.getPage(pdf.numPages)
        }
       
        return pdf.getPage(solpage);
      })
      .then((page) => {
       
        const unscaledViewport = page.getViewport({ scale: 1 }); // Get viewport at scale 1 to calculate dimensions
        const scale = 1.3;
        const offsetX = -unscaledViewport.width * scale * x1;
        const offsetY = -unscaledViewport.height * scale * y1;
        const viewport = page.getViewport({ 
          scale: scale,
          offsetX: offsetX,
          offsetY: offsetY
        });


        if (myCanvas.current) {
          const context = myCanvas.current.getContext('2d');
          if (context) {
            page.render({ canvasContext: context, viewport: viewport });
            myCanvas.current.height = viewport.height*(Math.abs(y1-y2));
            myCanvas.current.width = viewport.width*(Math.abs(x1-x2));
          }
        }
      })
  };

  // Render function
  if(solution_file){
    try{
      renderCanvas()
      return (
        <div>
          <canvas ref={myCanvas} />
        </div>
      );
    }catch{
      return <>An Error occoured. Check your syntax.</> 

    }
    
    
  }else{
    return <>No Solution File found</>
  }
  
}
interface OfficialSolutionProps{
  solution_file?:string;
  value?:string | null;
}


const OfficialSolution: React.FC<OfficialSolutionProps>= ({solution_file, value}) => {

  if(solution_file){
    const regx = new RegExp(/page: (\d+)\r?\nfrom-relative-coords: \((0\.\d+|1), (0.\d+|1)\)\r?\nto-relative-coords: \((0\.\d+|1), (0.\d+|1)\)/)

    if(value){
      const match = value.match(regx)
      if(match){
        const page = parseInt(match[1]); // Extract page number and convert it to integer
        const x1 = parseFloat(match[2]);
        const y1 = parseFloat(match[3]);
        const x2 = parseFloat(match[4]);
        const y2 = parseFloat(match[5]);
        if(page<1) return <>Invalid Page</>
        return PdfRenderer(solution_file, page, x1,y1,x2,y2)
      }
    }
    return <>Invalid Syntax</>
    // return <>"Invalid Syntax use:\npage: page number\nfrom-relative-coords: (x1, y1)\nto-relative-coords: (x2, y2)"</>
    
    
  }else{
    return <>No Solution File found</>
  }
  
};


export default OfficialSolution;