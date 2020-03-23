import pdfjs, {
  PDFPageProxy,
  PDFDocumentProxy,
  PDFPromise,
  TextContent,
} from "./pdfjs";
export interface CanvasObject {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  user: number;
}
class CanvasFactory {
  private canvasArray: Array<CanvasObject> = [];
  private objectIndexMap: Map<CanvasObject, number> = new Map();
  private free: Set<number> = new Set();
  private nextId = 0;
  getFreeIndex(): number | undefined {
    for (const index of this.free) return index;
    return undefined;
  }
  create(width: number, height: number) {
    const index = this.getFreeIndex();
    if (index !== undefined) {
      const obj = this.canvasArray[index];
      this.free.delete(index);
      obj.canvas.width = width;
      obj.canvas.height = height;
      obj.user = this.nextId++;
      return obj;
    } else {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (context === null) throw new Error("Could not create canvas context.");
      const obj = { canvas, context, user: this.nextId++ };
      this.canvasArray.push(obj);
      this.objectIndexMap.set(obj, this.canvasArray.length - 1);
      return obj;
    }
  }
  reset(obj: CanvasObject, width: number, height: number) {
    if (!obj.canvas) {
      throw new Error("Canvas is not specified");
    }
    if (width <= 0 || height <= 0) {
      throw new Error("Invalid canvas size");
    }
    obj.canvas.width = width;
    obj.canvas.height = height;
  }
  destroy(obj: CanvasObject) {
    if (!obj.canvas) {
      throw new Error("Canvas is not specified");
    }
    obj.user = -1;
    const index = this.objectIndexMap.get(obj);
    if (index === undefined) return;
    this.free.add(index);
  }
}
const globalFactory = new CanvasFactory();
export class PdfCanvasReference {
  active: boolean;
  manager: PdfCanvasReferenceManager;
  private listeners: Array<() => void> = [];
  constructor(manager: PdfCanvasReferenceManager) {
    this.active = true;
    this.manager = manager;
  }
  addListener(fn: () => void) {
    this.listeners.push(fn);
  }
  release() {
    if (!this.active) return;
    this.manager.dec();
    for (const listener of this.listeners) listener();
    this.active = false;
  }
}
export class PdfCanvasReferenceManager {
  private refCount: number;
  private listeners: Array<(cnt: number) => void> = [];
  constructor(initialRefCount: number) {
    this.refCount = initialRefCount;
  }
  createRetainedRef(): PdfCanvasReference {
    this.inc();
    const ref = new PdfCanvasReference(this);
    return ref;
  }
  addListener(fn: (cnt: number) => void) {
    this.listeners.push(fn);
  }
  inc() {
    this.refCount++;
    for (const listener of this.listeners) {
      listener(this.refCount);
    }
  }
  dec() {
    this.refCount--;
    for (const listener of this.listeners) {
      listener(this.refCount);
    }
  }
}
export default class PDF {
  document: PDFDocumentProxy;
  page?: PDFPageProxy;
  pageMap: Map<number, PDFPromise<PDFPageProxy>> = new Map();
  // tslint:disable-next-line: no-any
  operatorListMap: Map<number, PDFPromise<any[]>> = new Map();
  // tslint:disable-next-line: no-any
  gfxMap: Map<number, any> = new Map();
  svgMap: Map<number, SVGElement> = new Map();
  embedFontsSvgMap: Map<number, SVGElement> = new Map();
  textMap: Map<number, PDFPromise<TextContent>> = new Map();
  mainCanvasMap: Map<
    number,
    Promise<
      [
        Promise<void>,
        CanvasObject,
        PdfCanvasReferenceManager,
        PdfCanvasReference,
      ]
    >
  > = new Map();
  mainCanvasScale: Map<number, number> = new Map();
  mainCanvasUsed: Map<number, boolean> = new Map();
  mainCanvasUser: Map<number, number> = new Map();
  mainCanvasUserSize: Map<number, number> = new Map();
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
  async getOperatorList(pageNumber: number): Promise<any[]> {
    const cachedOperatorList = this.operatorListMap.get(pageNumber);
    if (cachedOperatorList !== undefined) return cachedOperatorList;
    const page = await this.getPage(pageNumber);
    // tslint:disable-next-line: no-any
    const operatorList = (page as any).getOperatorList();
    this.operatorListMap.set(pageNumber, operatorList);
    return operatorList;
  }
  // tslint:disable-next-line: no-any
  async getGfx(pageNumber: number): Promise<any> {
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
  async renderSvg(
    pageNumber: number,
    embedFonts: boolean,
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
  async renderCanvas(
    pageNumber: number,
    scale: number,
  ): Promise<[CanvasObject, Promise<void>]> {
    const page = await this.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const obj = globalFactory.create(viewport.width, viewport.height);
    const me = obj.user;
    obj.canvas.style.width = "100%";
    obj.canvas.style.height = "100%";
    const canvasContext = obj.canvas.getContext("2d");
    if (canvasContext === null) throw new Error("Rendering failed.");
    return [
      obj,
      new Promise((resolve, reject) => {
        if (obj.user === me) {
          page
            .render(({
              canvasContext,
              viewport,
              canvasFactory: globalFactory,
            } as unknown) as any)
            .promise.then(
              () => resolve(),
              () => reject(),
            );
        } else {
          resolve();
        }
      }),
    ];
  }
  async getMainCanvas(
    pageNumber: number,
    scale: number,
  ): Promise<
    [Promise<void>, CanvasObject, PdfCanvasReferenceManager, PdfCanvasReference]
  > {
    const obj = this.renderCanvas(pageNumber, scale);
    this.mainCanvasScale.set(pageNumber, scale);
    const refManager = new PdfCanvasReferenceManager(0);
    const ref = refManager.createRetainedRef();
    const promise = new Promise<
      [
        Promise<void>,
        CanvasObject,
        PdfCanvasReferenceManager,
        PdfCanvasReference,
      ]
    >((resolve, reject) =>
      obj.then(
        ([obj, renderPromise]) => {
          resolve([renderPromise, obj, refManager, ref]);
        },
        e => reject(e),
      ),
    );
    refManager.addListener((cnt: number) => {
      if (cnt <= 0) {
        (async () => {
          try {
            const [canvasObject] = await obj;
            globalFactory.destroy(canvasObject);
          } catch (e) {
            return;
          }
        })();
      }
    });
    return promise;
  }

  private nextId: number = 1;
  async renderCanvasSplit(
    pageNumber: number,
    scale: number,
    start: number,
    end: number,
  ): Promise<[HTMLCanvasElement, boolean, PdfCanvasReference]> {
    const requestId = this.nextId++;
    const mainCanvasUsed = this.mainCanvasUsed.get(pageNumber) || false;
    const mainCanvasUserSize = this.mainCanvasUserSize.get(pageNumber) || 0;
    if (!mainCanvasUsed && mainCanvasUserSize < end - start) {
      this.mainCanvasUser.set(pageNumber, requestId);
      this.mainCanvasUserSize.set(pageNumber, end - start);
    }
    const [
      renderPromise,
      mainCanvas,
      maniCanvasRefManager,
      mainCanvasRef,
    ] = await this.getMainCanvas(pageNumber, scale);
    const user = this.mainCanvasUser.get(pageNumber);
    if (user !== undefined && user === requestId) {
      this.mainCanvasUsed.set(pageNumber, true);
      return [mainCanvas.canvas, true, mainCanvasRef];
    } else {
      const mainRef = maniCanvasRefManager.createRetainedRef();
      const [page] = await Promise.all([
        this.getPage(pageNumber),
        renderPromise,
      ]);
      const viewport = page.getViewport({ scale });
      const width = viewport.width;
      const height = viewport.height * (end - start);
      const obj = globalFactory.create(width, height);
      obj.canvas.style.width = "100%";
      obj.canvas.style.height = "100%";
      const [sx, sy, sw, sh] = [
        0,
        mainCanvas.canvas.height * start,
        mainCanvas.canvas.width,
        (end - start) * mainCanvas.canvas.height,
      ];
      const [dx, dy, dw, dh] = [0, 0, width, height];
      const ctx = obj.context;
      if (ctx === null) throw new Error("Redering failed.");
      ctx.drawImage(mainCanvas.canvas, sx, sy, sw, sh, dx, dy, dw, dh);
      ctx.fillStyle = "red";
      ctx.fillRect(0, 0, 30, 30);
      const newManager = new PdfCanvasReferenceManager(0);
      const childRef = newManager.createRetainedRef();

      newManager.addListener((cnt: number) => {
        if (cnt <= 0) {
          mainRef.release();
          globalFactory.destroy(obj);
        }
      });

      return [obj.canvas, false, childRef];
    }
  }
  async renderText(pageNumber: number): Promise<TextContent> {
    const cachedPromise = this.textMap.get(pageNumber);
    if (cachedPromise !== undefined) return cachedPromise;
    const page = await this.getPage(pageNumber);
    const contentPromise = page.getTextContent();
    this.textMap.set(pageNumber, contentPromise);
    return contentPromise;
  }
}
