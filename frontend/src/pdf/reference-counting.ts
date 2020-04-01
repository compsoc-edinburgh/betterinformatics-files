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
