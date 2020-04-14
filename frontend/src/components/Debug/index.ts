import { createContext } from "react";
export interface DebugOptions {
  displayAllTooltips: boolean;
  displayCanvasType: boolean;
}
export const defaultDebugOptions: DebugOptions = {
  displayAllTooltips: false,
  displayCanvasType: false,
};
export const DebugContext = createContext(defaultDebugOptions);
