import { Divider, Modal, Paper } from "@mantine/core";
import * as React from "react";
import { useCallback, useRef, useState } from "react";
import ImageOverlay from "../image-overlay";
import BasicEditor from "./BasicEditor";
import DropZone from "./Dropzone";
import EditorFooter from "./EditorFooter";
import EditorHeader from "./EditorHeader";
import { ImageHandle, Range } from "./utils/types";
import { push, redo, undo, UndoStack } from "./utils/undo-stack";
import classes from "./Editor.module.css";
import clsx from "clsx";

interface Props {
  value: string;
  onChange: (newValue: string) => void;
  imageHandler: (file: File) => Promise<ImageHandle>;
  preview: (str: string) => React.ReactNode;

  undoStack: UndoStack;
  setUndoStack: (newStack: UndoStack) => void;
}

const Editor: React.FC<Props> = ({
  value,
  onChange,
  imageHandler,
  preview,
  undoStack,
  setUndoStack,
}) => {
  const [mode, setMode] = useState<string | null>("write");
  const [isDragHovered, setIsDragHovered] = useState(false);
  const [attachments, setAttachments] = useState<ImageHandle[]>([]);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const textareaElRef = useRef<HTMLTextAreaElement>(
    null,
  ) as React.MutableRefObject<HTMLTextAreaElement>;
  const setCurrent = useCallback(
    (newValue: string, newSelection?: Range) => {
      if (newSelection) setSelectionRangeRef.current(newSelection);
      onChange(newValue);
      const selection = getSelectionRangeRef.current();
      if (selection === undefined) return;
      const newStack = push(undoStack, value, selection);
      setUndoStack(newStack);
    },
    [undoStack, setUndoStack, onChange, value],
  );

  const setSelectionRangeRef = useRef<(newSelection: Range) => void>(
    (a: Range) => undefined,
  );
  const getSelectionRangeRef = useRef<() => Range | undefined>(() => ({
    start: 0,
    end: 0,
  }));

  const insertImage = useCallback(
    (handle: ImageHandle) => {
      const selection = getSelectionRangeRef.current();
      if (selection === undefined) return;
      const before = value.substring(0, selection.start);
      const content = value.substring(selection.start, selection.end);
      const after = value.substring(selection.end);
      const newContent = `![${content}](${handle.src})`;
      const newSelection = {
        start: selection.start + 2,
        end: selection.start + content.length + 2,
      };
      setCurrent(before + newContent + after, newSelection);
    },
    [setCurrent, value],
  );

  const insertImages = useCallback(
    (handles: ImageHandle[]) => {
      const selection = getSelectionRangeRef.current();
      if (selection === undefined) return;
      const before = value.substring(0, selection.start);
      const content = value.substring(selection.start, selection.end);
      const after = value.substring(selection.end);
      let newContent = ``;
      for (let i = 0; i < handles.length; i++) {
        newContent +=
          i === 0
            ? `![${content}](${handles[i].src})`
            : `![](${handles[i].src})`;
      }
      const newSelection = {
        start: selection.start + 2,
        end: selection.start + content.length + 2,
      };
      setCurrent(before + newContent + after, newSelection);
    },
    [setCurrent, value],
  );

  const insertLink = useCallback(() => {
    const selection = getSelectionRangeRef.current();
    if (selection === undefined) return;
    const before = value.substring(0, selection.start);
    const content = value.substring(selection.start, selection.end);
    const after = value.substring(selection.end);
    const newContent = `[${content}](https://www.example.com)`;
    const newSelection = {
      start: selection.start + content.length + 3,
      end: selection.start + newContent.length - 1,
    };
    setCurrent(before + newContent + after, newSelection);
  }, [setCurrent, value]);

  const wrapSelection = useCallback(
    (str: string) => {
      const selection = getSelectionRangeRef.current();
      if (selection === undefined) return;
      const before = value.substring(0, selection.start);
      const content = value.substring(selection.start, selection.end);
      const after = value.substring(selection.end);
      const newContent = str + content + str;

      if (content.length === 0) {
        const newSelection = {
          start: selection.start + str.length,
          end: selection.end + str.length,
        };
        setCurrent(before + newContent + after, newSelection);
      } else {
        const newSelection = {
          start: selection.start,
          end: selection.end + newContent.length - content.length,
        };
        setCurrent(before + newContent + after, newSelection);
      }
    },
    [setCurrent, value],
  );

  const onMathClick = useCallback(() => {
    wrapSelection("$");
  }, [wrapSelection]);

  const onCodeClick = useCallback(() => {
    wrapSelection("`");
  }, [wrapSelection]);

  const onLinkClick = useCallback(() => {
    insertLink();
  }, [insertLink]);

  const onItalicClick = useCallback(() => {
    wrapSelection("*");
  }, [wrapSelection]);

  const onBoldClick = useCallback(() => {
    wrapSelection("**");
  }, [wrapSelection]);

  const onMetaKey = useCallback(
    (key: string, shift: boolean) => {
      if (key.toLowerCase() === "b") {
        onBoldClick();
        return true;
      } else if (key.toLowerCase() === "i") {
        onItalicClick();
        return true;
      } else if (key === "z" && !shift) {
        if (undoStack.prev.length > 0) {
          const selection = getSelectionRangeRef.current();
          if (selection === undefined) return true;
          const [newState, newStack] = undo(undoStack, {
            value,
            selection,
            time: new Date(),
          });
          setUndoStack(newStack);
          onChange(newState.value);
          setSelectionRangeRef.current(newState.selection);
        }
        return true;
      } else if (key === "z" && shift) {
        if (undoStack.next.length > 0) {
          const selection = getSelectionRangeRef.current();
          if (selection === undefined) return true;
          const [newState, newStack] = redo(undoStack, {
            value,
            selection,
            time: new Date(),
          });
          setUndoStack(newStack);
          onChange(newState.value);
          setSelectionRangeRef.current(newState.selection);
        }
        return true;
      }
      return false;
    },
    [onBoldClick, onItalicClick, onChange, setUndoStack, undoStack, value],
  );

  const onDragEnter = useCallback(() => {
    setIsDragHovered(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragHovered(false);
  }, []);

  const onFile = useCallback(
    async (file: File) => {
      const handle = await imageHandler(file);
      setAttachments(a => [...a, handle]);
      insertImage(handle);
    },
    [imageHandler, insertImage],
  );

  const getHandle = useCallback(
    async (file: File) => {
      const handle = await imageHandler(file);
      setAttachments(a => [...a, handle]);
      return handle;
    },
    [imageHandler],
  );

  const onFiles = useCallback(
    (files: File[]) => {
      for (const file of files) {
        onFile(file);
      }
    },
    [onFile],
  );

  const onDeleteAttachment = useCallback(async (handle: ImageHandle) => {
    await handle.remove();
    setAttachments(a => a.filter(h => h !== handle));
  }, []);

  const onImageDialogClose = useCallback(
    (image: string) => {
      setOverlayOpen(false);
      if (image.length === 0) return;
      insertImage({
        name: image,
        src: image,
        remove: () => Promise.resolve(),
      });
    },
    [insertImage],
  );

  const onOpenOverlay = useCallback(() => {
    setOverlayOpen(true);
  }, []);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    const newValue = !isFullscreen;
    setIsFullscreen(newValue);
    // enable split mode only in fullscreen mode
    if (!newValue && mode === "split") {
      setMode("write");
    }
  }, [mode, setMode, isFullscreen, setIsFullscreen]);

  const header = (
    <EditorHeader
      onFiles={onFiles}
      activeMode={mode}
      onActiveModeChange={setMode}
      onMathClick={onMathClick}
      onCodeClick={onCodeClick}
      onLinkClick={onLinkClick}
      onItalicClick={onItalicClick}
      onBoldClick={onBoldClick}
      isFullscreen={isFullscreen}
      toggleFullscreen={toggleFullscreen}
    />
  );

  const editor = (
    <BasicEditor
      textareaElRef={textareaElRef}
      value={value}
      onChange={newValue => setCurrent(newValue)}
      setSelectionRangeRef={setSelectionRangeRef}
      getSelectionRangeRef={getSelectionRangeRef}
      onMetaKey={onMetaKey}
      resize={isFullscreen ? "fill" : "vertical"}
      onPaste={e => {
        const fileList = e.clipboardData.files;
        const filesArray: File[] = [];
        if (fileList.length === 0) return;
        for (let i = 0; i < fileList.length; i++) {
          const file = fileList.item(i);
          if (file) {
            filesArray.push(file);
          }
        }
        Promise.all(filesArray.map(getHandle)).then(insertImages);
      }}
    />
  );

  const footer = (
    <>
      <EditorFooter
        attachments={attachments}
        onDelete={onDeleteAttachment}
        onOpenOverlay={onOpenOverlay}
      />
      {isDragHovered && <DropZone onDragLeave={onDragLeave} onDrop={onFiles} />}
      <ImageOverlay
        isOpen={overlayOpen}
        onClose={() => onImageDialogClose("")}
        closeWithImage={onImageDialogClose}
      />
    </>
  );

  const editorPreview =
    mode !== "write" ? (
      isFullscreen ? (
        <div className={classes.fullscreenPreview}>
          <div className={classes.fullscreenPreviewInner}>{preview(value)}</div>
        </div>
      ) : (
        preview(value)
      )
    ) : null;

  const main = (
    <>
      {header}
      <div
        className={clsx(
          classes.editorWrapperStyle,
          isFullscreen && classes.fullscreen,
          isDragHovered && isFullscreen && classes.borderStyle,
        )}
      >
        {mode === "write" && editor}
        {mode === "preview" && editorPreview}
        {mode === "split" && (
          <div className={classes.splitViewContainer}>
            <div className={classes.splitLeftRight}>{editor}</div>
            <Divider orientation="vertical" size="xs" />
            <div className={classes.splitLeftRight}>{editorPreview}</div>
          </div>
        )}
      </div>
      {(!isFullscreen || mode !== "preview") && footer}
    </>
  );

  return (
    <div
      onClick={() => textareaElRef.current && textareaElRef.current.focus()}
      onDragEnter={onDragEnter}
    >
      {isFullscreen ? (
        <Modal
          withCloseButton={false}
          fullScreen
          opened
          onClose={toggleFullscreen}
          classNames={{
            body: classes.fullscreenContainer,
          }}
        >
          {main}
        </Modal>
      ) : (
        <Paper
          withBorder={!isDragHovered}
          p="sm"
          my="sm"
          className={clsx(isDragHovered && classes.borderStyle)}
        >
          {main}
        </Paper>
      )}
    </div>
  );
};
export default Editor;
