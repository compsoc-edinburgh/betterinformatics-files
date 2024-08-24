// import { pdfjs } from 'pdfjs-dist';
import { PDFDocumentLoadingTask } from "pdfjs-dist";
import { getDocument } from "../pdf/pdfjs";
import React, { useMemo, useRef } from "react";
import { ComponentRenderer } from "./markdown-text";
import { Tooltip } from "@mantine/core";
import { fetchGet } from "../api/fetch-utils";

interface PdfCoordinates {
  ref_page: number;
  p1: [number, number];
  p2: [number, number];
}

function PdfRenderer(
  solutionRequest: Promise<any>,
  pdfCoordinates: PdfCoordinates,
  targetWidth?: number,
) {
  const myCanvas: React.RefObject<HTMLCanvasElement> = useRef(null);
  const renderCanvas = (solutionFile : string) => {
    const loadDocument: PDFDocumentLoadingTask = getDocument(solutionFile);
    loadDocument.promise
      .then(pdf => {
        return pdf.getPage(Math.min(pdfCoordinates.ref_page, pdf.numPages));
      })
      .then(page => {
        const [x1, y1] = pdfCoordinates.p1;
        const [x2, y2] = pdfCoordinates.p2;

        const unscaledViewport = page.getViewport({ scale: 1 }); // Get viewport at scale 1 to calculate dimensions
        targetWidth = targetWidth ? targetWidth : 500;
        const scale = Math.min(2.5,
          (0.8 * targetWidth) / (unscaledViewport.width * Math.abs(x1 - x2)));
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
  
    try {
      solutionRequest.then( urlwrap  =>
        {
          renderCanvas(urlwrap.value);
        }
      ).catch(()=>{
        const ctx = myCanvas.current.getContext("2d");
        ctx.font = "48px serif";
        ctx.fillText("Invalid Syntax in Official Solution file path.", 5, 30);
      })
      
      return (
        <div>
          <canvas ref={myCanvas} />
        </div>
      );
    } catch {
      return <>An Error occoured. Check your syntax.</>;
    }
  }


export const officialSolutionLanguage = (
  solutionFile?: string,
  targetWidth?: number,
): { [key: string]: ComponentRenderer } => {
  return {
    official: ({ children }) =>
      useMemo(() => {
        return (
          <OfficialSolution
            // solutionFile={solutionFile}
            value={String(children).replace(/\n$/, "")}
            targetWidth={targetWidth}
          />
        );
      }, [children]),
  };
};

async function getUrl(
  url : string
){
  switch (url.split("/")[0].toLowerCase()) {
    case 'solution':
      return  await fetchGet(`/api/exam/pdf/solution/${url.split("/")[1]}/`) || null;
      break;
  
    case 'exam':
      return await fetchGet(`/api/exam/pdf/exam/${url.split("/")[1]}/`) || null;
      break;
    
    case 'document':
      return null // Not yet implemented, The api directly returns the file, while the other apis return a link to the file.
      // return  new Promise<string>((resolve, reject) => {
      //   return `/api/document/file/${url.split("/")[1]}`;   
      // });         
      break;
  
    default:
      return null;
      break;
  }
}

interface Props {
  value?: string | null;
  targetWidth?: number;
}

const OfficialSolution: React.FC<Props> = ({
  value,
  targetWidth,
}) => {

  const regx = new RegExp(
    /page: (\d+)\r?\nfrom-relative-coords: \((0.\d+|1), (0.\d+|1)\)\r?\nto-relative-coords: \((0.\d+|1), (0.\d+|1)\)\r?\nurl: (\S+)/,
  );

  if (value) {
    const match = value.match(regx);
    if (match) {
      const page = parseInt(match[1]); // Extract page number and convert it to integer
      if (page < 1) return <>Invalid Page</>;
      const p1: [number, number] = [
        parseFloat(match[2]),
        parseFloat(match[3]),
      ];
      const p2: [number, number] = [
        parseFloat(match[4]),
        parseFloat(match[5]),
      ];
      const url: string = match[6]
      const finalurl =  getUrl(url)
      
      if(finalurl == null){
        return <>Invalid Syntax</>;
      }
      
      return (
        <Tooltip label="Official Solution">
          {PdfRenderer(
            finalurl,
            {
              ref_page: page,
              p1,
              p2,
            },
            (targetWidth = targetWidth),
          )}
        </Tooltip>
      );
    }
  }
  return <>Invalid Syntax</>;
 
};

export default OfficialSolution;
