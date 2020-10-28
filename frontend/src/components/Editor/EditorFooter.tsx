import {
  Button,
  ButtonGroup,
  Modal,
  ModalBody,
  ModalHeader,
} from "@vseth/components";
import { css } from "emotion";
import * as React from "react";
import { useCallback, useRef, useState } from "react";
import { ImageHandle } from "./utils/types";

const rowStyle = css`
  text-align: right;
`;
const fileInputStyle = css`
  visibility: hidden;
  display: none;
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
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const toggleHelp = useCallback(() => setIsHelpOpen(prev => !prev), []);
  return (
    <div>
      <div className={rowStyle}>
        <ButtonGroup>
          <Button size="sm" onClick={toggleHelp}>
            Help
          </Button>

          <Button size="sm" onClick={onOpenOverlay}>
            Browse Images
          </Button>
          <Button size="sm" onClick={onFile}>
            Add Image
          </Button>
        </ButtonGroup>
        <input
          type="file"
          className={fileInputStyle}
          ref={fileInputRef}
          onChange={onChangeHandler}
        />
      </div>
      <Modal isOpen={isHelpOpen} toggle={toggleHelp}>
        <ModalHeader>Help</ModalHeader>
        <ModalBody>
          You can use Markdown. Use ``` code ``` for code. Use $ math $ or $$ \n
          math \n $$ for latex math.
        </ModalBody>
      </Modal>
    </div>
  );
};
export default EditorFooter;
