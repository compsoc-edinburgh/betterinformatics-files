import { css } from "@emotion/css";
import {
  Button,
} from "@mantine/core";
import {
  Modal,
  ModalBody,
  ModalHeader,
} from "@vseth/components";
import * as React from "react";
import { useCallback, useState } from "react";
import { ImageHandle } from "./utils/types";
import EditorHelp from "./EditorHelp";

const wideModal = css`
  width: 90vw;
  max-width: 1500px;
`;
const rowStyle = css`
  text-align: right;
  margin-left: -0.5rem;
`;
interface Props {
  onOpenOverlay: () => void;
  attachments: ImageHandle[];
  onDelete: (handle: ImageHandle) => void;
}
const EditorFooter: React.FC<Props> = ({
  attachments,
  onDelete,
  onOpenOverlay,
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const toggleHelp = useCallback(() => setIsHelpOpen(prev => !prev), []);
  return (
    <div>
      <div className={rowStyle}>
        <Button.Group>
          <Button variant="default" size="sm" onClick={toggleHelp}>
            Supported Functions
          </Button>
          <Button variant="default" size="sm" onClick={onOpenOverlay}>
            Browse Images
          </Button>
        </Button.Group>
      </div>
      <Modal isOpen={isHelpOpen} toggle={toggleHelp} className={wideModal}>
        <ModalHeader>
          <h1>Help with Editor</h1>
        </ModalHeader>
        <ModalBody>
          <EditorHelp />
        </ModalBody>
      </Modal>
    </div>
  );
};
export default EditorFooter;
