import { CutPosition } from "./interfaces";
import * as pdfjs from "pdfjs-dist";
import { times } from "lodash";

interface RenderTarget {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
}

export class DocumentRenderer {
  renderedPages?: {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    proxy: pdfjs.PDFPageProxy;
  }[];

  constructor(private pdf: pdfjs.PDFDocumentProxy) {
    this.pdf = pdf;
  }

  async render(): Promise<undefined> {
    this.renderedPages = await Promise.all(
      times(this.pdf.numPages, async i => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("failed to create context");
        }
        const page = await this.pdf.getPage(i + 1);
        const proxy = await page.render({ canvasContext: context });
        return { canvas, context, proxy };
      }),
    );
    return undefined;
  }

  renderSection(target: RenderTarget, start: CutPosition, end: CutPosition) {
    if (!this.renderedPages) {
      throw new Error("must call render() first");
    }
    if (start.page !== end.page) {
      throw new Error("start and end must be on the same page");
    }
    const page = this.renderedPages[start.page - 1];
    if (!page) {
      throw new Error("page out of range");
    }
    const full = {
      x1: page.proxy.view[0],
      y1: page.proxy.view[1],
      x2: page.proxy.view[2],
      y2: page.proxy.view[3],
    };
    const src = {
      x: Math.floor(full.x1),
      y: Math.floor(full.y1 + (full.y2 - full.y1) * start.position),
      w: Math.floor(full.x2 - full.x1),
      h: Math.floor((full.y2 - full.y1) * (end.position - start.position)),
    };
    const dst = {
      x: 0,
      y: 0,
      w: target.width,
      h: target.height,
    };
    target.context.drawImage(
      page.canvas,
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
