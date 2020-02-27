import * as React from "react";
import { useRef, useCallback, useEffect } from "react";
import { css, cx } from "emotion";
import { Range } from "./utils/types";

const wrapperStyle = css`
  position: relative;
`;
const commonStyle = css`
  font-family: Arial, Helvetica, sans-serif;
  font-size: 14px;
  white-space: pre-wrap;
  word-wrap: break-word;
  width: 100%;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
`;
const textareaStyle = css`
  position: absolute;
  top: 0;
  color: black;
  caret-color: inherit;
  background: transparent;
  resize: none;
  border: none;
  &:focus {
    outline: none;
  }
`;
const preStyle = css`
  user-select: none;
  color: transparent;
`;

interface Props {
  value: string;
  onChange: (newValue: string) => void;

  selection: Range;
  onSelectionChange: (newSelection: Range) => void;

  onMetaKey: (str: string) => boolean;
}
const BasicEditor: React.FC<Props> = ({
  value,
  onChange,
  selection,
  onSelectionChange,
  onMetaKey,
}) => {
  const textareaElRef = useRef<HTMLTextAreaElement>(null);
  const preElRef = useRef<HTMLPreElement>(null);

  const ignoreSelectionStart =
    textareaElRef.current !== null &&
    textareaElRef.current.selectionStart === selection.start;
  const ignoreSelectionEnd =
    textareaElRef.current !== null &&
    textareaElRef.current.selectionEnd === selection.end;

  const selectionchangeListener = useCallback(() => {
    const textareaEl = textareaElRef.current;
    if (textareaEl === null) return;
    const activeElement = document.activeElement;
    if (activeElement === textareaEl) {
      const range = {
        start: textareaEl.selectionStart,
        end: textareaEl.selectionEnd,
      };
      onSelectionChange(range);
    }
  }, [onSelectionChange]);

  const onTextareaChange = useCallback(
    e => {
      selectionchangeListener();
      const newContent = e.currentTarget.value;
      onChange(newContent);
    },
    [onChange, selectionchangeListener],
  );

  const onTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.ctrlKey || e.metaKey) {
        if (onMetaKey(e.key)) {
          e.preventDefault();
        }
      }
    },
    [onMetaKey],
  );

  useEffect(() => {
    document.addEventListener("selectionchange", selectionchangeListener);
    return () =>
      document.removeEventListener("selectionchange", selectionchangeListener);
  }, [selectionchangeListener]);

  const onResize = useCallback(() => {
    const textareaEl = textareaElRef.current;
    if (textareaEl === null) return;
    const preEl = preElRef.current;
    if (preEl === null) return;
    textareaEl.style.height = `${preEl.clientHeight}px`;
  }, []);

  useEffect(() => {
    onResize();
  }, [value, onResize]);

  useEffect(() => {
    const textareaEl = textareaElRef.current;
    if (textareaEl === null) return;
    if (
      textareaEl.selectionStart !== selection.start &&
      !ignoreSelectionStart
    ) {
      setTimeout(() => {
        textareaEl.selectionStart = selection.start;
      }, 0);
    }
    if (textareaEl.selectionEnd !== selection.end && !ignoreSelectionEnd) {
      setTimeout(() => {
        textareaEl.selectionEnd = selection.end;
      }, 0);
    }
  }, [selection, ignoreSelectionStart, ignoreSelectionEnd]);

  return (
    <div className={wrapperStyle}>
      <pre ref={preElRef} className={cx(commonStyle, preStyle)}>
        {value + "\n"}
      </pre>
      <textarea
        value={value}
        onChange={onTextareaChange}
        onKeyDown={onTextareaKeyDown}
        ref={textareaElRef}
        className={cx(commonStyle, textareaStyle)}
      />
    </div>
  );
};
export default BasicEditor;
