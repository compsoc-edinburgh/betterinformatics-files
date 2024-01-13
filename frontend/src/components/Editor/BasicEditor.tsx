import * as React from "react";
import { useRef, useCallback, useEffect } from "react";
import { css, cx } from "@emotion/css";
import { EditorSizingMode, Range } from "./utils/types";

const wrapperStyle = css`
  position: relative;
`;
const commonStyle = css`
  font-family: "Fira Code", monospace;
  font-size: 0.875rem;
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
const fullHeightStyle = css`
  height: 100%;
`;

interface Props {
  value: string;
  onChange: (newValue: string) => void;

  getSelectionRangeRef: React.RefObject<() => Range | undefined>;
  setSelectionRangeRef: React.RefObject<(newSelection: Range) => void>;

  textareaElRef: React.MutableRefObject<HTMLTextAreaElement>;

  onMetaKey: (str: string, shift: boolean) => boolean;
  onPaste: React.ClipboardEventHandler<HTMLTextAreaElement>;

  resize: EditorSizingMode;
}
const BasicEditor: React.FC<Props> = ({
  value,
  onChange,
  getSelectionRangeRef,
  setSelectionRangeRef,
  textareaElRef,
  onMetaKey,
  onPaste,
  resize,
}) => {
  const preElRef = useRef<HTMLPreElement>(null);

  // tslint:disable-next-line: no-any
  (getSelectionRangeRef as any).current = () => {
    const textarea = textareaElRef.current;
    if (textarea === null) return;
    return {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    };
  };

  // tslint:disable-next-line: no-any
  (setSelectionRangeRef as any).current = (newSelection: Range) => {
    const textarea = textareaElRef.current;
    if (textarea === null) return;
    setTimeout(() => {
      textarea.selectionStart = newSelection.start;
      textarea.selectionEnd = newSelection.end;
    }, 0);
  };

  const onTextareaChange = useCallback(
    (e: React.FormEvent<HTMLTextAreaElement>) => {
      const newContent = e.currentTarget!.value;
      onChange(newContent);
    },
    [onChange],
  );

  const onTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.ctrlKey || e.metaKey) {
        if (onMetaKey(e.key.toLowerCase(), e.shiftKey)) {
          e.preventDefault();
        }
      }
    },
    [onMetaKey],
  );

  useEffect(() => {
    const textareaEl = textareaElRef.current;
    if (resize === "fill" || textareaEl === null) {
      return;
    }

    const preEl = preElRef.current;
    if (preEl === null) return;
    textareaEl.style.height = `${preEl.clientHeight}px`;
  }, [value, textareaElRef, resize]);

  return (
    <div className={cx(wrapperStyle, resize === "fill" && fullHeightStyle)}>
      {resize === "vertical" && (
        <pre ref={preElRef} className={cx(commonStyle, preStyle)}>
          {`${value}\n`}
        </pre>
      )}
      <textarea
        value={value}
        onChange={onTextareaChange}
        onKeyDown={onTextareaKeyDown}
        onPaste={onPaste}
        ref={textareaElRef}
        className={cx(
          commonStyle,
          textareaStyle,
          resize === "fill" && fullHeightStyle,
        )}
      />
    </div>
  );
};
export default BasicEditor;
