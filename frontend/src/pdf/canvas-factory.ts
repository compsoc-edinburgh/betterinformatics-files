import { CanvasObject } from "./utils";
/**
 * A CanvasFactory that is compatible with pdf-js but reuses old `CanvasObjects`.
 * Pass an instance to pdf-js while rendering. Each instance manages a collection of
 * `CanvasObject`s that "belong" to that instance. Passing an unrelated `CanvasObject`
 * is undefined behavior and will most likely result in no action.
 */
export class CanvasFactory {
  private canvasArray: Array<CanvasObject> = [];
  private objectIndexMap: Map<CanvasObject, number> = new Map();
  private free: Set<number> = new Set();
  /**
   * Return an index of a free `CanvasObject` if one is available.
   */
  private getFreeIndex(): number | undefined {
    // The for loop stops at the first iteration but this saves us from
    // converting the iterator to an array
    for (const index of this.free) return index;
    return undefined;
  }
  /**
   * Returns a free `CanvasObject` or creates a new one if none is free.
   * If you don't pass width and height the caller is responsible for setting
   * them and this method is allowed to return a `CanvasObject` of arbitrary size.
   * @param width
   * @param height
   */
  create(width: number | undefined, height: number | undefined) {
    const index = this.getFreeIndex();
    if (index !== undefined) {
      const obj = this.canvasArray[index];
      this.free.delete(index);
      obj.context.setTransform(1, 0, 0, 1, 0, 0);
      // We only need to clear when the size doesn't change otherwise
      // the content is cleared automatically
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
      // It looks like we have to create a new instance...
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
  /**
   * This is the pdf-js interface for reusing `CanvasObject`s
   * @param obj
   * @param width
   * @param height
   */
  reset(obj: CanvasObject, width: number, height: number) {
    if (!obj.canvas) {
      throw new Error("Canvas is not specified");
    }
    obj.context.setTransform(1, 0, 0, 1, 0, 0);
    if (width <= 0 || height <= 0) {
      throw new Error("Invalid canvas size");
    }
    obj.canvas.width = width;
    obj.canvas.height = height;
  }
  /**
   * Call this method if you no longer need the specified `CanvasObject`.
   * Does nothing if the `CanvasObject`is not managed by this instance of
   * `CanvasFactory`.
   * @param obj
   */
  public destroy(obj: CanvasObject) {
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
/**
 * The global canvas factory instance. You should use this one if you don't have
 * any good reason not to use it.
 */
export const globalFactory = new CanvasFactory();
