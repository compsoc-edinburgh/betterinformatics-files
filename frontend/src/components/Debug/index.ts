import { createContext } from "react";
export interface DebugOptions {
  displayAllTooltips: boolean;
  displayCanvasType: boolean;
  viewOptimalCutAreas: boolean;
}
export const defaultDebugOptions: DebugOptions = {
  displayAllTooltips: false,
  displayCanvasType: false,
  viewOptimalCutAreas: false,
};
export const DebugContext = createContext(defaultDebugOptions);
