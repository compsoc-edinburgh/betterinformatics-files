import { Range } from "./types";

export interface UndoState {
  value: string;
  selection: Range;
  time: Date;
}
export interface UndoStack {
  prev: UndoState[];
  next: UndoState[];
}
/**
 * Determines if the two `UndoState` instances `a` and `b` can be merged.
 * Currently only states can be merged where at most a single line was
 * changed and in that line only a single word was appended.
 * @param a
 * @param b
 */
const canBeMerged = (a: UndoState, b: UndoState) => {
  const timeDiff = Math.abs(a.time.getTime() - b.time.getTime());
  if (timeDiff > 10000) return false;
  const aLines = a.value.split(/[\r\n]+/);
  const bLines = b.value.split(/[\r\n]+/);
  if (aLines.length !== bLines.length) return false;
  let changeLine = -1;
  for (let i = 0; i < aLines.length; i++) {
    if (aLines[i] === bLines[i]) continue;
    if (changeLine !== -1) return false;
    changeLine = i;
  }
  if (changeLine === -1) return true;
  const aLine = aLines[changeLine];
  const bLine = bLines[changeLine];
  const [baseContent, newContent] =
    aLine.length < bLine.length ? [aLine, bLine] : [bLine, aLine];
  if (newContent.indexOf(baseContent) !== 0) return false;
  const diff = newContent.substring(baseContent.length);
  const words = diff.split(/\b/);
  const res = words.length <= 1;
  return res;
};
export const push = (prevStack: UndoStack, value: string, selection: Range) =>
  prevStack.prev.length > 0 &&
  canBeMerged(prevStack.prev[prevStack.prev.length - 1], {
    value,
    selection,
    time: new Date(),
  })
    ? {
        prev: prevStack.prev,
        next: [],
      }
    : {
        prev: [...prevStack.prev, { value, selection, time: new Date() }],
        next: [],
      };
export const undo = (prevStack: UndoStack, currentState: UndoState) =>
  [
    prevStack.prev[prevStack.prev.length - 1],
    {
      prev: prevStack.prev.slice(0, -1),
      next: [...prevStack.next, currentState].slice(-100),
    },
  ] as [UndoState, UndoStack];

export const redo = (prevStack: UndoStack, currentState: UndoState) =>
  [
    prevStack.next[prevStack.next.length - 1],
    {
      prev: [...prevStack.prev, currentState].slice(-100),
      next: prevStack.next.slice(0, -1),
    },
  ] as [UndoState, UndoStack];
