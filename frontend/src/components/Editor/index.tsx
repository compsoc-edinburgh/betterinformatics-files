import * as React from "react";
import { useCallback, useState, useRef } from "react";
import { css, cx } from "emotion";
import { Range, EditorMode, ImageHandle } from "./utils/types";
import BasicEditor from "./BasicEditor";
import EditorHeader from "./EditorHeader";
import DropZone from "./Dropzone";
import EditorFooter from "./EditorFooter";
import ImageOverlay from "../image-overlay";

const editorWrapperStyle = css`
  padding: 1.2em;
`;

const wrapperStyle = css`
  position: relative;
  border: 1px solid transparent;
`;
const dragHoveredWrapperStyle = css`
  border: 1px solid #fed330;
  border-radius: 3px;
`;
interface Props {
  value: string;
  onChange: (newValue: string) => void;
  imageHandler: (file: File) => Promise<ImageHandle>;
  preview: (str: string) => React.ReactNode;
}
const Editor: React.FC<Props> = ({
  value,
  onChange,
  imageHandler,
  preview,
}) => {
  const [mode, setMode] = useState<EditorMode>("write");
  const [isDragHovered, setIsDragHovered] = useState(false);
  const [attachments, setAttachments] = useState<ImageHandle[]>([]);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const setSelectionRangeRef = useRef<(newSelection: Range) => void>(
    (a: Range) => undefined,
  );
  const getSelectionRangeRef = useRef<() => Range>(() => ({
    start: 0,
    end: 0,
  }));

  const insertImage = useCallback(
    (handle: ImageHandle) => {
      const selection = getSelectionRangeRef.current();
      const before = value.substring(0, selection.start);
      const content = value.substring(selection.start, selection.end);
      const after = value.substring(selection.end);
      const newContent = "![" + content + `](${handle.src})`;
      onChange(before + newContent + after);
      setSelectionRangeRef.current({
        start: selection.start + 2,
        end: selection.start + content.length + 2,
      });
    },
    [onChange, value],
  );

  const insertLink = useCallback(() => {
    const selection = getSelectionRangeRef.current();
    const before = value.substring(0, selection.start);
    const content = value.substring(selection.start, selection.end);
    const after = value.substring(selection.end);
    const newContent = "[" + content + "](https://www.example.com)";
    onChange(before + newContent + after);
    setSelectionRangeRef.current({
      start: selection.start + 1,
      end: selection.start + content.length + 1,
    });
  }, [onChange, value]);

  const wrapSelection = useCallback(
    (str: string) => {
      const selection = getSelectionRangeRef.current();
      const before = value.substring(0, selection.start);
      const content = value.substring(selection.start, selection.end);
      const after = value.substring(selection.end);
      const newContent = str + content + str;
      onChange(before + newContent + after);
      if (content.length === 0) {
        setSelectionRangeRef.current({
          start: selection.start + str.length,
          end: selection.end + str.length,
        });
      } else {
        setSelectionRangeRef.current({
          start: selection.start,
          end: selection.end + newContent.length - content.length,
        });
      }
    },
    [onChange, value],
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
    (key: string) => {
      if (key === "b") {
        onBoldClick();
        return true;
      } else if (key === "i") {
        onItalicClick();
        return true;
      }
      return false;
    },
    [onBoldClick, onItalicClick],
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

  const onFiles = useCallback(
    (files: File[]) => {
      for (const file of files) {
        onFile(file);
      }
    },
    [onFile],
  );

  const onDrop = useCallback(
    (files: File[]) => {
      onFiles(files);
    },
    [onFiles],
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

  return (
    <>
      <div
        className={cx(wrapperStyle, isDragHovered && dragHoveredWrapperStyle)}
        onDragEnter={onDragEnter}
      >
        <EditorHeader
          activeMode={mode}
          onActiveModeChange={setMode}
          onMathClick={onMathClick}
          onCodeClick={onCodeClick}
          onLinkClick={onLinkClick}
          onItalicClick={onItalicClick}
          onBoldClick={onBoldClick}
        />
        <div className={editorWrapperStyle}>
          {mode === "write" ? (
            <BasicEditor
              value={value}
              onChange={onChange}
              setSelectionRangeRef={setSelectionRangeRef}
              getSelectionRangeRef={getSelectionRangeRef}
              onMetaKey={onMetaKey}
            />
          ) : (
            preview(value)
          )}
        </div>
        <EditorFooter
          onFiles={onFiles}
          attachments={attachments}
          onDelete={onDeleteAttachment}
          onOpenOverlay={onOpenOverlay}
        />
        {isDragHovered && (
          <DropZone onDragLeave={onDragLeave} onDrop={onFiles} />
        )}
      </div>
      {overlayOpen && <ImageOverlay onClose={onImageDialogClose} />}
    </>
  );
};
export default Editor;
