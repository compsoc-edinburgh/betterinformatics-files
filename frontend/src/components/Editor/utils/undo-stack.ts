import { Range } from "./types";

export interface UndoState {
  value: string;
  selection: Range;
}
export interface UndoStack {
  prev: UndoState[];
  next: UndoState[];
}
export const push = (
  prevStack: UndoStack,
  value: string,
  selection: Range,
) => ({
  prev: [...prevStack.prev, { value, selection }],
  next: [],
});
export const undo = (prevStack: UndoStack, currentState: UndoState) =>
  [
    prevStack.prev[prevStack.prev.length - 1],
    {
      prev: prevStack.prev.slice(0, -1),
      next: [...prevStack.next, currentState],
    },
  ] as [UndoState, UndoStack];

export const redo = (prevStack: UndoStack, currentState: UndoState) =>
  [
    prevStack.next[prevStack.next.length - 1],
    {
      prev: [...prevStack.prev, currentState],
      next: prevStack.next.slice(0, -1),
    },
  ] as [UndoState, UndoStack];
