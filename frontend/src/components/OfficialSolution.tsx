import { PDFDocumentProxy } from 'pdfjs-dist';
import PDF from '../pdf/pdf-renderer';
import { getDocument } from '../pdf/pdfjs';


export default async function OfficialSolution(){

    let pdfprox = getDocument({
        url: "https://ethz.ch/content/dam/ethz/main/education/bachelor/studiengaenge/files/ETH-Zurich-Degree-programmes.pdf",
        disableStream: true,
        disableAutoFetch: true,
      })
    
    let renderer = new PDF(pdfprox)
    // Promise<[HTMLCanvasElement, boolean, PdfCanvasReference]
    let [ret , bo, pdfcanv] = await renderer.renderCanvasSplit(1,1,0.4,0.8)
    return ret

  
}

