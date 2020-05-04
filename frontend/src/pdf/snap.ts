import { getPixel } from "./utils";
/**
 * A single SnapRegion can consist of multiple `snapPoints`. The coordinates are relative
 * to start and end of a section. That means that a `SnapRegion(start: 0, end: 1)` in a
 * section 0-0.5 would span 0-0.5 in the page coordinate system.
 */
interface SnapRegion {
  start: number;
  end: number;
  snapPoints: number[];
}
/**
 * Given a canvas this function determines where a cut would be good. It does this
 * by detecting "clean regions" - regions where every pixel in a row has the same
 * color. This means that
 * ```
 * rrrrr
 * ggggg
 * bbbbb
 * ```
 * is a single "clean" region but `rgrrrrr` is not.
 *
 * There are two types of `SnapRegion`s: big ones and small ones. Big ones have
 * snapPoint at the start and at the end suggesting that the area could be hidden.
 *
 * @param canvas
 * @param start
 * @param end
 * @param isMain
 * @param options
 */
export const determineOptimalCutPositions = (
  canvas: HTMLCanvasElement,
  start: number,
  end: number,
  isMain: boolean,
  {
    minRegionSize = 0.01,
    bigSnapRegionPadding = 0.02,
    bigSnapRegionMinSize = 0.07,
  } = {},
): SnapRegion[] => {
  const s: Array<SnapRegion> = [];
  /**
   * @param a The start of the clean region
   * @param b Te end of the clean region
   * @param isLast Wether the region is the last region in the section
   */
  const handler = (a: number, b: number, isLast: boolean = false) => {
    /**
     * Size of the `SnapRegion` in the page coordinate system.
     */
    const size = (b - a) * (end - start);
    if (size > minRegionSize) {
      const snapPoints: number[] = [];
      // There is no snapPoint at the beginning of a section. But it's still a
      // snapRegion we need to add.
      if (a !== 0) {
        if (size > bigSnapRegionMinSize) {
          snapPoints.push(a + bigSnapRegionPadding / (end - start));
          if (!(isLast && end === 1))
            snapPoints.push(b - bigSnapRegionPadding / (end - start));
        } else {
          if (!isLast) snapPoints.push((a + b) / 2);
        }
        // There is always a snapPoint at the end of each page if the last row is
        // "clean". The `isLast` check shouldn't be necessary, but prevents weird
        // snapPoints when end is set incorrectly.
        if (isLast && end === 1) snapPoints.push(1);
        s.push({
          start: a,
          end: b,
          snapPoints,
        });
      } else {
        if (size > bigSnapRegionMinSize) {
          if (!(isLast && end === 1))
            snapPoints.push(b - bigSnapRegionPadding / (end - start));
        }
        s.push({
          start: a,
          end: b,
          snapPoints,
        });
      }
    }
  };
  const context = canvas.getContext("2d");
  if (context === null) return s;
  // Determine coordinates based on wether the canvas is a main canvas.
  const [sx, sy, sw, sh] = isMain
    ? [
        0,
        (canvas.height * start) | 0,
        canvas.width,
        (canvas.height * (end - start)) | 0,
      ]
    : [0, 0, canvas.width, canvas.height];
  // No work to do - will always return an empty array but there is no need to create
  // a new array for that.
  if (sh === 0) return s;
  const imageData = context.getImageData(sx, sy, sw, sh);
  /**
   * The section relative position at which the current clean section started.
   */
  let sectionStart: number | undefined;
  for (let y = 0; y < imageData.height; y++) {
    if (imageData.width === 0) continue;
    let clean = true;
    const [rowR, rowG, rowB, rowA] = getPixel(imageData, 0, y);
    for (let x = 1; x < imageData.width; x++) {
      const [r, g, b, a] = getPixel(imageData, x, y);
      if (r !== rowR || g !== rowG || b !== rowB || a !== rowA) {
        clean = false;
        break;
      }
    }
    if (clean) {
      if (sectionStart === undefined) {
        sectionStart = y / imageData.height;
      }
    } else {
      if (sectionStart !== undefined) {
        handler(sectionStart, y / imageData.height);
      }
      sectionStart = undefined;
    }
  }
  // If the last row is "clean" we have to add that section as well.
  if (sectionStart !== undefined) {
    handler(sectionStart, 1, true);
  }
  return s;
};
