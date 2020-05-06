export interface CanvasObject {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
}
export const getPixel = (imageData: ImageData, x: number, y: number) => {
  const startIndex = y * (imageData.width * 4) + x * 4;
  const data = imageData.data;
  return [
    data[startIndex],
    data[startIndex + 1],
    data[startIndex + 2],
    data[startIndex + 3],
  ];
};
