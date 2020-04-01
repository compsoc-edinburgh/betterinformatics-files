export interface Range {
  start: number;
  end: number;
}
export interface ImageHandle {
  name: string;
  src: string;
  remove: () => Promise<void>;
}
export type EditorMode = "write" | "preview";
