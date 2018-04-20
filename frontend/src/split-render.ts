import { CutPosition } from "./interfaces";
import * as pdfjs from "pdfjs-dist";
import { times } from "lodash";

interface RenderTarget {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
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

function sourceDimensions(
  page: RenderedPage,
  start: CutPosition,
  end: CutPosition,
): StartSizeRect {
  const { width: w, height: h } = page.viewport;
  return {
    x: Math.floor(0),
    y: Math.floor(h * start.position),
    w: Math.floor(w),
    h: Math.floor(h * (end.position - start.position)),
  };
}

export class SectionRenderer {
  constructor(private renderedPages: RenderedPage[]) {
    this.renderedPages = renderedPages;
  }

  private getPage(start: CutPosition, end: CutPosition): RenderedPage {
    if (start.page !== end.page) {
      throw new Error("start and end must be on the same page");
    }
    const page = this.renderedPages[start.page - 1];
    if (!page) {
      throw new Error("page out of range");
    }
    return page;
  }

  sectionDimensions(
    start: CutPosition,
    end: CutPosition,
    width: number,
  ): Dimensions {
    const page = this.getPage(start, end);
    const src = sourceDimensions(page, start, end);
    return { width, height: src.h / src.w * width };
  }

  render(target: RenderTarget, start: CutPosition, end: CutPosition) {
    const page = this.getPage(start, end);
    const src = sourceDimensions(page, start, end);
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

export async function renderDocument(
  pdf: pdfjs.PDFDocumentProxy,
  targetWidth: number,
): Promise<SectionRenderer> {
  const rendered = await Promise.all(
    times(pdf.numPages, async i => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("failed to create context");
      }
      const page = await pdf.getPage(i + 1);
      let viewport = page.getViewport(1);
      viewport = page.getViewport(targetWidth / viewport.width);
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport });
      return { canvas, context, viewport };
    }),
  );
  return new SectionRenderer(rendered);
}
