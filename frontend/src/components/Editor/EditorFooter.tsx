import { Button, Group, Modal } from "@mantine/core";
import * as React from "react";
import { useCallback, useState } from "react";
import { ImageHandle } from "./utils/types";
import EditorHelp from "./EditorHelp";
import classes from "./EditorFooter.module.css";
import { useDisclosure } from "@mantine/hooks";

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
  const [isHelpOpen, {toggle: toggleHelpModal, close: closeHelpModal}] = useDisclosure();
  return (
    <div>
      <Group justify="right" className={classes.row}>
        <Button.Group>
          <Button variant="default" size="sm" onClick={toggleHelpModal}>
            Supported Functions
          </Button>
          <Button variant="default" size="sm" onClick={onOpenOverlay}>
            Browse Images
          </Button>
        </Button.Group>
      </Group>
      <Modal
        title="Help with Editor"
        opened={isHelpOpen}
        onClose={closeHelpModal}
        size="min(90vw, 1500px)"
      >
        <Modal.Body>
          <EditorHelp />
        </Modal.Body>
      </Modal>
    </div>
  );
};
export default EditorFooter;
