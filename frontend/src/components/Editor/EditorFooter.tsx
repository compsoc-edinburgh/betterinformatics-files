import * as React from "react";
import { css } from "emotion";
import { useRef, useCallback } from "react";
import { Image as ImageIcon, Plus } from "react-feather";
import { ImageHandle } from "./utils/types";

const addImageIconStyle = css`
  margin: 0;
  border: none;
  cursor: pointer;
  background-color: transparent;
  padding: 6px;
`;
const footerStyle = css`
  border-top: 1px solid rgba(0, 0, 0, 0.1);
`;
const rowStyle = css`
  display: flex;
  flex-direction: row;
  align-items: center;
`;
const spacer = css`
  flex-grow: 1;
`;
const fileInputStyle = css`
  visibility: hidden;
  display: none;
`;
const addImageButtonStyle = css`
  border: none;
  background-color: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: rgba(0, 0, 0, 0.4);
  transition: color 0.1s;
  &:hover {
    color: rgba(0, 0, 0, 0.8);
  }
`;
const addImageTextStyle = css`
  font-size: 12px;
`;
interface Props {
  onFiles: (files: File[]) => void;
  onOpenOverlay: () => void;
  attachments: ImageHandle[];
  onDelete: (handle: ImageHandle) => void;
}
const EditorFooter: React.FC<Props> = ({
  onFiles,
  attachments,
  onDelete,
  onOpenOverlay,
}) => {
  const iconSize = 15;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback(() => {
    const fileInput = fileInputRef.current;
    if (fileInput === null) return;
    fileInput.click();
  }, []);
  const onChangeHandler = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileInput = fileInputRef.current;
      if (fileInput === null) return;
      const fileList = fileInput.files;
      if (fileList === null) return;
      const files: File[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList.item(i);
        if (file === null) continue;
        files.push(file);
      }
      onFiles(files);
      fileInput.value = "";
    },
    [onFiles],
  );
  return (
    <div className={footerStyle}>
      <div className={rowStyle}>
        <div className={spacer} />
        <button onClick={onOpenOverlay} className={addImageButtonStyle} type="button">
          <div className={addImageIconStyle}>
            <ImageIcon size={iconSize} />
          </div>
          <div className={addImageTextStyle}>Browse Images</div>
        </button>
        <button onClick={onFile} className={addImageButtonStyle} type="button">
          <div className={addImageIconStyle}>
            <Plus size={iconSize} />
          </div>
          <div className={addImageTextStyle}>Add Image</div>
        </button>
        <input
          type="file"
          className={fileInputStyle}
          ref={fileInputRef}
          onChange={onChangeHandler}
        />
      </div>
      <small>
        You can use Markdown. Use ``` code ``` for code. Use $ math $ or $$ \n
        math \n $$ for latex math.
      </small>
    </div>
  );
};
export default EditorFooter;
