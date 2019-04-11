import {CutPosition} from "./interfaces";
import * as pdfjs from "pdfjs-dist";

interface RenderTarget {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
}

interface PageProxy {
  isRendered: boolean;
  renderFunctions: Function[];
  page: pdfjs.PDFPageProxy;
  rendered?: RenderedPage;
}

interface RenderedPage {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  viewport: pdfjs.PDFPageViewport;
}

export interface Dimensions {
  width: number;
  height: number;
}

interface StartSizeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class SectionRenderer {

  pages: PageProxy[];

  constructor(readonly pdf: pdfjs.PDFDocumentProxy, private targetWidth: number) {
    this.pdf = pdf;
  }

  private renderPage(page: number) {
    if (this.pages[page].isRendered) {
      this.freePage(page);
    }
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("failed to create context");
    }
    let pdfpage = this.pages[page].page;
    let viewport = pdfpage.getViewport(1);
    viewport = pdfpage.getViewport(this.targetWidth / viewport.width);
    canvas.width = viewport.width;
    canvas.height = viewport.height;
      pdfpage.render({
      canvasContext: context,
      viewport,
    }).then(() => {
      this.pages[page].isRendered = true;
      this.pages[page].rendered = {
        canvas, context, viewport
      };
      this.pages[page].renderFunctions.forEach(fct => {
        fct();
      });
    });
  }

  private freePage(page: number) {
    const rendered = this.pages[page].rendered;
    if (rendered) {
      rendered.canvas.remove();
      this.pages[page].rendered = undefined;
      this.pages[page].isRendered = false;
    }
  }

  setTargetWidth(width: number) {
    if (width !== this.targetWidth) {
      this.targetWidth = width;
      this.pages.forEach((page, idx) => {
        if (page.renderFunctions.length > 0) {
          this.renderPage(idx);
        } else {
          this.freePage(idx);
        }
      });
    }
  }

  addVisible(start: CutPosition, renderFunction: Function) {
    const page = start.page-1;
    this.pages[page].renderFunctions.push(renderFunction);
    if (this.pages[page].renderFunctions.length === 1 && !this.pages[page].isRendered) {
      this.renderPage(page);
    } else {
      renderFunction();
    }
  }

  removeVisible(start: CutPosition, renderFunction: Function) {
    const page = start.page-1;
    this.pages[page].renderFunctions = this.pages[page].renderFunctions.filter(fct => fct !== renderFunction);
    /*
    It seems like we can not save much memory, but the CPU usage is much higher if we destroy stuff.
    if (this.pages[page].renderFunctions.length === 0) {
      this.freePage(page);
    }
     */
  }

  // calculate the size in the source document of the given section (start <-> end)
  static sourceDimensions(
    viewport: pdfjs.PDFPageViewport,
    start: CutPosition,
    end: CutPosition,
  ): StartSizeRect {
    const {width: w, height: h} = viewport;
    return {
      x: Math.floor(0),
      y: Math.floor(h * start.position),
      w: Math.floor(w),
      h: Math.floor(h * (end.position - start.position)),
    };
  }

  // calculate the required size of the canvas which is going to render a section (start <-> end)
  sectionDimensions(
    start: CutPosition,
    end: CutPosition,
    width: number,
  ): Dimensions {
    const page = this.pages[start.page-1].page;
    const src = SectionRenderer.sourceDimensions(page.getViewport(1), start, end);
    return {width, height: src.h / src.w * width};
  }

  render(target: RenderTarget, start: CutPosition, end: CutPosition) {
    const page = start.page-1;
    const rendered = this.pages[page].rendered;
    if (!rendered) {
      return;
    }
    const src = SectionRenderer.sourceDimensions(rendered.viewport, start, end);
    const dst = {
      x: 0,
      y: 0,
      w: target.width,
      h: target.height,
    };
    target.context.drawImage(
      rendered.canvas,
      src.x,
      src.y,
      src.w,
      src.h,
      dst.x,
      dst.y,
      dst.w,
      dst.h,
    );
  }
}

export async function createSectionRenderer(pdf: pdfjs.PDFDocumentProxy, targetWidth: number): Promise<SectionRenderer> {
  const renderer = new SectionRenderer(pdf, targetWidth);
  renderer.pages = [];
  for(let i = 0; i < pdf.numPages; i++) {
    renderer.pages.push({
      isRendered: false,
      renderFunctions: [],
      page: await pdf.getPage(i+1),
    });
  }
  return renderer;
}