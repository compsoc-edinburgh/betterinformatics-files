export interface Range {
  start: number;
  end: number;
}
export interface ImageHandle {
  name: string;
  src: string;
  remove: () => Promise<void>;
}
export type EditorMode = "write" | "preview" | "split";

/**
 * Determines how the editor is resized. If 'vertical', the editor will
 * resize vertically to fit the content. If 'fill', the editor will not
 * resize and take up the full height of its container.
 */
export type EditorSizingMode = "fill" | "vertical";
