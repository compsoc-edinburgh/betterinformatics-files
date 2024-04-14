import * as React from "react";
import { useRef, useCallback, useEffect } from "react";
import { EditorSizingMode, Range } from "./utils/types";
import classes from "./BasicEditor.module.css";
import clsx from "clsx";

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
    <div
      className={clsx(classes.wrapper, resize === "fill" && classes.fullHeight)}
    >
      {resize === "vertical" && (
        <pre ref={preElRef} className={clsx(classes.common, classes.pre)}>
          {`${value}\n`}
        </pre>
      )}
      <textarea
        value={value}
        onChange={onTextareaChange}
        onKeyDown={onTextareaKeyDown}
        onPaste={onPaste}
        ref={textareaElRef}
        className={clsx(
          classes.common,
          classes.textarea,
          resize === "fill" && classes.fullHeight,
        )}
      />
    </div>
  );
};
export default BasicEditor;
