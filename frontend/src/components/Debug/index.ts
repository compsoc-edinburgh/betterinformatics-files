import { createContext } from "react";
export interface DebugOptions {
  displayCanvasType: boolean;
  viewOptimalCutAreas: boolean;
}
export const defaultDebugOptions: DebugOptions = {
  displayCanvasType: false,
  viewOptimalCutAreas: false,
};
export const DebugContext = createContext(defaultDebugOptions);
