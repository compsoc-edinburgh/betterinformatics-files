import * as React from "react";
import { css } from "emotion";
import { useCallback } from "react";

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
      onDragLeave();
      const items = e.dataTransfer.items;
      if (items === undefined) return;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items.item ? items.item(i) : items[i];
        if (item.kind !== "file") continue;
        const file = item.getAsFile();
        if (file === null) continue;
        files.push(file);
      }
      if (files.length > 0) {
        onDrop(files);
      }
    },
    [onDrop, onDragLeave],
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
      className="position-cover"
      onDragLeave={onDragLeaveHandler}
      onDrop={onDropHandler}
      onDragOver={onDragOverHandler}
    />
  );
};
export default DropZone;
