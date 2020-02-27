import * as React from "react";
import { css } from "emotion";
import { useCallback } from "react";

const dropZoneStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

interface Props {
  onDragLeave: () => void;
  onDrop: (files: File[]) => void;
}

const DropZone: React.FC<Props> = ({ onDragLeave, onDrop }) => {
  const onDragLeaveHandler = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onDragLeave();
    },
    [onDragLeave],
  );
  const onDropHandler = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const items = e.dataTransfer.items;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items.item(i);
        if (item.kind !== "file") continue;
        const file = item.getAsFile();
        if (file === null) continue;
        files.push(file);
      }
      if (files.length > 0) {
        onDrop(files);
      }
    },
    [onDrop],
  );
  const onDragOverHandler = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
    },
    [],
  );
  return (
    <div
      className={dropZoneStyle}
      onDragLeave={onDragLeaveHandler}
      onDrop={onDropHandler}
      onDragOver={onDragOverHandler}
    />
  );
};
export default DropZone;
