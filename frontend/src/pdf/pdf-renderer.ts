import * as pdfjs from "./pdfjs";
import { globalFactory } from "./canvas-factory";
import {
  PdfCanvasReference,
  PdfCanvasReferenceManager,
} from "./reference-counting";
import { CanvasObject } from "./utils";
import {
  PDFDocumentProxy,
  PDFPageProxy,
  TextContent,
} from "pdfjs-dist/types/src/display/api";

interface MainCanvasPageLoadedData {
  width: number;
  height: number;
}
/**
 * Each page has one main canvas that pdf-js renders to. This interface
 * describes the data that is associated with such a canvas. Please notice
 * that is not guaranteed that the content is rendered until the `rendered`
 * Promie is resolved. The `pageLoaded` promise is guaranteed to always resolve
 * before `rendered` is resolved.
 */
interface MainCanvas {
  scale: number;
  currentMainRef: PdfCanvasReference | undefined;
  canvasObject: CanvasObject;
  referenceManager: PdfCanvasReferenceManager;
  pageLoaded: Promise<MainCanvasPageLoadedData>;
  rendered: Promise<void>;
}
/**
 * The PDF class represents our rendering layer on top of pdf-js. It's a renderer
 * that only renders its `PDFDocumentProxy`. Loading a `PDFDocumentProxy`
 * is the responsibility of the caller.
 */
export default class PDF {
  document: PDFDocumentProxy;
  private pageMap: Map<number, Promise<PDFPageProxy>> = new Map();
  // SVGs aren't mentioned in pdf-js types :(
  // tslint:disable-next-line: no-any
  private operatorListMap: Map<number, Promise<any[]>> = new Map();
  // tslint:disable-next-line: no-any
  private gfxMap: Map<number, any> = new Map();
  private svgMap: Map<number, SVGElement> = new Map();
  private embedFontsSvgMap: Map<number, SVGElement> = new Map();
  private textMap: Map<number, Promise<TextContent>> = new Map();
  /**
   * Each `Set` once set shouldn't change anymore as it saves us from having to lookup
   * again. You therefore need to clear each set if you want to remove all references.
   */
  private mainCanvasMap: Map<number, Set<MainCanvas>> = new Map();
  constructor(document: PDFDocumentProxy) {
    this.document = document;
  }
  async getPage(pageNumber: number): Promise<PDFPageProxy> {
    const cachedPage = this.pageMap.get(pageNumber);
    if (cachedPage !== undefined) return cachedPage;

    const loadedPage = this.document.getPage(pageNumber);
    this.pageMap.set(pageNumber, loadedPage);
    return loadedPage;
  }
  // tslint:disable-next-line: no-any
  private async getOperatorList(pageNumber: number): Promise<any[]> {
    const cachedOperatorList = this.operatorListMap.get(pageNumber);
    if (cachedOperatorList !== undefined) return cachedOperatorList;
    const page = await this.getPage(pageNumber);
    // tslint:disable-next-line: no-any
    const operatorList = (page as any).getOperatorList();
    this.operatorListMap.set(pageNumber, operatorList);
    return operatorList;
  }
  // tslint:disable-next-line: no-any
  private async getGfx(pageNumber: number): Promise<any> {
    const cachedGfx = this.gfxMap.get(pageNumber);
    if (cachedGfx !== undefined) return cachedGfx;

    const page = await this.getPage(pageNumber);
    // tslint:disable-next-line: no-any
    const gfx = new (pdfjs as any).SVGGraphics(
      // tslint:disable-next-line: no-any
      (page as any).commonObjs,
      // tslint:disable-next-line: no-any
      (page as any).objs,
    );
    this.gfxMap.set(pageNumber, gfx);
    return gfx;
  }
  /**
   * Renders the page `pageNumber` to an SVGElement. The returned instance will
   * be unique and the caller is free to mount it anywhere in the tree.
   * @param pageNumber
   * @param embedFonts Wheter the fonts should be embedded into the SVG
   */
  async renderSvg(
    pageNumber: number,
    embedFonts: boolean = false,
  ): Promise<SVGElement> {
    if (embedFonts) {
      const cachedSvg = this.embedFontsSvgMap.get(pageNumber);
      if (cachedSvg !== undefined)
        return cachedSvg.cloneNode(true) as SVGElement;
    } else {
      const cachedSvg = this.svgMap.get(pageNumber);
      if (cachedSvg !== undefined)
        return cachedSvg.cloneNode(true) as SVGElement;
    }
    const page = await this.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const operatorList = await this.getOperatorList(pageNumber);
    const gfx = await this.getGfx(pageNumber);
    gfx.embedFonts = embedFonts;
    const element = await gfx.getSVG(operatorList, viewport);
    if (embedFonts) {
      this.embedFontsSvgMap.set(pageNumber, element);
    } else {
      this.svgMap.set(pageNumber, element);
    }

    return element;
  }
  /**
   * Renders the page `pageNumber` to `canvasObject` with a scale of
   * `scale`. Creates a reference using `referenceManager` that is active
   * until rendering is finished. It expects that `canvasObject` is not
   * reused until the reference is released. The method also sets the
   * `width` and `height` of the `canvasObject`.
   * @param referenceManager
   * @param canvasObject
   * @param pageNumber
   * @param scale
   * @returns two promises:
   * [0]: when the page is loaded,
   * [1]: when the page is rendered
   */
  renderCanvas(
    referenceManager: PdfCanvasReferenceManager,
    canvasObject: CanvasObject,
    pageNumber: number,
    scale: number,
  ): [Promise<void>, Promise<void>] {
    const renderingReference = referenceManager.createRetainedRef();
    const pagePromise = this.getPage(pageNumber);
    const renderingPromise = (async () => {
      const page = await pagePromise;
      const viewport = page.getViewport({ scale });
      canvasObject.canvas.width = viewport.width;
      canvasObject.canvas.height = viewport.height;
      canvasObject.canvas.style.width = "100%";
      canvasObject.canvas.style.height = "100%";
      // we need the `as unknown as any` because the types don't specify the
      // `canvasFactory` and typescript would complain.
      await page.render({
        canvasContext: canvasObject.context,
        viewport,
        canvasFactory: globalFactory,
      } as unknown as any).promise;
      renderingReference.release();
    })();

    return [
      (async () => {
        await pagePromise;
      })(),
      renderingPromise,
    ];
  }
  /**
   * Creates a new mainCanvas for `pageNumber` and renders the page to it.
   * The `MainCanvas` object contains all the necessary data.
   * @param pageNumber
   * @param scale
   */
  private createMainCanvas(pageNumber: number, scale: number): MainCanvas {
    const canvasObject = globalFactory.create(undefined, undefined);
    const referenceManager = new PdfCanvasReferenceManager(0);
    const initialRef = referenceManager.createRetainedRef();
    const [loadPromise, renderingPromise] = this.renderCanvas(
      referenceManager,
      canvasObject,
      pageNumber,
      scale,
    );
    const mainCanvas: MainCanvas = {
      scale,
      currentMainRef: initialRef,
      canvasObject,
      referenceManager,
      pageLoaded: (async () => {
        await loadPromise;
        return {
          width: canvasObject.canvas.width,
          height: canvasObject.canvas.height,
        };
      })(),
      rendered: renderingPromise,
    };
    // Add the mainCanvas to the correct set
    const existingSet = this.mainCanvasMap.get(pageNumber);
    const newSet = new Set([mainCanvas]);
    const mainCanvasSet = existingSet || newSet;
    if (existingSet) {
      existingSet.add(mainCanvas);
    } else {
      this.mainCanvasMap.set(pageNumber, newSet);
    }
    // Remove it if we no longer need it
    let timeout: number | undefined;
    initialRef.addListener(() => {
      mainCanvas.currentMainRef = undefined;
    });
    referenceManager.addListener((cnt: number) => {
      if (cnt <= 0) {
        // We keep the mainCanvas around a bit so that it can be reused.
        // 10_000 turned out to be a decent value.
        timeout = window.setTimeout(() => {
          globalFactory.destroy(canvasObject);
          mainCanvasSet.delete(mainCanvas);
        }, 10000);
      } else {
        // If the reference is used again we abort its removal.
        if (timeout) window.clearTimeout(timeout);
        timeout = undefined;
      }
    });
    return mainCanvas;
  }
  /**
   * Renders `pageNumber` from `start` to `end` using at least `scale`.
   * It returns a promise that resolves when the content is rendered. The method
   * can either return a main canvas or just the specified section. If a main
   * canvas is returned you are responsible for aligning it correctly. It assumes
   * that scaling a canvas down doesn't reduce the quality. You are also responsible
   * for releasing the retained reference that gets returned. There is no guarantee
   * the size of the the canvas that the promise resolves to. It's aspect ratio will
   * match the aspect ration of the pdf page if the canvas is a main canvas. Otherwise
   * the aspect ratio will match the aspect ratio of the section.
   * @param pageNumber
   * @param scale Minimum scale
   * @param start Relative y-start on page
   * @param end Relative y-end on page
   * @returns A promise resolving to an array:
   * [0]: The canvas,
   * [1]: Wether the canvas is a main canvas,
   * [2]: The reference you have to release if you no longer need the canvas.
   */
  async renderCanvasSplit(
    pageNumber: number,
    scale: number,
    start: number,
    end: number,
  ): Promise<[HTMLCanvasElement, boolean, PdfCanvasReference]> {
    const mainCanvasSet = this.mainCanvasMap.get(pageNumber);
    let mainCanvas: MainCanvas | undefined;
    let isMainUser = false;
    if (mainCanvasSet) {
      for (const existingMainCanvas of mainCanvasSet) {
        if (
          // We allow slightly main canvas with a slightly smaller size. This
          // might not be the best way to
          existingMainCanvas.scale + 0.001 >= scale &&
          // It might be possible that there is a main canvas that is suitable
          // and currently has no use. Prefer to use that one instead.
          (mainCanvas === undefined || mainCanvas.currentMainRef !== undefined)
        ) {
          mainCanvas = existingMainCanvas;
        }
      }
      // Did we find a main canvas that isn't used?
      if (mainCanvas && mainCanvas.currentMainRef === undefined) {
        isMainUser = true;
        mainCanvas.currentMainRef =
          mainCanvas?.referenceManager.createRetainedRef();
      }
    }
    // It looks like we have to render from scratch
    if (mainCanvas === undefined) {
      mainCanvas = this.createMainCanvas(pageNumber, scale);
      isMainUser = true;
    }
    // This isn't possible but it's hard to tell typescript that it is not
    // possible.
    if (mainCanvas === undefined) throw new Error();
    const ref = isMainUser
      ? mainCanvas.currentMainRef!
      : mainCanvas.referenceManager.createRetainedRef();

    if (isMainUser) {
      ref.addListener(() => {
        // Typescript still thinks that mainCanvas could be undefined...
        if (mainCanvas === undefined) throw new Error();
        mainCanvas.currentMainRef = undefined;
      });
      // Wait until rendering is finished (needed for snap location detection)
      await mainCanvas.rendered;
      return [mainCanvas.canvasObject.canvas, true, ref];
    } else {
      // It should also be possible to await mainCanvas.pageLoaded first
      // but it doesn't really matter.
      const [pageSize, page] = await Promise.all([
        mainCanvas.pageLoaded,
        this.getPage(pageNumber),
      ]);
      const viewport = page.getViewport({ scale });
      const width = viewport.width;
      const height = viewport.height * (end - start);
      const obj = globalFactory.create(width, height);
      const newManager = new PdfCanvasReferenceManager(0);
      const childRef = newManager.createRetainedRef();
      obj.canvas.style.width = "100%";
      obj.canvas.style.height = "100%";
      //source
      const [sx, sy, sw, sh] = [
        0,
        pageSize.height * start,
        pageSize.width,
        (end - start) * pageSize.height,
      ];
      // destination
      const [dx, dy, dw, dh] = [0, 0, width, height];
      const renderingReference = newManager.createRetainedRef();
      mainCanvas.rendered.then(() => {
        const ctx = obj.context;
        if (ctx === null) throw new Error("Rendering failed.");
        if (mainCanvas === undefined) throw new Error();
        ctx.drawImage(
          mainCanvas.canvasObject.canvas,
          sx,
          sy,
          sw,
          sh,
          dx,
          dy,
          dw,
          dh,
        );
        renderingReference.release();
      });

      newManager.addListener((cnt: number) => {
        if (cnt <= 0) {
          ref.release();
          globalFactory.destroy(obj);
        }
      });

      return [obj.canvas, false, childRef];
    }
  }
  /**
   * Renders the text layer of the specified `pageNumber`
   * @param pageNumber
   */
  async renderText(pageNumber: number): Promise<TextContent> {
    const cachedPromise = this.textMap.get(pageNumber);
    if (cachedPromise !== undefined) return cachedPromise;
    const page = await this.getPage(pageNumber);
    const contentPromise = page.getTextContent();
    this.textMap.set(pageNumber, contentPromise);
    return contentPromise;
  }
}
