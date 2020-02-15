import { CutPosition } from "./interfaces";
import * as pdfjs from "pdfjs-dist/webpack";

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

  constructor(
    readonly pdf: pdfjs.PDFDocumentProxy,
    private targetWidth: number,
  ) {
    this.pdf = pdf;
  }

  destroy() {
    for (let i = 0; i < this.pdf.numPages; i++) {
      this.freePage(i);
    }
  }

  renderPage(page: number) {
    if (this.pages[page].isRendered) {
      this.freePage(page);
    }
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("failed to create context");
    }
    let pdfpage = this.pages[page].page;
    let viewport = pdfpage.getViewport({ scale: 1 });
    viewport = pdfpage.getViewport({
      scale: this.targetWidth / viewport.width,
    });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    pdfpage
      .render({
        canvasContext: context,
        viewport,
      })
      .promise.then(() => {
        this.pages[page].isRendered = true;
        this.pages[page].rendered = {
          canvas,
          context,
          viewport,
        };
        this.pages[page].renderFunctions.forEach(fct => {
          fct();
        });
      });
  }

  freePage(page: number) {
    const rendered = this.pages[page].rendered;
    if (rendered) {
      rendered.canvas.width = 0;
      rendered.canvas.height = 0;
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
    const page = start.page - 1;
    this.pages[page].renderFunctions.push(renderFunction);
    if (
      this.pages[page].renderFunctions.length === 1 &&
      !this.pages[page].isRendered
    ) {
      this.renderPage(page);
    }
  }

  removeVisible(start: CutPosition, renderFunction: Function) {
    const page = start.page - 1;
    this.pages[page].renderFunctions = this.pages[page].renderFunctions.filter(
      fct => fct !== renderFunction,
    );
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
    const { width: w, height: h } = viewport;
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
    const page = this.pages[start.page - 1].page;
    const src = SectionRenderer.sourceDimensions(
      page.getViewport({ scale: 1 }),
      start,
      end,
    );
    return { width, height: (src.h / src.w) * width };
  }

  render(target: RenderTarget, start: CutPosition, end: CutPosition) {
    const page = start.page - 1;
    const rendered = this.pages[page].rendered;
    if (!rendered) {
      return false;
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
    return true;
  }

  renderTextLayer(
    target: HTMLDivElement,
    canvas: HTMLCanvasElement,
    start: CutPosition,
    end: CutPosition,
    dpr: number,
  ) {
    const page = start.page - 1;
    const pdfpage = this.pages[page].page;

    // Locations of text divs are not scaled; only the canvas is scaled by dpr and then resized down again by dpr
    // via a style element. targetWidth is the size of the canvas, therefore we must resize the locations of the OCR
    // divs: scale down by dpr (divide by dpr)
    let viewport = pdfpage.getViewport({ scale: 1 });
    viewport = pdfpage.getViewport({
      scale: this.targetWidth / viewport.width / dpr,
    });
    const src = SectionRenderer.sourceDimensions(viewport, start, end);
    target.innerHTML = "";
    pdfpage.getTextContent().then(texts => {
      // tslint:disable-next-line:no-any
      const PDFJS = pdfjs as any;
      let divs: HTMLElement[] = [];
      PDFJS.renderTextLayer({
        textContent: texts,
        container: target,
        viewport: viewport,
        textDivs: divs,
      }).promise.then(() => {
        divs.forEach(div => {
          const top = parseFloat(div.style.top || "0");
          if (top < src.y || src.y + src.h < top) {
            if (div.parentElement) {
              div.parentElement.removeChild(div);
            }
          } else {
            div.style.top = top - src.y + "px";
          }
        });
      });
    });
  }

  /**
   * Optimize the position of the cut. If the line of the cut is "clean", it will try to have a
   * margin of 20 px to the closest text. If this is not possible, it will be placed in the middle.
   * If the cut position is "dirty", the next clean sections to the top and bottom will be located
   * and the larger of them will be taken. It is then handled as if the click was in this section.
   */
  optimizeCutPosition(page: number, relHeight: number): number {
    const rendered = this.pages[page].rendered;
    if (!this.pages[page].isRendered || !rendered) {
      return relHeight;
    }
    const width = rendered.canvas.width;
    const height = rendered.canvas.height;
    const clickedy = Math.ceil(height * relHeight);
    const desiredMargin = width / 60;

    const isPure = (y: number) => {
      const line = rendered.context.getImageData(0, y, width, 1).data;
      for (let i = 0; i < 4 * width; i++) {
        if (line[i] !== 255) {
          return false;
        }
      }
      return true;
    };

    let topPure = 0;
    let botPure = 0;

    if (isPure(clickedy)) {
      topPure = clickedy;
      botPure = clickedy;
      while (topPure > 0 && isPure(topPure - 1)) {
        topPure--;
      }
      while (botPure < height - 1 && isPure(botPure + 1)) {
        botPure++;
      }
    } else {
      let topBotPure = clickedy - 1;
      let botTopPure = clickedy + 1;
      while (topBotPure > 0 && !isPure(topBotPure)) {
        topBotPure--;
      }
      while (botTopPure < height - 1 && !isPure(botTopPure)) {
        botTopPure++;
      }
      let topTopPure = topBotPure;
      let botBotPure = botTopPure;

      while (topTopPure > 0 && isPure(topTopPure - 1)) {
        topTopPure--;
      }
      while (botBotPure < height - 1 && isPure(botBotPure + 1)) {
        botBotPure++;
      }

      if (topBotPure === topTopPure && botBotPure === botTopPure) {
        return relHeight;
      }

      if (topBotPure - topTopPure > botBotPure - botTopPure) {
        topPure = topTopPure;
        botPure = topBotPure;
      } else {
        topPure = botTopPure;
        botPure = botBotPure;
      }
    }

    if (botPure - topPure < 2 * desiredMargin) {
      return (botPure + topPure) / 2 / height;
    } else {
      return (topPure + desiredMargin) / height;
    }
  }
}

export async function createSectionRenderer(
  pdf: pdfjs.PDFDocumentProxy,
  targetWidth: number,
): Promise<SectionRenderer> {
  const renderer = new SectionRenderer(pdf, targetWidth);
  renderer.pages = [];
  for (let i = 0; i < pdf.numPages; i++) {
    renderer.pages.push({
      isRendered: false,
      renderFunctions: [],
      page: await pdf.getPage(i + 1),
    });
  }
  return renderer;
}
