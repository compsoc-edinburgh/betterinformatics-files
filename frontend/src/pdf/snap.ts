import { getPixel } from "./utils";

interface SnapRegion {
  start: number;
  end: number;
  snapPoints: number[];
}
export const determineOptimalCutPositions = (
  canvas: HTMLCanvasElement,
  start: number,
  end: number,
  isMain: boolean,
  {
    minRegionSize = 0.005,
    bigSnapRegionPadding = 0.01,
    bigSnapRegionMinSize = 0.1,
  } = {},
): SnapRegion[] => {
  const s: Array<SnapRegion> = [];
  const handler = (a: number, b: number, isLast: boolean = false) => {
    const size = (b - a) * (end - start);
    if (size > minRegionSize) {
      const sectionEnd = b;
      if (a !== 0) {
        const snapPoints: number[] = [];
        if (size > bigSnapRegionMinSize) {
          snapPoints.push(a + bigSnapRegionPadding * (end - start));
          if (!(isLast && end === 1))
            snapPoints.push(sectionEnd - bigSnapRegionPadding * (end - start));
        } else {
          if (!isLast) snapPoints.push((a + sectionEnd) / 2);
        }
        if (isLast && end === 1) snapPoints.push(1);
        s.push({
          start: a,
          end: sectionEnd,
          snapPoints,
        });
      }
    }
  };
  const context = canvas.getContext("2d");
  if (context === null) return s;
  const [sx, sy, sw, sh] = isMain
    ? [
        0,
        (canvas.height * start) | 0,
        canvas.width,
        (canvas.height * (end - start)) | 0,
      ]
    : [0, 0, canvas.width, canvas.height];
  if (sh === 0) return s;
  const imageData = context.getImageData(sx, sy, sw, sh);

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
    } else if (sectionStart !== undefined) {
      handler(sectionStart, y / imageData.height);
      sectionStart = undefined;
    }
  }
  if (sectionStart !== undefined) {
    handler(sectionStart, 1, true);
  }
  return s;
};
