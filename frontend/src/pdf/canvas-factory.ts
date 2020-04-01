import { CanvasObject } from "./utils";

export class CanvasFactory {
  private canvasArray: Array<CanvasObject> = [];
  private objectIndexMap: Map<CanvasObject, number> = new Map();
  private free: Set<number> = new Set();
  getFreeIndex(): number | undefined {
    for (const index of this.free) return index;
    return undefined;
  }
  create(width: number | undefined, height: number | undefined) {
    const index = this.getFreeIndex();
    if (index !== undefined) {
      const obj = this.canvasArray[index];
      this.free.delete(index);
      if (
        (width === undefined || width === obj.canvas.width) &&
        (height === undefined || height === obj.canvas.height)
      ) {
        const context = obj.context;
        context.clearRect(0, 0, obj.canvas.width, obj.canvas.height);
      }
      if (width) obj.canvas.width = width;
      if (height) obj.canvas.height = height;
      return obj;
    } else {
      const canvas = document.createElement("canvas");
      if (width) canvas.width = width;
      if (height) canvas.height = height;
      const context = canvas.getContext("2d");
      if (context === null) throw new Error("Could not create canvas context.");
      const obj = { canvas, context };
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
    obj.canvas.height = 0;
    obj.canvas.width = 0;
    const index = this.objectIndexMap.get(obj);
    if (index === undefined) return;
    this.free.add(index);
  }
}
export const globalFactory = new CanvasFactory();
