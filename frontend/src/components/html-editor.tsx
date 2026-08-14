import React, { useRef, useState } from "react";
import { ImageHandle, Range } from "./Editor/utils/types";
import { Button, Tabs, Textarea } from "@mantine/core";
import ImageOverlay from "./image-overlay";
import { push, redo, undo, UndoStack } from "./Editor/utils/undo-stack";
import DropZone from "./Editor/Dropzone";

interface Props {
  value: string;
  onChange: (newValue: string) => void;
  imageHandler: (file: File) => Promise<ImageHandle>;
  preview: (str: string) => React.ReactNode;

  undoStack: UndoStack;
  setUndoStack: (newStack: UndoStack) => void;
}

export const HtmlEditor: React.FC<Props> = ({
  value,
  onChange,
  imageHandler,
  preview,
  undoStack,
  setUndoStack,
}) => {
  const [mode, setMode] = useState<string | null>("write");

  const textareaElRef = useRef<HTMLTextAreaElement>(null);
  const setCurrent = (newValue: string, newSelection?: Range) => {
    if (newSelection) setSelectionRange(newSelection);
    onChange(newValue);
    const selection = getSelectionRange();
    if (selection === undefined) return;
    const newStack = push(undoStack, value, selection);
    setUndoStack(newStack);
  };

  const setSelectionRange = (newSelection: Range) => {
    const textarea = textareaElRef.current;
    if (textarea === null) return;
    setTimeout(() => {
      textarea.selectionStart = newSelection.start;
      textarea.selectionEnd = newSelection.end;
    }, 0);
  };
  const getSelectionRange = () => {
    const textarea = textareaElRef.current;
    if (textarea === null) return;
    return {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    };
  };

  const [imageOverlayOpen, setImageOverlayOpen] = useState(false);
  const [isDragHovered, setIsDragHovered] = useState(false);

  const insertImage = (handle: ImageHandle) => {
    const selection = getSelectionRange();
    if (selection === undefined) return;
    const before = value.substring(0, selection.start);
    const content = value.substring(selection.start, selection.end);
    const after = value.substring(selection.end);
    const newContent = `<img src="/api/image/get/${handle.src}/" alt="${content}" />`;
    const newSelection = {
      start: selection.start + 2,
      end: selection.start + content.length + 2,
    };
    setCurrent(before + newContent + after, newSelection);
  };

  const onImageDialogClose = (image: string) => {
    setImageOverlayOpen(false);
    if (image.length === 0) return;
    insertImage({
      name: image,
      src: image,
      remove: () => Promise.resolve(),
    });
  };

  const onMetaKey = (key: string, shift: boolean) => {
    if (key === "z" && !shift) {
      if (undoStack.prev.length > 0) {
        const selection = getSelectionRange();
        if (selection === undefined) return true;
        const [newState, newStack] = undo(undoStack, {
          value,
          selection,
          time: new Date(),
        });
        setUndoStack(newStack);
        onChange(newState.value);
        setSelectionRange(newState.selection);
      }
      return true;
    } else if (key === "z" && shift) {
      if (undoStack.next.length > 0) {
        const selection = getSelectionRange();
        if (selection === undefined) return true;
        const [newState, newStack] = redo(undoStack, {
          value,
          selection,
          time: new Date(),
        });
        setUndoStack(newStack);
        onChange(newState.value);
        setSelectionRange(newState.selection);
      }
      return true;
    }
    return false;
  };

  const onTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (onMetaKey(e.key.toLowerCase(), e.shiftKey)) {
        e.preventDefault();
      }
    }
  };

  const onFile = async (file: File) => {
    const handle = await imageHandler(file);
    insertImage(handle);
  };
  const onFiles = async (files: File[]) => {
    for (const file of files) {
      await onFile(file);
    }
  };

  const onDragEnter = () => {
    setIsDragHovered(true);
  };

  const onDragLeave = () => {
    setIsDragHovered(false);
  };

  return (
    <div>
      <Tabs value={mode} onChange={setMode}>
        <Tabs.List>
          <Tabs.Tab value="write">Write</Tabs.Tab>
          <Tabs.Tab value="preview">Preview</Tabs.Tab>
        </Tabs.List>
      </Tabs>
      {mode === "preview" && <div>{preview(value)}</div>}
      {mode === "write" && (
        <div onDragEnter={onDragEnter}>
          <Textarea
            ref={textareaElRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            minRows={10}
            autosize
            styles={{
              input: {
                fontFamily: "monospace",
                fontSize: "0.75rem",
                outline: isDragHovered ? "2px dashed #aaa" : "none",
              },
            }}
            spellCheck={false}
            my="sm"
            onKeyDown={onTextareaKeyDown}
            onPaste={e => {
              const fileList = e.clipboardData.files;
              void onFiles([...fileList]);
            }}
          />
          {isDragHovered && (
            <DropZone onDragLeave={onDragLeave} onDrop={f => void onFiles(f)} />
          )}
          <Button
            variant="default"
            size="sm"
            onClick={() => setImageOverlayOpen(true)}
            mb="sm"
          >
            Browse Images
          </Button>
          <ImageOverlay
            isOpen={imageOverlayOpen}
            onClose={() => onImageDialogClose("")}
            closeWithImage={onImageDialogClose}
          />
        </div>
      )}
    </div>
  );
};
